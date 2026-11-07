"""Measured subtitle presets shared with the Studio UI.

ASS positions are measured with the same local fonts. Word backgrounds and
mixed fonts are separate vector/text events, not Unicode approximations.
"""
import json
import struct
from functools import lru_cache
from PIL import ImageFont
from .config import APP_ROOT

PRESETS = {p['id']: p for p in json.loads((APP_ROOT/'studio/subtitle-presets.json').read_text(encoding='utf-8'))}
FONTS = json.loads((APP_ROOT/'studio/subtitle-fonts.json').read_text(encoding='utf-8'))
ALIASES = {'karaoke': 'bold-gold', 'comic': 'rounded-comic', 'bold': 'short-bold', 'soft': 'rounded-white', 'neon': 'rounded-neon'}


def effective_preset(cfg):
    preset = dict(PRESETS.get(ALIASES.get(cfg.subtitle_preset, cfg.subtitle_preset), PRESETS['bold-gold']))
    for field, key in [('subtitle_size','size'), ('subtitle_color','color'), ('subtitle_motion','motion'),
                       ('subtitle_font','font'), ('subtitle_highlight','highlight'), ('subtitle_words','words'),
                       ('subtitle_outline','outline'), ('subtitle_shadow','shadow'), ('subtitle_display','mode')]:
        value = getattr(cfg, field, None)
        if field in cfg.model_fields_set and value is not None:
            preset[key] = value
    case = getattr(cfg, 'subtitle_case', None)
    if case in ('original','upper'):
        preset['uppercase'] = case == 'upper'
    return preset


def font_face(family, weight=700):
    matches = [f for f in FONTS if f['family'] == family and not f['italic']]
    return min(matches, key=lambda f: abs(f['weight']-weight)) if matches else FONTS[0]


@lru_cache(maxsize=128)
def font_metrics(family, weight, size):
    face = font_face(family, weight)
    return ImageFont.truetype(str(APP_ROOT/'assets/library/fonts'/face['file']), max(8, size))


@lru_cache(maxsize=32)
def ass_font_scale(filename):
    """libASS sizes by Windows ascender/descender; CSS/Pillow size by the EM.

    Compensate this difference so individually positioned words stay together
    and their boxes match the preview, especially Vietnamese font metrics.
    """
    data = (APP_ROOT/'assets/library/fonts'/filename).read_bytes()
    count = struct.unpack_from('>H',data,4)[0]
    tables = {}
    for index in range(count):
        tag,checksum,offset,length = struct.unpack_from('>4sIII',data,12+index*16)
        tables[tag] = offset
    em = struct.unpack_from('>H',data,tables[b'head']+18)[0]
    ascent,descent = struct.unpack_from('>HH',data,tables[b'OS/2']+74)
    return em/max(1,ascent+descent)


def ass_color(value):
    return '&H'+value[5:7]+value[3:5]+value[1:3]+'&'


def ass_time(value):
    ticks = round(value*100)
    return f'{ticks//360000}:{ticks//6000%60:02d}:{ticks//100%60:02d}.{ticks%100:02d}'


def safe_text(text):
    return str(text).replace('\\','').replace('{','').replace('}','').replace('\n',' ')


def rounded_path(width, height, radius=8):
    w,h,r = int(width),int(height),int(min(radius,width/2,height/2))
    return f'm {r} 0 l {w-r} 0 b {w} 0 {w} 0 {w} {r} l {w} {h-r} b {w} {h} {w} {h} {w-r} {h} l {r} {h} b 0 {h} 0 {h} 0 {h-r} l 0 {r} b 0 0 0 0 {r} 0'


