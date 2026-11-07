"""
Ghiền Đọc Comment - AI Video Maker (v2.0)
FastAPI server: điều phối các module trong tvcore/.

Cấu trúc:
  tvcore/config.py   - hằng số & đường dẫn
  tvcore/utils.py    - tiện ích chung (wrap text, ffprobe, sniff mime)
  tvcore/tts.py      - Edge-TTS + cache + chuẩn hoá viết tắt
  tvcore/cards.py    - vẽ thẻ giao diện Threads bằng Pillow
  tvcore/render.py   - engine render FFmpeg
  tvcore/scrape.py   - cào dữ liệu Threads bằng Playwright
  tvcore/jobs.py     - hàng đợi render nền + tiến trình
  tvcore/uploads.py  - kiểm tra file upload an toàn
"""
import asyncio
import os
from pathlib import Path
import shutil
import sys
from contextlib import asynccontextmanager
from typing import List, Optional

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse, StreamingResponse, HTMLResponse
from tvcore.studio import StudioStyle, StudioSceneMedia, catalogue
from tvcore.media_planner import MediaPlan
from tvcore.voices import reference_voices, validate_synthesis_voice
from tvcore.html_cards import card_html
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

from tvcore import jobs
from tvcore.analytics import (delete_preset, get_stats, list_presets,
                              record_analytics, record_render, record_scrape,
                              save_preset)
from tvcore.cleanup import MAX_OUTPUT_VIDEOS, cleanup_old_videos, outputs_disk_usage_mb
from tvcore.config import (
    APP_ROOT, AUDIO_EXTS, BG_EXTS, BGM_DIR, BACKGROUNDS_DIR, IMAGE_EXTS,
    MAX_DISPLAY_CHARS, MAX_SCENES, MEME_EXTS, MEMES_DIR, OUTPUTS_DIR,
    RESOLUTIONS, WORK_ROOT, ensure_dirs, ensure_ffmpeg_in_path,
    ensure_playwright_browsers,
)
from tvcore.content import analyze_post, select_comments
from tvcore.hook import auto_generate_hook_cta
from tvcore.pacing import plan_timeline
from tvcore.qc import check_rights, check_script, check_video
from tvcore.render import render_video
from tvcore.scrape import clear_scrape_cache, discover_posts, scrape_threads_post
from tvcore.script import auto_generate_script
from tvcore.tts import (
    AVAILABLE_VOICES, clear_tts_cache, convert_tts_with_gemini, local_slang_to_tts, make_tts_audio,
)
from tvcore.uploads import UploadError, build_dest, validate_upload
from tvcore.utils import scene_to_dict, ffmpeg_bin

# ---------------------------------------------------------------------------
# Khởi tạo môi trường
# ---------------------------------------------------------------------------
ensure_dirs()
ensure_ffmpeg_in_path()
ensure_playwright_browsers()

if sys.platform == "win32":
    try:
        if sys.stdout and hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        if sys.stderr and hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
    except Exception:
        pass

@asynccontextmanager
async def app_lifespan(app):
    jobs.initialize(recover=True)
    yield


app = FastAPI(title="Ghiền Đọc Comment - AI Video Maker", version="3.1", lifespan=app_lifespan)

# Chỉ cho 1 render chạy đồng thời (tránh tranh chấp edge-tts + CPU).
# Được tạo lazily vì asyncio.Lock cần event loop.
_render_lock: Optional[asyncio.Lock] = None


def _get_render_lock() -> asyncio.Lock:
    global _render_lock
    if _render_lock is None:
        _render_lock = asyncio.Lock()
    return _render_lock


app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/memes", StaticFiles(directory=str(MEMES_DIR)), name="memes")
app.mount("/bgm", StaticFiles(directory=str(BGM_DIR)), name="bgm")
app.mount("/backgrounds", StaticFiles(directory=str(BACKGROUNDS_DIR)), name="backgrounds")


# ==========================================
# DATA MODELS
# ==========================================
class SceneItem(BaseModel):
    studio_media: Optional[StudioSceneMedia] = None
    selected: bool = True
    author: str = ""
    time_ago: str = "1 ngày"
    display_text: str = ""
    tts_text: str = ""
    reply_author: Optional[str] = None
    reply_display_text: Optional[str] = None
    reply_tts_text: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: bool = False
    likes: str = ""
    comments: str = ""
    reposts: str = ""
    shares: str = ""
    author_liked: bool = True
    meme_file: Optional[str] = None

    # Bổ sung: validate độ dài để tránh payload quá lớn
    @field_validator("display_text", "tts_text", mode="before")
    @classmethod
    def _validate_text(cls, v):
        """Cắt bớt text quá dài (MAX_DISPLAY_CHARS) để tránh payload lớn."""
        if v is None:
            return v
        v = str(v)
        if len(v) > MAX_DISPLAY_CHARS:
            return v[:MAX_DISPLAY_CHARS]
        return v

    @field_validator("reply_display_text", "reply_tts_text", mode="before")
    @classmethod
    def _validate_reply_text(cls, v):
        """Giới hạn độ dài cho phần reply (nếu có)."""
        if v is None:
            return v
        v = str(v)
        if len(v) > MAX_DISPLAY_CHARS:
            return v[:MAX_DISPLAY_CHARS]
        return v


