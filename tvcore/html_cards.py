"""HTML/CSS Threads-style cards shared by iframe preview and Chromium screenshots.

Clean implementation from observed DOM metrics, not downloaded application code.
"""
import asyncio
import base64
import html
import re
from io import BytesIO
from pathlib import Path
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright
from .config import APP_ROOT
from .cards import get_font
from .icons import render_icon
from .studio import StudioStyle
from .utils import wrap_text_to_lines

def _icon(name, color=(115,115,115,255)):
    if name == "verified":
        image = render_icon(name, 40, color)
        data = BytesIO(); image.save(data, "PNG")
        return '<img class="action-icon" alt="Đã xác minh" src="data:image/png;base64,' + base64.b64encode(data.getvalue()).decode() + '">'
    names = {"heart_filled": "heart-filled"}
    path = APP_ROOT / "studio/icons" / (names.get(name, name) + ".svg")
    if not path.is_file():
        raise ValueError(f"Missing SVG icon: {name}")
    svg = path.read_text(encoding="utf-8")
    css = f"color:rgb({color[0]},{color[1]},{color[2]})"
    return svg.replace('<svg ', '<svg class="action-icon" style="'+css+'" ', 1)

def card_html(scene: dict, style: StudioStyle | dict = None, width: int = 520) -> str:
    cfg = style if isinstance(style, StudioStyle) else StudioStyle(**(style or {}))
    text = html.escape(str(scene.get("display_text") or ""))
    for word in filter(None, (w.strip() for w in cfg.redact_words.split(","))):
        escaped = html.escape(word)
        text = re.sub(re.escape(escaped), lambda m: '<span class="redacted">'+m.group(0)+'</span>', text, flags=re.I)
    author = html.escape(str(scene.get("author") or "nguoiviet").lstrip("@"))
    font_file=APP_ROOT/'assets/library/fonts/ThreadsCard-0.woff2'
    face='@font-face{font-family:ThreadsCard;src:url(data:font/woff2;base64,'+base64.b64encode(font_file.read_bytes()).decode()+')}' if font_file.exists() else ''
    dark = cfg.theme == "dark"
    avatar = '<div class="avatar"><span>'+author[:1].upper()+'</span><b>'+_icon('avatar-plus',(255,255,255,255))+'</b></div>'
    # The HTML renderer makes no third-party HTTP requests for avatars.
    avatar_url = str(scene.get("avatar_url") or "")
    if avatar_url.startswith("data:image/") and len(avatar_url) < 200000:
        avatar = '<div class="avatar"><img src="'+html.escape(avatar_url,quote=True)+'"><b>'+_icon('avatar-plus',(255,255,255,255))+'</b></div>'
    liked = scene.get("author_liked", True)
    stats = ""
    for key, icon in (("likes", "heart_filled" if liked else "heart"), ("comments","comment"), ("reposts","repost"), ("shares","share")):
        color = (255,48,64,255) if key=="likes" and liked else ((153,153,153,255) if dark else (115,115,115,255))
        value = html.escape(str(scene.get(key) or ""))
        stats += '<span class="action'+(' liked' if key=="likes" and liked else '')+'">'+_icon(icon,color)+'<span>'+value+'</span></span>'
    return f'''<!doctype html><html><head><meta charset="utf-8"><style>{face}
html,body{{margin:0;padding:0;background:transparent;width:{int(width)}px;overflow:hidden}}
*{{box-sizing:border-box}}.card{{font-family:ThreadsCard,Arial,"Segoe UI",sans-serif;width:100%;padding:11px 13px 5px;background:{"#101010" if dark else "#fff"};color:{"#f5f5f5" if dark else "#000"};display:flex;gap:10px}}
.gutter{{width:36px;flex:none;display:{"none" if cfg.hide_avatar else "block"}}}.avatar{{height:36px;width:36px;border-radius:50%;background:#efefef;position:relative;display:grid;place-items:center;color:#999;font-size:12px;filter:{"blur(3px)" if cfg.blur_avatar else "none"}}}.avatar>img{{height:36px;width:36px;border-radius:50%}}.avatar b{{position:absolute;right:-2px;bottom:-1px;background:#000;border:2px solid white;color:white;border-radius:50%;width:16px;height:16px;display:grid;place-items:center;font-size:12px}}
.avatar b .action-icon{{width:10px;height:10px}}.more .action-icon{{width:20px;height:22px}}.body{{flex:1;min-width:0}}.head{{display:flex;align-items:center;gap:5px;height:21px;line-height:21px}}.name{{font-size:15px;font-weight:600;filter:{"blur(1.5px)" if cfg.blur_identity else "none"}}}.date{{font-size:12px;color:#999}}.more{{margin-left:auto;color:#999;font-size:21px;line-height:20px}}.text{{font-size:15px;font-weight:500;line-height:1.46;margin-top:2.5px;white-space:pre-wrap;overflow-wrap:anywhere}}.actions{{display:flex;align-items:center;height:36px;gap:24px;color:#737373}}.action{{display:flex;gap:4px;align-items:center;font-size:13px}}.action-icon{{height:20px;width:20px;object-fit:contain}}.liked{{color:#ff3040}}.redacted{{filter:blur(3px);background:#aaa}}.verified{{color:#0095f6;font-size:12px}}
</style></head><body><article class="card"><div class="gutter">{avatar}</div><div class="body"><div class="head"><span class="name">{author}</span>{'<span class="verified">'+_icon('verified',(0,149,246,255))+'</span>' if scene.get("is_verified") else ""}{'' if cfg.hide_date else '<span class="date">'+html.escape(str(scene.get("time_ago") or ""))+'</span>'}<span class="more">{_icon("threads", (153,153,153,255))}</span></div><div class="text">{text}</div><div class="actions">{stats}</div></div></article></body></html>'''

