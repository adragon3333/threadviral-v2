"""Studio-specific timeline, compositing and audio helpers.

Keep these explicit and independent of the legacy editor defaults.
"""
from PIL import Image
from .html_cards import compose_overlay


def layer_window(layer, segment):
    start = segment['start']+layer.start_seconds
    end = min(segment['end'], segment['start']+layer.end_seconds) if layer.end_seconds is not None else segment['end']
    return start, max(start,end)


def scene_media_layers(scene):
    from .studio import StudioLayer
    media = scene.get('studio_media') or {}
    if not media.get('enabled', True):
        return []
    result = []
    if media.get('broll_source'):
        result.append(StudioLayer(id='auto-broll', kind='video', name='B-roll tự chọn', source=media['broll_source'], section='body', x=15, y=44, width=70, height=28, motion='fade'))
    if media.get('sticker_source'):
        result.append(StudioLayer(id='auto-sticker', kind='image', name='Sticker tự chọn', source=media['sticker_source'], section='body', x=70, y=64, width=22, height=14, motion='rise'))
    return result


def scene_sfx_events(segments, style):
    events = []
    for index, segment in enumerate(segments):
        if segment.get('type') != 'card':
            continue
        media = segment.get('scene', {}).get('studio_media') or {}
        source = media.get('sfx_source') if media.get('enabled',True) else ''
        source = source or (style.sfx_source if index else '')
        if source:
            events.append({'source':source, 'start':segment['start']})
    return events[:60]


def mix_scene_sfx(first_index, events, volume, total_duration):
    grouped = {}
    for event in events:
        grouped.setdefault(event['source'], []).append(event['start'])
    parts = []; outputs = []; sources = []
    for offset,(source,starts) in enumerate(grouped.items()):
        sources.append(source)
        split = ''.join(f'[fx_{offset}_{i}]' for i in range(len(starts)))
        parts.append(f';[{first_index+offset}:a]asplit={len(starts)}{split}')
        for i,start in enumerate(starts):
            label = f'delayed_fx_{offset}_{i}'; outputs.append(f'[{label}]')
            delay = round(start*1000)
            parts.append(f';[fx_{offset}_{i}]atrim=0:1.2,asetpts=PTS-STARTPTS,afade=t=out:st=0.95:d=0.25,volume={volume:.3f},adelay={delay}|{delay}[{label}]')
    if not outputs:
        return '', []
    parts.append(f';[raw]{"".join(outputs)}amix=inputs={len(outputs)+1}:duration=first:normalize=0,atrim=0:{total_duration:.3f}[with_sfx]')
    return ''.join(parts), sources


def section_for(scene):
    return {"__cover__": "cover", "__hook__": "hook"}.get(scene.get("author"), "body")


def studio_frame(card, scene, style, width, height):
    section = section_for(scene)
    config = style.model_copy(update={"subtitle": False, "layers": [], "section": section})
    if section in ("cover", "hook") or scene.get("author") == "__cta__":
        title = {"id": "section-title", "kind": "text", "text": scene.get("display_text", ""),
                 "section": section, "x": 8, "y": 36, "width": 84, "height": 35,
                 "size": 80 if section == "cover" else 64, "color": "#ffffff"}
        from .studio import StudioLayer
        config = config.model_copy(update={"layers": [StudioLayer(**title)]})
        card = Image.new("RGBA", (1, 1))
    return compose_overlay(card, scene, config, width, height)


def layer_frame(layer, style, width, height):
    config = style.model_copy(update={"layers": [layer], "section": layer.section, "subtitle": False})
    return compose_overlay(Image.new("RGBA", (1, 1)), {}, config, width, height)


def overlay_filter(base, source, output, start, end, motion="none", height=1920):
    """Animate alpha/position without changing scene duration or voice sync."""
    duration = min(0.25, max(0.04, (end-start)/3))
    prepared = output + "_rgba"
    effects = "format=rgba"
    if motion in ("fade", "rise", "slide"):
        effects += f",fade=t=in:st=0:d={duration:.3f}:alpha=1"
    x = "0"
    y = "0"
    if motion == "rise":
        y = f"max(0,{int(height*.025)}*(1-(t-{start:.3f})/{duration:.3f}))"
    elif motion == "slide":
        x = f"min(0,-80*(1-(t-{start:.3f})/{duration:.3f}))"
    return (f"[{source}:v]{effects},setpts=PTS-STARTPTS+{start:.3f}/TB[{prepared}];"
            f"[{base}][{prepared}]overlay=x='{x}':y='{y}':"
            f"enable='gte(t,{start:.3f})*lt(t,{end:.3f})'[{output}];")


def video_layer_filter(base, source, output, layer, start, end, width, height):
    w = max(2, int(width*layer.width/100)//2*2)
    h = max(2, int(height*layer.height/100)//2*2)
    x, y = int(width*layer.x/100), int(height*layer.y/100)
    effects = f"scale={w}:{h}:force_original_aspect_ratio=decrease,format=rgba,pad={w}:{h}:(ow-iw)/2:(oh-ih)/2:color=black@0,colorchannelmixer=aa={layer.opacity}"
    if layer.motion != "none":
        effects += ",fade=t=in:st=0:d=0.25:alpha=1"
    dx = f"{x}-max(0,80*(1-(t-{start:.3f})/0.25))" if layer.motion == "slide" else str(x)
    dy = f"{y}+max(0,40*(1-(t-{start:.3f})/0.25))" if layer.motion == "rise" else str(y)
    return (f"[{source}:v]{effects},setpts=PTS-STARTPTS+{start:.3f}/TB[{output}_media];"
            f"[{base}][{output}_media]overlay=x='{dx}':y='{dy}':"
            f"enable='gte(t,{start:.3f})*lt(t,{end:.3f})'[{output}];")


def sfx_mix(source_index, segments, style, duration):
    """A short transition sound at each scene change, never under scene zero."""
    starts = [s["start"] for s in segments[1:] if s.get("type") == "card"][:60]
    if not starts or not style.sfx_source or style.sfx_volume == 0:
        return ""
    labels = "".join(f"[sfx_split_{i}]" for i in range(len(starts)))
    filters = f";[{source_index}:a]asplit={len(starts)}{labels}"
    for i, start in enumerate(starts):
        delay = int(start*1000)
        filters += (f";[sfx_split_{i}]atrim=0:1.2,asetpts=PTS-STARTPTS,"
                    f"afade=t=out:st=0.95:d=0.25,volume={style.sfx_volume:.3f},"
                    f"adelay={delay}|{delay}[sfx_{i}]")
    inputs = "".join(f"[sfx_{i}]" for i in range(len(starts)))
    return filters + f";[raw]{inputs}amix=inputs={len(starts)+1}:duration=first:normalize=0,atrim=0:{duration:.3f}[with_sfx]"
