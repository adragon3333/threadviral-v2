"""Locally generated animated backdrops: no remote video dependency."""
import hashlib, math, subprocess
from PIL import Image, ImageDraw, ImageOps
from .config import APP_ROOT, TEMP_DIR
from .utils import ffmpeg_bin

MODES={"water":"Lưới sóng nước","waves":"Sóng S uốn lượn","grid":"Lưới kẻ ô (chạy)","tunnel":"Đường hầm 2 khung","wave3d":"Lưới 3D gợn sóng","particles":"Hạt sáng bay","lightspeed":"Tốc độ ánh sáng","contours":"Đường đồng mức","network":"Mạng lưới trôi","rain":"Mưa vạch dọc","dust":"Bụi sáng xoay"}

def frame(t,mode="grid",color="#5740b2",w=360,h=640):
    im=Image.new("RGB",(w,h),(5,5,12));d=ImageDraw.Draw(im)
    rgb=tuple(int(color[i:i+2],16) for i in (1,3,5));dim=tuple(max(10,int(v*.45)) for v in rgb)
    unit=w/9
    if mode in ("grid","water","wave3d"):
        phase=(t*unit*.22)%unit
        for i in range(-2,23):
            yy=i*unit+phase
            if mode=="wave3d":yy=h*.25+(i*unit+phase)*.7
            points=[(x,yy+(math.sin(x/w*8+t*1.5+i*.45)*unit*(.28 if mode=="water" else .5) if mode!="grid" else 0)) for x in range(0,w+3,3)]
            d.line(points,fill=dim,width=1)
        for i in range(11):
            xx=i*unit
            points=[(xx+(math.sin(y/h*9+t+i*.4)*unit*.18 if mode!="grid" else 0),y) for y in range(0,h+3,3)]
            d.line(points,fill=dim,width=1)
    elif mode=="contours":
        for i in range(1,24):
            radius=i*w*.04
            points=[(w/2+math.cos(a)*radius*(1+.13*math.sin(a*3+t)),h/2+math.sin(a)*radius*1.5*(1+.12*math.cos(a*4+t))) for a in [j*math.pi/90 for j in range(181)]]
            d.line(points,fill=dim,width=1)
    elif mode=="waves":
        for i in range(25):
            points=[(x,h*.5+math.sin(x/w*5+t*.7+i*.17)*(40+i*3)+i*7-90) for x in range(0,w+3,3)]
            d.line(points,fill=dim,width=1)
    elif mode=="tunnel":
        for i in range(16):
            k=((i/16+t*.12)%1)**2;ww=w*k;hh=h*k
            d.rectangle((w/2-ww/2,h/2-hh/2,w/2+ww/2,h/2+hh/2),outline=dim,width=1)
    elif mode=="rain":
        for i in range(75):
            x=(i*73.7)%w;y=(i*117.1+t*(35+i%7*10))%(h+80)-40
            d.line((x,y,x,y+8+i%20),fill=dim,width=1)
    else:
        nodes=[]
        for i in range(75):
            if mode in ("dust","lightspeed"):
                angle=i*2.399+t*.07;r=((i*.137+t*.1)%1)*w*.9
                x=w/2+math.cos(angle)*r;y=h/2+math.sin(angle)*r*h/w
            else:
                x=(i*73.7+math.sin(t*.7+i)*18)%w;y=(i*117.1-t*(8+i%5*4))%h
            nodes.append((x,y));rad=1+i%2
            if mode=="lightspeed":
                d.line((x,y,x+(x-w/2)*.1,y+(y-h/2)*.1),fill=dim,width=1)
            else:d.ellipse((x-rad,y-rad,x+rad,y+rad),fill=rgb if i%5==0 else dim)
        if mode=="network":
            for a,(x,y) in enumerate(nodes):
                for xx,yy in nodes[a+1:]:
                    if (x-xx)**2+(y-yy)**2<(w*.15)**2:d.line((x,y,xx,yy),fill=dim,width=1)
    return im