class ScrapeRequest(BaseModel):
    url: str
    max_comments: int = Field(default=7, ge=1, le=30)
    gemini_api_key: Optional[str] = None


class NormalizeRequest(BaseModel):
    scenes: List[SceneItem]
    api_key: Optional[str] = None


class HookCtaRequest(BaseModel):
    scenes: List[SceneItem]
    api_key: Optional[str] = None


class ScriptRequest(BaseModel):
    """Sinh kịch bản đầy đủ + phân tích nội dung (Giai đoạn 2)."""
    scenes: List[SceneItem]
    api_key: Optional[str] = None
    n_hooks: int = Field(default=3, ge=1, le=5)


class AnalyzeRequest(BaseModel):
    """Phân tích bài viết + chấm điểm/lọc bình luận (Giai đoạn 1)."""
    scenes: List[SceneItem]
    max_comments: int = Field(default=5, ge=1, le=30)
    min_score: float = Field(default=0.18, ge=0.0, le=1.0)


class QcRequest(BaseModel):
    """Kiểm tra chất lượng trước khi xuất (Giai đoạn 4)."""
    scenes: List[SceneItem]
    watermark_text: str = ""
    speed: str = "+20%"


class QcVideoRequest(BaseModel):
    filename: str
    expected_duration: Optional[float] = None


class AnalyticsRequest(BaseModel):
    filename: str
    views: int = 0
    likes: int = 0
    comments: int = 0
    shares: int = 0
    watch_time_avg: Optional[float] = None


class PresetRequest(BaseModel):
    name: str
    config: dict = Field(default_factory=dict)


class TimelineRequest(BaseModel):
    scenes: List[SceneItem]
    speed: str = "+20%"
    target_seconds: Optional[float] = None


class RenderRequest(BaseModel):
    client_request_id: Optional[str] = Field(default=None, max_length=80)
    retry_of: Optional[str] = Field(default=None, max_length=80)
    studio_style: StudioStyle = Field(default_factory=StudioStyle)
    auto_hook: bool = True
    studio_silent: bool = False
    scenes: List[SceneItem]
    voice: str = "vi-VN-HoaiMyNeural"
    speed: str = "+20%"
    watermark_text: str = "Fanpage: Ghiền đọc comment"
    moving_watermark: bool = True
    bg_video_path: Optional[str] = "random"
    bgm_path: Optional[str] = None
    bgm_volume: float = 0.12
    resolution: str = "1080x1920"
    hook_text: Optional[str] = None
    bg_brightness: float = 1.0
    bg_blur: int = 0
    auto_split: bool = True
    cta_text: Optional[str] = None
    gemini_api_key: Optional[str] = None
    # --- Giai đoạn 1-2: tuỳ chọn mới (bật/tắt độc lập) ---
    smart_filter: bool = True          # lọc & chấm điểm bình luận
    min_comment_score: float = 0.18    # ngưỡng điểm bình luận tối thiểu
    transition_text: Optional[str] = None   # lời dẫn chuyển sang bình luận
    editorial_text: Optional[str] = None    # nhận xét biên tập
    target_duration: Optional[float] = None  # thời lượng đích (giây)
    zoom_effect: bool = True            # hiệu ứng zoom nhẹ
    skip_qc: bool = False               # bỏ qua kiểm tra chất lượng

    @field_validator("speed")
    @classmethod
    def rate_format(cls, value):
        import re
        if not re.fullmatch(r"[+-]\d{1,3}%", value) or not -50 <= int(value[:-1]) <= 100:
            raise ValueError("Nhịp đọc phải là phần trăm có dấu, trong khoảng -50% đến +100%")
        return value

    @field_validator("resolution", mode="before")
    @classmethod
    def _check(cls, v):
        """Chỉ chấp nhận resolution có trong RESOLUTIONS, sai thì về mặc định."""
        if v not in RESOLUTIONS:
            return "1080x1920"
        return v

    @field_validator("voice")
    @classmethod
    def _check_voice(cls, v):
        """Chỉ chấp nhận 2 giọng đọc có sẵn của tool."""
        return validate_synthesis_voice(v)


class DiscoverRequest(BaseModel):
    keyword: str = ""
    max_posts: int = Field(default=10, ge=1, le=30)