async def render_html_card(scene, style, vid_w=1080):
    cfg = style if isinstance(style,StudioStyle) else StudioStyle(**style)
    width = 520
    async with async_playwright() as p:
        executables = list((APP_ROOT/".playwright").glob("chromium-*/chrome-win*/chrome.exe"))
        args = {"headless": True}
        if executables:
            args["executable_path"] = str(executables[0])
        browser = await p.chromium.launch(**args)
        try:
            page = await browser.new_page(viewport={"width":width,"height":2400},device_scale_factor=2,java_script_enabled=False)
            await page.route("**/*",lambda route:route.abort())
            await page.set_content(card_html(scene,cfg,width),wait_until="load")
            image = Image.open(BytesIO(await page.locator(".card").screenshot(omit_background=True))).convert("RGBA")
            target = int(vid_w*cfg.card_width/100)
            return image.resize((target,max(1,int(image.height*target/image.width))),Image.Resampling.LANCZOS)
        finally:
            await browser.close()

def compose_overlay(card, scene, cfg, width, height):
    """Bake configurable layers into a transparent full-frame PNG for FFmpeg."""
    image = Image.new("RGBA",(width,height),(0,0,0,0))
    card_y = min(height-card.height,max(0,int(height*cfg.card_y/100)))
    image.alpha_composite(card,((width-card.width)//2,max(0,card_y)))
    draw = ImageDraw.Draw(image)
    def centered_text(text, y, size, color, max_width):
        font = get_font(max(10,int(size*width/1080)),True)
        rows = wrap_text_to_lines(text,font,max_width,draw)
        lh = int(size*width/1080*1.25)
        for n,line in enumerate(rows[:6]):
            box=draw.textbbox((0,0),line,font=font)
            draw.text(((width-(box[2]-box[0]))/2,y+n*lh),line,font=font,fill=color,stroke_width=max(1,int(3*width/1080)),stroke_fill="#000000")
    if cfg.subtitle:
        centered_text(scene.get("tts_text") or scene.get("display_text") or "",int(height*cfg.subtitle_y/100),cfg.subtitle_size,cfg.subtitle_color,int(width*.86))
    for layer in cfg.layers:
        if layer.section != cfg.section:
            continue
        x,y=int(width*layer.x/100),int(height*layer.y/100)
        w,h=int(width*layer.width/100),int(height*layer.height/100)
        color=layer.color+f"{int(layer.opacity*255):02x}"
        if layer.kind=="shape":
            draw.rounded_rectangle((x,y,min(width,x+w),min(height,y+h)),radius=12,fill=color)
        elif layer.kind=="text":
            font=get_font(max(10,int(layer.size*width/1080)),True)
            rows=wrap_text_to_lines(layer.text,font,w,draw)
            for i,line in enumerate(rows[:8]):
                draw.text((x,y+i*int(layer.size*width/1080*1.25)),line,font=font,fill=color,stroke_width=1,stroke_fill="#000000")
        elif layer.source:
            filename=(APP_ROOT/layer.source.lstrip("/")).resolve()
            if filename.is_relative_to(APP_ROOT.resolve()) and filename.exists():
                with Image.open(filename) as opened:
                    tile=opened.convert("RGBA");tile.thumbnail((w,h),Image.Resampling.LANCZOS)
                    tile.putalpha(tile.getchannel("A").point(lambda a:int(a*layer.opacity)))
                    image.alpha_composite(tile,(x,y))
    return image