def background_clip(cfg):
    key=hashlib.sha256((cfg.background_mode+cfg.grid_color+cfg.background_image+"v2").encode()).hexdigest()[:16]
    target=TEMP_DIR/("studio_bg_"+key+".mp4")
    if target.exists() and target.stat().st_size>1000:return str(target)
    image=None
    if cfg.background_mode=="image":
        source=(APP_ROOT/cfg.background_image.lstrip("/")).resolve()
        if not source.is_relative_to(APP_ROOT.resolve()) or not source.exists():raise ValueError("Chưa chọn ảnh nền hợp lệ.")
        image=ImageOps.fit(Image.open(source).convert("RGB"),(360,640))
    part=target.with_suffix(".working.mp4")
    process=subprocess.Popen([ffmpeg_bin(),"-y","-loglevel","error","-f","rawvideo","-pix_fmt","rgb24","-s","360x640","-r","24","-i","pipe:0","-an","-c:v","libx264","-preset","fast","-crf","20","-pix_fmt","yuv420p",str(part)],stdin=subprocess.PIPE,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
    try:
        for i in range(96):process.stdin.write((image or frame(i/24,cfg.background_mode,cfg.grid_color)).tobytes())
        process.stdin.close();errors=process.stderr.read();code=process.wait(timeout=60)
        if code:raise RuntimeError(errors.decode(errors="replace")[-500:])
        part.replace(target)
    except Exception:
        process.kill();part.unlink(missing_ok=True);raise
    return str(target)

def ass_subtitles(segments,cfg,w,h,filename):
    from .subtitle_styles import PRESETS, preset_ass
    if cfg.subtitle_preset in PRESETS:
        return preset_ass(segments,cfg,w,h,filename)
    def color(v):return "&H00"+v[5:7]+v[3:5]+v[1:3]
    def timestamp(v):
        cs=int(round(v*100));return f"{cs//360000}:{cs//6000%60:02d}:{cs//100%60:02d}.{cs%100:02d}"
    size=max(12,int(cfg.subtitle_size*w/1080))
    header=f"""[Script Info]
ScriptType: v4.00+
PlayResX: {w}
PlayResY: {h}
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Baloo 2,{size},&H0000D7FF,{color(cfg.subtitle_color)},&H00000000,&H88000000,-1,0,0,0,100,100,0,0,1,2,1,5,35,35,35,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines=[]
    for segment in segments:
        scene=segment.get("scene",{})
        if scene.get("author") in ("__cover__", "__hook__", "__cta__"):
            continue
        rows=caption_words(segment)
        for offset in range(0,len(rows),6):
            group=rows[offset:offset+6]
            start=segment["start"]+group[0]["start"]
            end=min(segment["end"],segment["start"]+group[-1]["end"])
            if end <= start:continue
            prefix="{\\an5\\pos("+str(w//2)+","+str(int(h*cfg.subtitle_y/100))+")}"
            if cfg.subtitle_motion=="rise":prefix="{\\an5\\move("+f"{w//2},{int(h*cfg.subtitle_y/100)+10},{w//2},{int(h*cfg.subtitle_y/100)},0,180"+")}"
            if cfg.subtitle_motion in ("bounce","pulse"):prefix+="{\\fscx90\\fscy90\\t(0,120,\\fscx100\\fscy100)}"
            if cfg.subtitle_preset=="comic":prefix+="{\\bord4\\shad3}"
            elif cfg.subtitle_preset=="soft":prefix+="{\\bord1\\shad0\\b0}"
            elif cfg.subtitle_preset=="neon":prefix+="{\\bord3\\blur1}"
            chunks=[];cursor=group[0]["start"]
            for item in group:
                gap=max(0,round((item["start"]-cursor)*100))
                if gap:chunks.append("{\\k"+str(gap)+"}")
                text=item["text"].replace("\\","").replace("{","").replace("}","").replace("\n"," ")
                if cfg.subtitle_preset=="bold":text=text.upper()
                chunks.append("{\\kf"+str(max(1,round((item["end"]-item["start"])*100)))+"}"+text)
                cursor=item["end"]
            lines.append(f"Dialogue: 0,{timestamp(start)},{timestamp(end)},Main,,0,0,0,,{prefix}{' '.join(chunks)}")
    filename.write_text(header+"\n".join(lines),encoding="utf-8-sig")
    return filename


def caption_words(segment):
    """Prefer measured boundaries. Old audio caches retain an explicit estimate."""
    words=segment.get("words") or []
    if words:
        result=[];previous=0.0
        for word in words:
            start=max(previous,float(word["start"]))
            end=min(float(segment["dur"]),float(word["end"]))
            if end>start:
                result.append({"text":str(word["text"]),"start":start,"end":end})
                previous=end
        if result:return result
    scene=segment.get("scene",{})
    tokens=str(scene.get("tts_text") or scene.get("display_text") or "").split()
    step=segment["dur"]/max(1,len(tokens))
    return [{"text":word,"start":i*step,"end":(i+1)*step} for i,word in enumerate(tokens)]