class StudioProject(BaseModel):
    version: int = Field(default=1, ge=1, le=1)
    style: StudioStyle = Field(default_factory=StudioStyle)
    scenes: List[SceneItem] = Field(default_factory=list, max_length=MAX_SCENES)
    voice: str = "vi-VN-HoaiMyNeural"
    speed: str = "+0%"
    bg: str = Field(default="random", max_length=300)
    bgm: Optional[str] = Field(default=None, max_length=300)
    volume: float = Field(default=.12, ge=0, le=.5)
    watermark: str = Field(default="", max_length=150)
    resolution: str = "1080x1920"
    silent: bool = False

    @field_validator("voice")
    @classmethod
    def project_voice(cls, value):
        return validate_synthesis_voice(value)

    @field_validator("speed")
    @classmethod
    def project_rate(cls, value):
        return RenderRequest.rate_format(value)


class VoicePreviewRequest(BaseModel):
    text: str = Field(default="Chào bạn. Đây là giọng đọc cho video của bạn.", min_length=1, max_length=300)
    voice: str = "vi-VN-HoaiMyNeural"
    speed: str = "+0%"

    @field_validator("voice")
    @classmethod
    def allowed_voice(cls, value):
        if value not in {voice["id"] for voice in AVAILABLE_VOICES}:
            raise ValueError("Giọng đọc không được hỗ trợ")
        return value


    @field_validator("speed")
    @classmethod
    def allowed_speed(cls, value):
        if value not in ("-10%", "+0%", "+10%", "+20%", "+30%"):
            raise ValueError("Nhịp đọc không được hỗ trợ")
        return value


class AutomationRequest(BaseModel):
    scenes: List[SceneItem] = Field(max_length=MAX_SCENES)
    broll: bool = True
    sticker: bool = True
    sfx: bool = True


class AutomationApplyRequest(AutomationRequest):
    plan: MediaPlan


@app.post("/api/studio/automation/suggest")
async def automation_suggest(req: AutomationRequest):
    from tvcore.media_planner import suggest_plan, ai_prompt
    if not req.scenes:
        raise HTTPException(status_code=400, detail="Thêm nội dung trước khi tạo gợi ý.")
    scenes = [s.model_dump() for s in req.scenes]
    plan = suggest_plan(scenes, req.broll, req.sticker, req.sfx)
    return {"plan": plan, "prompt": ai_prompt(scenes, plan)}


@app.post("/api/studio/automation/apply")
async def automation_apply(req: AutomationApplyRequest):
    from tvcore.media_planner import apply_plan
    plan = req.plan.model_dump()
    try:
        scenes = apply_plan([s.model_dump() for s in req.scenes], plan)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"scenes": scenes, "source": plan.get('source')}



@app.post("/api/studio/voice-preview")
async def studio_voice_preview(req: VoicePreviewRequest):
    import hashlib
    key = hashlib.sha256((req.voice+req.speed+req.text).encode()).hexdigest()[:20]
    path = OUTPUTS_DIR / ("voice_preview_" + key + ".aac")
    try:
        await asyncio.wait_for(make_tts_audio(req.text, req.voice, req.speed, str(path), strict_voice=True), timeout=120)
    except (RuntimeError, TimeoutError) as exc:
        raise HTTPException(status_code=503, detail="Chưa tạo được giọng nghe thử. Bạn có thể thử lại hoặc đổi giọng.") from exc
    finally:
        path.with_suffix(path.suffix + ".words.jsonl").unlink(missing_ok=True)
        path.with_suffix(path.suffix + ".raw.mp3").unlink(missing_ok=True)
    return {"audio_url": "/outputs/" + path.name}


@app.get("/api/studio/voices")
async def studio_voices():
    return {"synthesis": [{**voice, "can_synthesize": True} for voice in AVAILABLE_VOICES],
            "reference": reference_voices(), "reference_can_synthesize": False}


@app.post("/api/studio/project/validate")
async def studio_project_validate(project: StudioProject):
    # Reuse the render model's voice and resolution normalization.
    req = RenderRequest(scenes=project.scenes, voice=project.voice, speed=project.speed, resolution=project.resolution)
    data = project.model_dump()
    data.update(voice=req.voice, speed=req.speed, resolution=req.resolution)
    return data


