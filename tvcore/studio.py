"""Shared, validated studio configuration and local media catalogue."""
import json
from typing import Literal
from pathlib import Path
from pydantic import BaseModel, Field, field_validator, model_validator
from .config import APP_ROOT, BACKGROUNDS_DIR, BGM_DIR, MEMES_DIR

class StudioLayer(BaseModel):
    id: str = Field(max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    kind: Literal["text", "shape", "image", "video"] = "text"
    name: str = Field(default="Lớp", max_length=80)
    text: str = Field(default="", max_length=500)
    source: str = Field(default="", max_length=300)
    x: float = Field(default=10, ge=0, le=95)
    y: float = Field(default=10, ge=0, le=95)
    width: float = Field(default=80, ge=2, le=100)
    height: float = Field(default=10, ge=1, le=100)
    size: int = Field(default=40, ge=12, le=160)
    color: str = "#ffffff"
    opacity: float = Field(default=1, ge=0, le=1)
    section: Literal["body", "cover", "hook"] = "body"
    motion: Literal["none", "fade", "rise", "slide"] = "none"
    start_seconds: float = Field(default=0, ge=0, le=300)
    end_seconds: float | None = Field(default=None, gt=0, le=300)

    @model_validator(mode="after")
    def timing_order(self):
        if self.end_seconds is not None and self.end_seconds <= self.start_seconds:
            raise ValueError("Thời điểm kết thúc lớp phải lớn hơn bắt đầu")
        return self

    @field_validator("color")
    @classmethod
    def color_hex(cls, value):
        import re
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value):
            raise ValueError("Màu phải có dạng #RRGGBB")
        return value

    @field_validator("source")
    @classmethod
    def local_image(cls, value):
        if value and (not value.startswith(("/assets/library/images/", "/assets/library/source/", "/memes/", "/backgrounds/")) or ".." in value or "\\" in value or "?" in value or "#" in value):
            raise ValueError("Chỉ dùng ảnh từ thư viện local")
        return value

class StudioSceneMedia(BaseModel):
    enabled: bool = True
    broll_source: str = Field(default="", max_length=300)
    sticker_source: str = Field(default="", max_length=300)
    sfx_source: str = Field(default="", max_length=300)
    reason: str = Field(default="", max_length=500)
    origin: Literal["local_rules", "ai_import", "manual"] = "manual"

    _broll = field_validator("broll_source")(classmethod(lambda cls, v: StudioLayer.local_image(v)))
    _sticker = field_validator("sticker_source")(classmethod(lambda cls, v: StudioLayer.local_image(v)))

    @field_validator("sfx_source")
    @classmethod
    def sound_source(cls, value):
        return StudioStyle.sound_source(value)


class StudioStyle(BaseModel):
    enabled: bool = False
    theme: Literal["light","dark"] = "light"
    card_width: float = Field(default=80, ge=35, le=100)
    card_y: float = Field(default=20, ge=0, le=80)
    hide_date: bool = True
    hide_avatar: bool = False
    blur_identity: bool = False
    blur_avatar: bool = False
    redact_words: str = Field(default="", max_length=300)
    background_mode: Literal["video","image","grid","particles","waves","tunnel","contours","water","wave3d","network","rain","dust","lightspeed"] = "grid"
    background_image: str = ""
    grid_color: str = "#5740b2"
    subtitle: bool = True
    subtitle_y: float = Field(default=84, ge=10, le=94)
    subtitle_size: int = Field(default=44, ge=20, le=90)
    subtitle_color: str = "#ffffff"
    layers: list[StudioLayer] = Field(default_factory=list, max_length=17)
    section: Literal["body", "cover", "hook"] = "body"
    subtitle_preset: str = Field(default="karaoke", max_length=50)
    subtitle_motion: Literal["static","bounce","pulse","rise","bob","drop"] = "bounce"
    subtitle_font: Literal["Be Vietnam Pro","Oswald","Anton","Baloo 2","Montserrat","Nunito","Comfortaa","Playfair Display"] | None = None
    subtitle_highlight: str | None = None
    subtitle_words: int | None = Field(default=None, ge=1, le=8)
    subtitle_outline: float | None = Field(default=None, ge=0, le=6)
    subtitle_shadow: float | None = Field(default=None, ge=0, le=5)
    subtitle_display: Literal["karaoke","single","mixed"] | None = None
    subtitle_case: Literal["original","upper","pattern"] | None = None
    film_effect: Literal["none","grain","sepia","vhs"] = "none"
    cover_enabled: bool = False
    cover_title: str = Field(default="", max_length=250)
    cover_seconds: float = Field(default=2, ge=0.5, le=8)
    hook_text: str = Field(default="", max_length=500)
    outro_text: str = Field(default="", max_length=500)
    transition: Literal["cut", "fade", "rise"] = "cut"
    sfx_source: str = Field(default="", max_length=300)
    sfx_volume: float = Field(default=0.12, ge=0, le=0.5)

    @field_validator("sfx_source")
    @classmethod
    def sound_source(cls, value):
        if not value:
            return value
        path = (APP_ROOT / value.lstrip("/")).resolve()
        library = (APP_ROOT / "assets/library/source").resolve()
        if not value.startswith("/assets/library/source/") or ".." in value or "\\" in value or not path.is_relative_to(library) or path.suffix.lower() not in (".mp3", ".wav", ".ogg", ".m4a"):
            raise ValueError("SFX phải là âm thanh trong thư viện local")
        return value

    _grid_color = field_validator("grid_color")(classmethod(lambda cls, v: StudioLayer.color_hex(v)))
    _subtitle_color = field_validator("subtitle_color")(classmethod(lambda cls, v: StudioLayer.color_hex(v)))
    _subtitle_highlight = field_validator("subtitle_highlight")(classmethod(lambda cls, v: StudioLayer.color_hex(v) if v is not None else None))
    _background_image = field_validator("background_image")(classmethod(lambda cls, v: StudioLayer.local_image(v)))

def catalogue():
    assets = []
    manifest = APP_ROOT / "assets/library/manifest.json"
    if manifest.exists():
        assets = [a for a in json.loads(manifest.read_text(encoding="utf-8")).get("assets", []) if a.get("status") == "downloaded"]
    mapped = {a["local"]: a for a in assets}
    result = []
    for kind, folder, prefix in (("video", BACKGROUNDS_DIR, "backgrounds"), ("music", BGM_DIR, "bgm"), ("meme", MEMES_DIR, "memes"), ("image", APP_ROOT/"assets/library/images", "assets/library/images")):
        if not folder.exists():
            continue
        for p in sorted(folder.iterdir()):
            if not p.is_file() or p.suffix.lower() not in (".mp4",".webm",".mp3",".wav",".aac",".m4a",".ogg",".flac",".png",".jpg",".jpeg",".webp",".gif"):
                continue
            key = f"{prefix}/{p.name}"
            meta = mapped.get(key, {})
            result.append({"id": key, "name": meta.get("label") or meta.get("name") or p.stem.replace("_"," "), "filename": p.name, "kind": kind, "url": "/"+key, "bytes": p.stat().st_size, "preview_only": meta.get("previewOnly",False), "origin": "reference" if meta else "installed"})
    return result
