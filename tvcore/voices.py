"""Keep downloaded voice samples separate from available synthesis engines."""
import json
from .config import APP_ROOT
from .tts import AVAILABLE_VOICES


def reference_voices():
    path = APP_ROOT/'assets/library/voices/catalog.json'
    if not path.is_file():
        return []
    return json.loads(path.read_text(encoding='utf-8'))['voices']


def validate_synthesis_voice(value):
    if value not in {voice['id'] for voice in AVAILABLE_VOICES}:
        raise ValueError('Giọng chưa có bộ tổng hợp được kết nối. File MP3 nghe thử không tạo được lời đọc mới; hãy chọn Hoài My hoặc Nam Minh để dựng video.')
    return value