@app.post("/api/studio/preflight")
async def studio_preflight(req: RenderRequest):
    errors, warnings = [], []
    if not req.scenes or not any(s.display_text.strip() for s in req.scenes):
        errors.append("Chưa có nội dung để dựng video.")
    if len(req.scenes) > MAX_SCENES:
        errors.append(f"Tối đa {MAX_SCENES} cảnh.")
    if any(not s.display_text.strip() for s in req.scenes):
        errors.append("Có cảnh đang trống nội dung.")
    style = req.studio_style
    sources = [l.source for l in style.layers if l.kind in ("image", "video") and l.source]
    if style.background_mode == "image":
        sources.append(style.background_image)
    if style.sfx_source:
        sources.append(style.sfx_source)
    for scene in req.scenes:
        media = scene.studio_media
        if media and media.enabled:
            sources.extend(p for p in (media.broll_source, media.sticker_source, media.sfx_source) if p)
            count = sum(l.section == 'body' for l in style.layers)+2+bool(media.broll_source)+bool(media.sticker_source)
            if count > 20:
                errors.append("Cảnh có hơn 20 lớp sau khi thêm tài nguyên tự động. Bớt lớp hoặc tắt minh họa của cảnh.")
    for source in sources:
        path = (APP_ROOT / source.lstrip("/")).resolve()
        if not source or not path.is_relative_to(APP_ROOT.resolve()) or not path.is_file():
            errors.append("Tài nguyên đã chọn không tồn tại: " + source)
    if not req.studio_silent:
        warnings.append("Giọng đọc cần kết nối Edge-TTS; tác vụ sẽ báo lỗi nếu dịch vụ không đáp ứng.")
    else:
        warnings.append("Đang bật chế độ dựng thử không giọng đọc.")
    if req.bgm_path:
        warnings.append("Nhạc crawl là bản preview và được lặp khi cần.")
    if not ffmpeg_bin():
        errors.append("Không tìm thấy FFmpeg.")
    return {"ok": not errors, "errors": errors, "warnings": warnings,
            "scenes": len(req.scenes), "sections": {"cover": style.cover_enabled, "hook": bool(style.hook_text.strip())},
            "sfx": bool(style.sfx_source)}


# ==========================================
# SCRAPE & NORMALIZE
# ==========================================
@app.post("/api/scrape")
async def scrape_api(req: ScrapeRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="Vui lòng cung cấp đường link bài viết Threads!")

    try:
        scenes = await scrape_threads_post(req.url, req.max_comments)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        print(f"[Scrape Error] {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi cào dữ liệu Threads: {e}")

    if req.gemini_api_key and req.gemini_api_key.strip():
        try:
            scenes = await convert_tts_with_gemini(scenes, req.gemini_api_key.strip())
        except Exception as ge:
            print(f"[Gemini Fallback] Bo qua loi Gemini, dung tu dien noi bo: {ge}")

    try:
        record_scrape(post_count=1, comments_seen=max(0, len(scenes) - 1))
    except Exception:
        pass

    return {
        "status": "success",
        "topic": scenes[0] if scenes else None,
        "comments_count": max(0, len(scenes) - 1),
        "scenes": scenes,
    }


@app.get("/api/voices")
async def voices_api():
    """Danh sách giọng đọc có sẵn của tool (chỉ 2 giọng vi-VN)."""
    return {
        "status": "success",
        "voices": AVAILABLE_VOICES,
        "default": AVAILABLE_VOICES[0]["id"],
    }


@app.post("/api/normalize")
async def normalize_api(req: NormalizeRequest):
    updated = await convert_tts_with_gemini(req.scenes, req.api_key)
    return {"status": "success", "scenes": updated}


@app.post("/api/auto-hook")
async def auto_hook_api(req: HookCtaRequest):
    """
    Tự động sinh câu hook (đầu video) và CTA (cuối video).
    Có Gemini API key -> câu viết theo nội dung thật; không có -> dùng template nội bộ.
    """
    if not req.scenes:
        raise HTTPException(status_code=400, detail="Cần ít nhất 1 cảnh để sinh hook/CTA!")

    result = await auto_generate_hook_cta(
        [scene_to_dict(s) for s in req.scenes],
        req.api_key,
    )
    return {
        "status": "success",
        "hook_text": result["hook_text"],
        "cta_text": result["cta_text"],
        "source": result.get("source", "template"),
    }


# ==========================================
# GIAI ĐOẠN 1: PHÂN TÍCH + LỌC BÌNH LUẬN
# ==========================================
@app.post("/api/analyze")
async def analyze_api(req: AnalyzeRequest):
    """
    Phân tích bài viết + chấm điểm / lọc / chọn bình luận đa dạng.

    Trả về:
      - analysis : thông tin chủ đề / độ dài / mức hấp dẫn
      - comments : danh sách bình luận được chấm điểm (kèm lý do)
      - selected : N bình luận nên dùng (đa dạng, đã loại trùng)
      - stats    : số bình luận bị loại (spam / trùng / quá ngắn)
    """
    if not req.scenes:
        raise HTTPException(status_code=400, detail="Cần ít nhất 1 cảnh để phân tích!")

    scenes = [scene_to_dict(s) for s in req.scenes]
    root = scenes[0]
    root_text = (root.get("display_text") or "").strip()

    analysis = analyze_post(root_text)

    raw_comments = [
        {
            "text": (s.get("display_text") or "").strip(),
            "likes": s.get("likes") or "0",
            "author": s.get("author") or "",
        }
        for s in scenes[1:]
    ]

    selected, stats = select_comments(
        raw_comments,
        root_text=root_text,
        max_n=req.max_comments,
        min_score=req.min_score,
    )

    scored_all = []
    for c in raw_comments:
        from tvcore.content import score_comment, spam_reasons
        txt = c["text"]
        hard = [r for r in spam_reasons(txt) if r not in ("quá dài", "quá ngắn")]
        sc = score_comment(txt, root_text)
        scored_all.append({
            "text": txt,
            "author": c["author"],
            "score": sc["total"],
            "parts": sc["parts"],
            "reasons": sc["reasons"],
            "words": sc["words"],
            "spam": hard,
        })
    scored_all.sort(key=lambda x: x["score"], reverse=True)

    return {
        "status": "success",
        "analysis": analysis,
        "comments": scored_all,
        "selected": [
            {
                "text": s["text"],
                "score": s["score"],
                "parts": s["parts"],
                "reasons": s["reasons"],
                "words": s["words"],
            }
            for s in selected
        ],
        "stats": stats,
    }