def preset_ass(segments, cfg, width, height, filename):
    from .procedural import caption_words
    preset = effective_preset(cfg)
    header = f'''[Script Info]
ScriptType: v4.00+
PlayResX: {width}
PlayResY: {height}
WrapStyle: 2
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Baloo 2,44,&H00FFFFFF,&H00FFFFFF,&H00000000,&H88000000,-1,0,0,0,100,100,0,0,1,2,1,7,0,0,0,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
    events = []
    def emit(layer, start, end, tags, text):
        if end > start:
            events.append(f'Dialogue: {layer},{ass_time(start)},{ass_time(end)},Main,,0,0,0,,{{{tags}}}{text}')
    def position(x, y, elapsed, motion):
        remaining = max(0, .18-elapsed)
        if motion in ('rise','drop') and remaining > 0:
            offset = (16 if motion == 'rise' else -16)*remaining/.18*width/1080
            return f'\\move({x:.1f},{y+offset:.1f},{x:.1f},{y:.1f},0,{int(remaining*1000)})'
        return f'\\pos({x:.1f},{y:.1f})'
    for segment in segments:
        if segment.get('scene',{}).get('author') in ('__cover__','__hook__','__cta__'):
            continue
        rows = caption_words(segment)
        count = 1 if preset['mode'] == 'single' else preset['words']
        for index in range(0,len(rows),count):
            group = rows[index:index+count]
            specs = []
            for i, word in enumerate(group):
                pattern = preset['pattern'][i % len(preset['pattern'])] if preset['mode'] == 'mixed' and preset['pattern'] else {}
                family = pattern.get('font',preset['font'])
                weight = pattern.get('weight',preset['weight'])
                size = max(8, round(preset['size']*width/1080*pattern.get('scale',1)))
                text = safe_text(word['text'])
                uppercase = cfg.subtitle_case == 'upper' if cfg.subtitle_case in ('original','upper') else pattern.get('uppercase',preset['uppercase'])
                if uppercase: text = text.upper()
                font = font_metrics(family,weight,size)
                specs.append({'text':text,'family':family,'weight':weight,'size':size,'width':float(font.getlength(text)), 'emphasis':pattern.get('emphasis',False)})
            gap = max(3,preset['size']*width/1080*.23)
            total = sum(s['width'] for s in specs)+gap*(len(specs)-1)
            shrink = min(1,width*.88/max(1,total))
            if shrink < 1:
                for spec in specs:
                    spec['size'] = max(8,round(spec['size']*shrink))
                    spec['width'] = float(font_metrics(spec['family'],spec['weight'],spec['size']).getlength(spec['text']))
                total = sum(s['width'] for s in specs)+gap*(len(specs)-1)
            line_height = max(s['size'] for s in specs)*1.45
            x0,y0 = (width-total)/2, height*cfg.subtitle_y/100-line_height/2
            group_start = segment['start']+group[0]['start']
            group_end = min(segment['end'],segment['start']+group[-1]['end'])
            if preset['panel']:
                emit(0,group_start,group_end,f'\\an7\\pos({x0-14:.1f},{y0-6:.1f})\\p1\\bord1\\shad0\\1c{ass_color(preset["panel"])}\\3c{ass_color(preset["highlight"])}',rounded_path(total+28,line_height+12))
            for active, word in enumerate(group):
                start = segment['start']+word['start']
                end = min(group_end, segment['start']+group[active+1]['start']) if active+1 < len(group) else group_end
                x = x0
                for i,spec in enumerate(specs):
                    y = y0+(line_height-spec['size']*1.45)/2
                    pos = position(x,y,start-group_start,preset['motion'])
                    highlight = preset['highlight']
                    if preset['rainbow']: highlight = ['#f472b6','#facc15','#86efac','#67e8f9'][i%4]
                    color = highlight if i == active or spec['emphasis'] else preset['color']
                    if i == active and preset['word_background']:
                        emit(1,start,end,f'\\an7{pos}\\p1\\bord0\\shad0\\1c{ass_color(preset["word_background"])}',rounded_path(spec['width']+8,spec['size']*1.45,6))
                    face = font_face(spec['family'],spec['weight'])
                    ass_size = spec['size']/ass_font_scale(face['file'])
                    tags = f'\\an7{pos}\\fn{face["ass_family"]}\\fs{ass_size:.2f}\\b{1 if spec["weight"]>=700 else 0}\\1c{ass_color(color)}\\bord{preset["outline"]*width/1080:.2f}\\shad{preset["shadow"]*width/1080:.2f}'
                    if preset['glow']: tags += '\\blur1.2'
                    if preset['motion'] in ('bounce','bob','pulse') and start-group_start < .12:
                        remain = max(1,int((.12-(start-group_start))*1000))
                        tags += f'\\fscx94\\fscy94\\t(0,{remain},\\fscx100\\fscy100)'
                    emit(2,start,end,tags,spec['text'])
                    x += spec['width']+gap
    filename.write_text(header+'\n'.join(events),encoding='utf-8-sig')
    return filename
