"""Tiện ích: dọn video cũ trong outputs/ (giới hạn số lượng và tự động xóa sau 24h)."""
import os
import time
from typing import List, Optional, Tuple

from .config import OUTPUTS_DIR

MAX_OUTPUT_VIDEOS = 30


def cleanup_expired_24h_videos() -> Tuple[int, int]:
    """Tự động xóa các video xuất ra đã cũ hơn 24 giờ (86.400s) để giải phóng dung lượng."""
    if not OUTPUTS_DIR.exists():
        return 0, 0
    now = time.time()
    removed = 0
    freed = 0
    try:
        for f in OUTPUTS_DIR.iterdir():
            if f.is_file() and f.suffix.lower() == ".mp4":
                # Kiem tra neu qua 24 gio (86400 giay)
                if now - f.stat().st_mtime > 86400:
                    sz = f.stat().st_size
                    f.unlink(missing_ok=True)
                    removed += 1
                    freed += sz
    except OSError:
        pass
    return removed, freed // (1024 * 1024)


def cleanup_old_videos(max_keep: int = MAX_OUTPUT_VIDEOS,
                       keep_names: Optional[List[str]] = None) -> Tuple[int, int]:
    """
    Xóa các video cũ hơn 24 giờ và các video vượt quá `max_keep` video mới nhất.
    """
    if not OUTPUTS_DIR.exists():
        return 0, 0

    # 1. Tu dong xoa cac video cu hon 24h truoc
    removed_24h, freed_24h = cleanup_expired_24h_videos()

    try:
        files = [f for f in OUTPUTS_DIR.iterdir()
                 if f.is_file() and f.suffix.lower() == ".mp4"]
    except OSError:
        return removed_24h, freed_24h

    if len(files) <= max_keep:
        return removed_24h, freed_24h

    # Moi nhat truoc
    files.sort(key=lambda f: f.stat().st_mtime, reverse=True)

    keep = set(keep_names or [])
    removed = removed_24h
    freed = freed_24h * 1024 * 1024
    for f in files[max_keep:]:
        if f.name in keep:
            continue
        try:
            sz = f.stat().st_size
            f.unlink(missing_ok=True)
            removed += 1
            freed += sz
        except OSError:
            continue

    return removed, freed // (1024 * 1024)


def outputs_disk_usage_mb() -> int:
    """Tong dung luong (MB) trong thu muc outputs/."""
    if not OUTPUTS_DIR.exists():
        return 0
    total = 0
    try:
        for f in OUTPUTS_DIR.iterdir():
            if f.is_file():
                total += f.stat().st_size
    except OSError:
        pass
    return total // (1024 * 1024)