# ==========================================
# GIAI ĐOẠN 2: AI VIẾT KỊCH BẢN
# ==========================================
@app.post("/api/script")
async def script_api(req: ScriptRequest):
    """
    Sinh kịch bản đầy đủ:
      hook (N lựa chọn) / tóm tắt / lời dẫn / chuyển cảnh / nhận xét biên tập / CTA
    """
    if not req.scenes:
        raise HTTPException(status_code=400, detail="Cần ít nhất 1 cảnh để viết kịch bản!")

    scenes = [scene_to_dict(s) for s in req.scenes]
    result = await auto_generate_script(scenes, req.api_key, n_hooks=req.n_hooks)

    # Bổ sung hook từ module hook.py nếu script.py chưa có CTA
    if not result.get("cta_text"):
        try:
            legacy = await auto_generate_hook_cta(scenes, req.api_key)
            result["cta_text"] = legacy.get("cta_text", "")
        except Exception:
            pass

    return {
        "status": "success",
        "source": result.get("source", "template"),
        "summary": result.get("summary", ""),
        "hooks": result.get("hooks", []),
        "hook_text": result.get("hook_text", ""),
        "intro": result.get("intro", ""),
        "transition": result.get("transition", ""),
        "editorial": result.get("editorial", ""),
        "cta_text": result.get("cta_text", ""),
        "analysis": result.get("analysis", {}),
    }


# ==========================================
# GIAI ĐOẠN 3: KẾ HOẠCH THỜI LƯỢNG
# ==========================================
@app.post("/api/timeline")
async def timeline_api(req: TimelineRequest):
    """Tính thời lượng hiển thị tối ưu cho từng cảnh."""
    scenes = [scene_to_dict(s) for s in req.scenes]
    plan = plan_timeline(scenes, speed=req.speed)
    total = round(sum(p["duration"] for p in plan), 2)
    return {
        "status": "success",
        "plan": plan,
        "total_duration": total,
    }


# ==========================================
# GIAI ĐOẠN 4: KIỂM TRA CHẤT LƯỢNG
# ==========================================
@app.post("/api/qc")
async def qc_api(req: QcRequest):
    """Kiểm tra kịch bản trước khi render."""
    scenes = [scene_to_dict(s) for s in req.scenes]
    result = check_script(scenes, speed=req.speed)
    rights = check_rights(req.watermark_text)
    result["issues"] = result.get("issues", []) + rights.get("issues", [])
    result["summary"].update(rights.get("summary", {}))
    return {"status": "success", **result}


@app.post("/api/qc/video")
async def qc_video_api(req: QcVideoRequest):
    """Kiểm tra file video sau khi render."""
    from tvcore.uploads import sanitize_filename
    safe = sanitize_filename(req.filename, fallback="")
    if not safe:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ!")
    path = os.path.join(str(OUTPUTS_DIR), safe)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Không tìm thấy video!")
    return {"status": "success", **check_video(path, req.expected_duration)}


# ==========================================
# NHÓM 4: THỐNG KÊ & LỊCH SỬ
# ==========================================
@app.get("/api/stats")
async def api_stats():
    """Thống kê toàn bộ hoạt động của tool."""
    return {"status": "success", **get_stats()}


@app.post("/api/stats/analytics")
async def api_record_analytics(req: AnalyticsRequest):
    """Nhập số liệu TikTok Analytics cho 1 video để so sánh hiệu quả."""
    record_analytics(req.filename, {
        "views": req.views,
        "likes": req.likes,
        "comments": req.comments,
        "shares": req.shares,
        "watch_time_avg": req.watch_time_avg,
    })
    return {"status": "success"}


@app.get("/api/presets")
async def api_list_presets():
    return {"status": "success", "presets": list_presets()}


@app.post("/api/presets")
async def api_save_preset(req: PresetRequest):
    if not save_preset(req.name, req.config):
        raise HTTPException(status_code=500, detail="Không lưu được preset!")
    return {"status": "success"}


@app.delete("/api/presets/{name}")
async def api_delete_preset(name: str):
    if not delete_preset(name):
        raise HTTPException(status_code=404, detail="Không tìm thấy preset!")
    return {"status": "success"}


# ==========================================
# RENDER (bất đồng bộ + tiến trình)
# ==========================================
@app.post("/api/render")
async def render_api(req: RenderRequest):
    """
    Tạo job render nền, trả về job_id ngay.
    Client theo dõi qua GET /api/render/{job_id}/stream (SSE) hoặc /status.
    """
    if not req.scenes:
        raise HTTPException(status_code=400, detail="Kịch bản trống!")
    if len(req.scenes) > MAX_SCENES:
        raise HTTPException(status_code=400, detail=f"Quá nhiều cảnh (tối đa {MAX_SCENES}).")

    if req.studio_style.enabled:
        preflight = await studio_preflight(req)
        if not preflight["ok"]:
            raise HTTPException(status_code=400, detail=" · ".join(preflight["errors"]))

    # Tự động sinh hook/CTA nếu người dùng chưa nhập
    if req.auto_hook and (not (req.hook_text or "").strip() or not (req.cta_text or "").strip()):
        try:
            gen = await auto_generate_hook_cta(
                [scene_to_dict(s) for s in req.scenes],
                req.gemini_api_key,
            )
            if not (req.hook_text or "").strip():
                req.hook_text = gen["hook_text"]
            if not (req.cta_text or "").strip():
                req.cta_text = gen["cta_text"]
            print(f"[AutoHook] hook/cta tu dong ({gen.get('source')})")
        except Exception as e:
            print(f"[AutoHook] that bai, bo qua: {e}")

    try:
        job, created = await jobs.enqueue(req.model_dump(exclude={"gemini_api_key"}))
    except jobs.QueueFull as exc:
        raise HTTPException(status_code=429, detail=str(exc)) from exc
    except jobs.RequestConflict as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not created:
        return {"status": job.status, "job_id": job.id}

    async def _run():
        try:
            await jobs.update_job(job.id, 0.01, "Đang chờ hàng đợi render...")

            # Chỉ cho tối đa 1 render chạy đồng thời.
            # Nhiều job song song sẽ tranh chấp edge-tts (sinh file im lặng)
            # và CPU (ffmpeg bị treo) -> video hỏng / không xuất được.
            async with _get_render_lock():
                await jobs.start_job(job.id)

                async def progress(pct: float, msg: str):
                    await jobs.update_job(job.id, pct, msg)

                result = await render_video(req, progress=progress)
                try:
                    _qc = result.get("qc_precheck") or {}
                    record_render(
                        filename=result.get("filename", ""),
                        duration=result.get("duration", 0),
                        ok=True,
                        scenes=len(req.scenes or []),
                        hook_text=req.hook_text or "",
                        cta_text=req.cta_text or "",
                        voice=req.voice,
                        speed=req.speed,
                        qc_errors=_qc.get("summary", {}).get("errors", 0),
                    )
                except Exception as e:
                    print(f"[Stats] khong ghi duoc lich su: {e}")
                await jobs.finish_job(job.id, result)
        except Exception as e:
            print(f"[Render Job Error] {e}")
            try:
                record_render(filename="", duration=0, ok=False, error=str(e),
                             scenes=len(req.scenes or []),
                             hook_text=req.hook_text or "",
                             cta_text=req.cta_text or "",
                             voice=req.voice, speed=req.speed)
            except Exception:
                pass
            await jobs.fail_job(job.id, str(e))

    asyncio.create_task(_run())
    return {"status": "queued", "job_id": job.id}


@app.post("/api/render/{job_id}/retry")
async def retry_render(job_id: str):
    job = jobs.get_job(job_id)
    if not job or not job.request:
        raise HTTPException(status_code=404, detail="Không còn cấu hình của tác vụ này.")
    if job.status != "error":
        raise HTTPException(status_code=409, detail="Chỉ thử lại tác vụ đã thất bại hoặc bị gián đoạn.")
    existing = jobs.active_retry(job_id)
    if existing:
        return {"status": existing.status, "job_id": existing.id}
    import uuid
    payload = {**job.request, "client_request_id": uuid.uuid4().hex, "retry_of": job_id}
    return await render_api(RenderRequest(**payload))


@app.get("/api/render/{job_id}/status")
async def render_status(job_id: str):
    job = jobs.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Không tìm thấy job!")
    return job.as_dict()


@app.get("/api/render/{job_id}/stream")
async def render_stream(job_id: str):
    """Server-Sent Events: báo tiến trình render theo thời gian thực."""
    if not jobs.get_job(job_id):
        raise HTTPException(status_code=404, detail="Không tìm thấy job!")

    async def event_gen():
        import json as _json
        while True:
            job = jobs.get_job(job_id)
            if not job:
                break
            payload = _json.dumps(job.as_dict(), ensure_ascii=False)
            yield f"data: {payload}\n\n"
            if job.status in ("done", "error"):
                break
            await asyncio.sleep(0.35)

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/jobs")
async def api_list_jobs():
    return {"jobs": jobs.list_jobs()}


# ==========================================
# QUẢN LÝ BGM / MEME / BACKGROUND
# ==========================================
def _list_files(folder: str, exts: tuple) -> List[str]:
    if not os.path.isdir(folder):
        return []
    return sorted(f for f in os.listdir(folder) if f.lower().endswith(exts))


@app.get("/api/backgrounds")
async def list_backgrounds():
    return {"backgrounds": _list_files(str(BACKGROUNDS_DIR), BG_EXTS)}


@app.get("/api/bgm")
async def list_bgm():
    return {"bgms": _list_files(str(BGM_DIR), AUDIO_EXTS)}


@app.get("/api/memes")
async def list_memes():
    return {"memes": _list_files(str(MEMES_DIR), MEME_EXTS)}


async def _read_upload_head(file: UploadFile, n: int = 32) -> bytes:
    head = await file.read(n)
    await file.seek(0)
    return head


@app.post("/api/upload-bgm")
async def upload_bgm(file: UploadFile = File(...)):
    """Tải lên file nhạc nền mới vào thư mục bgm/."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ!")

    head = await _read_upload_head(file)
    try:
        ext = validate_upload(file.filename, head, _safe_size(file), AUDIO_EXTS)
    except UploadError as e:
        raise HTTPException(status_code=400, detail=str(e))

    dest_path = build_dest(str(BGM_DIR), file.filename, ext, unique=False)
    try:
        await _save_upload(file, dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file: {e}")

    return {"status": "success", "filename": os.path.basename(dest_path),
            "url": f"/bgm/{os.path.basename(dest_path)}"}


@app.post("/api/upload-meme")
async def upload_meme(file: UploadFile = File(...)):
    """Tải lên meme mới (video, ảnh hoặc GIF) vào thư mục memes/."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ!")

    head = await _read_upload_head(file)
    try:
        ext = validate_upload(file.filename, head, _safe_size(file), MEME_EXTS)
    except UploadError as e:
        raise HTTPException(status_code=400, detail=str(e))

    dest_path = build_dest(str(MEMES_DIR), file.filename, ext, unique=True)
    try:
        await _save_upload(file, dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file: {e}")

    from tvcore.utils import is_image_file
    return {
        "status": "success",
        "filename": os.path.basename(dest_path),
        "url": f"/memes/{os.path.basename(dest_path)}",
        "type": "image" if is_image_file(dest_path) else "video",
    }


@app.post("/api/upload-bg")
async def upload_bg(file: UploadFile = File(...)):
    """Tải lên video nền mới vào thư mục backgrounds/."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ!")

    head = await _read_upload_head(file)
    try:
        ext = validate_upload(file.filename, head, _safe_size(file), BG_EXTS)
    except UploadError as e:
        raise HTTPException(status_code=400, detail=str(e))

    dest_path = build_dest(str(BACKGROUNDS_DIR), file.filename, ext, unique=True)
    try:
        await _save_upload(file, dest_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file: {e}")

    return {"status": "success", "filename": os.path.basename(dest_path),
            "url": f"/backgrounds/{os.path.basename(dest_path)}"}


@app.delete("/api/memes/{filename}")
async def delete_meme(filename: str):
    """Xoá một meme khỏi thư mục memes/."""
    from tvcore.utils import sanitize_filename
    safe_name = sanitize_filename(filename, fallback="")
    if not safe_name:
        raise HTTPException(status_code=400, detail="Tên file không hợp lệ!")
    p = os.path.join(str(MEMES_DIR), safe_name)
    if os.path.exists(p):
        try:
            os.remove(p)
            return {"status": "success", "deleted": safe_name}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="Không tìm thấy meme!")


def _safe_size(file: UploadFile) -> int:
    """Lấy kích thước file (ưu tiên header, fallback đọc thật)."""
    try:
        header = getattr(file, "headers", {}) or {}
        raw = header.get("content-length")
        if raw:
            return int(raw)
    except Exception:
        pass
    try:
        pos = file.file.tell()
        size = file.file.seek(0, os.SEEK_END)
        file.file.seek(pos)
        return size
    except Exception:
        return 0


async def _save_upload(file: UploadFile, dest_path: str, chunk: int = 1024 * 1024) -> None:
    """Ghi file upload xuống đĩa theo chunk (không nạp hết vào RAM)."""
    total = 0
    from tvcore.config import MAX_UPLOAD_BYTES
    with open(dest_path, "wb") as out:
        while True:
            data = await file.read(chunk)
            if not data:
                break
            total += len(data)
            if total > MAX_UPLOAD_BYTES:
                out.close()
                try:
                    os.remove(dest_path)
                except OSError:
                    pass
                raise HTTPException(status_code=413,
                                    detail=f"File quá lớn! Tối đa {MAX_UPLOAD_BYTES // (1024*1024)} MB.")
            out.write(data)


# ==========================================
# DISCOVER
# ==========================================
@app.post("/api/discover-posts")
async def api_discover_posts(req: DiscoverRequest):
    try:
        return await discover_posts(req.keyword, req.max_posts)
    except Exception as e:
        print(f"[Discover Error] {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi khi tìm bài viết: {e}")


# ==========================================
# HỆ THỐNG
# ==========================================
@app.get("/api/health")
async def health():
    """
    Kiểm tra sức khoẻ hệ thống.

    `ffmpeg`: tìm bằng shutil.which() để hoạt động trên Windows / Linux / macOS
    (thay vì chỉ đoán đường dẫn `bin/ffmpeg.exe` chỉ đúng trên Windows).
    """
    ffmpeg_path = shutil.which("ffmpeg") or ""
    if not ffmpeg_path:
        # fallback: thư mục bin/ kèm theo repo (Windows-style)
        local = APP_ROOT / "bin" / ("ffmpeg.exe" if os.name == "nt" else "ffmpeg")
        if local.exists():
            ffmpeg_path = str(local)
    return {
        "status": "ok",
        "version": app.version,
        "ffmpeg": bool(ffmpeg_path),
        "ffmpeg_path": ffmpeg_path or None,
        "outputs": len(_list_files(str(OUTPUTS_DIR), (".mp4",))),
    }


@app.post("/api/cache/clear")
async def api_clear_cache():
    """Xoá cache TTS + cache scrape."""
    tts_removed = clear_tts_cache()
    scrape_removed = clear_scrape_cache()
    return {"status": "success", "tts_files_removed": tts_removed,
            "scrape_entries_removed": scrape_removed}


@app.get("/api/storage")
async def api_storage():
    """Thong tin dung luong: video da xuat, dung luong outputs/ (tu dong xoa sau 24h)."""
    try:
        cleanup_old_videos()
        videos = sorted(
            OUTPUTS_DIR.glob("*.mp4"),
            key=lambda f: f.stat().st_mtime, reverse=True)
    except OSError:
        videos = []
    return {
        "video_count": len(videos),
        "outputs_mb": outputs_disk_usage_mb(),
        "max_videos": MAX_OUTPUT_VIDEOS,
        "videos": [
            {"filename": f.name, "size_mb": round(f.stat().st_size / (1024 * 1024), 1)}
            for f in videos[:MAX_OUTPUT_VIDEOS]
        ],
    }


@app.delete("/api/storage/{filename}")
async def api_storage_delete(filename: str):
    """Xoa mot video cu the trong outputs/."""
    safe_name = Path(filename).name
    target = OUTPUTS_DIR / safe_name
    if target.exists() and target.suffix.lower() == ".mp4":
        target.unlink(missing_ok=True)
        return {"status": "success", "message": f"Đã xóa video {safe_name}"}
    raise HTTPException(status_code=404, detail="Không tìm thấy video cần xóa.")


@app.post("/api/storage/clean")
async def api_storage_clean():
    """Xoa cac video cu, chi giu lai MAX_OUTPUT_VIDEOS video moi nhat."""
    removed, freed = cleanup_old_videos()
    return {"status": "success", "removed": removed, "freed_mb": freed,
            "video_count": len(list(OUTPUTS_DIR.glob("*.mp4")))}


app.mount("/studio-files", StaticFiles(directory=str(APP_ROOT / "studio")), name="studio-files")
app.mount("/assets", StaticFiles(directory=str(APP_ROOT / "assets")), name="studio-assets")

@app.get("/studio")
@app.get("/threads/setup")
async def studio_page():
    return FileResponse(str(APP_ROOT / "index.html"))

@app.get("/resources")
async def resource_page():
    from fastapi.responses import RedirectResponse
    return RedirectResponse("/")

@app.get("/api/studio/resources")
async def studio_resources():
    manifest = APP_ROOT / "assets/library/resources-manifest.json"
    import json
    return json.loads(manifest.read_text(encoding="utf-8"))

class CardPreviewRequest(BaseModel):
    scene: SceneItem
    style: StudioStyle = Field(default_factory=StudioStyle)

@app.post("/api/studio/card", response_class=HTMLResponse)
async def studio_card(req: CardPreviewRequest):
    return card_html(req.scene.model_dump(), req.style)

@app.get("/")
async def index_page():
    """Phục vụ giao diện Studio trực tiếp tại root URL /."""
    studio_file = APP_ROOT / "studio/index.html"
    if studio_file.exists():
        return FileResponse(str(studio_file))
    return FileResponse(str(APP_ROOT / "index.html"))

if __name__ == "__main__":
    import uvicorn
    import socket
    port = int(os.environ.get("PORT", "8000"))
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(("127.0.0.1", port))
        except OSError:
            port = 8001
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
