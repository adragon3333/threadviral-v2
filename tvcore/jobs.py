"""
Job queue cho render video.

Render trước đây chạy blocking subprocess ngay trong event loop -> chặn server.
Bây giờ mỗi render là 1 job chạy nền, client poll tiến trình qua SSE.
"""
import asyncio
import time
import uuid
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional
from .config import WORK_ROOT
from .job_store import JobStore

# job_id -> trạng thái
_JOBS: Dict[str, "RenderJob"] = {}
_JOBS_LOCK = asyncio.Lock()

# Giữ tối đa 100 job gần nhất
_MAX_JOBS = 100
_STORE: Optional[JobStore] = None
MAX_PENDING = 4


class QueueFull(ValueError):
    pass


class RequestConflict(ValueError):
    pass


def without_credentials(value):
    if isinstance(value, dict):
        return {k:without_credentials(v) for k,v in value.items() if not any(x in k.lower() for x in ('api_key','token','password','secret'))}
    if isinstance(value, list):
        return [without_credentials(v) for v in value]
    return value


@dataclass
class RenderJob:
    id: str
    status: str = "queued"          # queued | running | done | error
    progress: float = 0.0
    message: str = "Đang xếp hàng..."
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    request: Optional[Dict[str, Any]] = field(default=None, repr=False)

    def as_dict(self) -> Dict[str, Any]:
        return {
            "job_id": self.id,
            "status": self.status,
            "progress": round(self.progress, 3),
            "message": self.message,
            "result": self.result,
            "error": self.error,
            "elapsed": round(time.time() - self.created_at, 1),
            "created_at": self.created_at,
            "retryable": bool(self.request),
        }


def initialize(recover=False, path=None):
    global _STORE, _JOBS
    _STORE = JobStore(path or WORK_ROOT / 'data/render-jobs.sqlite3')
    _JOBS = {record['id']: RenderJob(**record) for record in _STORE.load(recover=recover)}


def _save(job):
    if _STORE is not None:
        _STORE.save(asdict(job))


async def enqueue(payload=None):
    async with _JOBS_LOCK:
        safe = without_credentials(payload or {})
        request_id = (payload or {}).get('client_request_id')
        if request_id:
            existing = next((j for j in _JOBS.values() if (j.request or {}).get('client_request_id') == request_id), None)
            if existing:
                if existing.request != safe:
                    raise RequestConflict('Mã yêu cầu đã được dùng cho một cấu hình khác. Gửi yêu cầu mới để dựng cấu hình đã sửa.')
                return existing, False
        if sum(j.status in ('queued', 'running') for j in _JOBS.values()) >= MAX_PENDING:
            raise QueueFull('Hàng đợi đã có 4 tác vụ. Chờ một tác vụ hoàn tất rồi thử lại.')
        # Credentials must not be persisted, including callers outside server.py.
        job = RenderJob(id=uuid.uuid4().hex[:12], request=safe or None)
        _JOBS[job.id] = job
        _prune()
        _save(job)
        return job, True


def _prune() -> None:
    """Xoá job cũ nếu vượt quá giới hạn."""
    if len(_JOBS) <= _MAX_JOBS:
        return
    ordered = sorted(_JOBS.values(), key=lambda j: j.created_at)
    for job in ordered[: len(_JOBS) - _MAX_JOBS]:
        if job.status in ("done", "error"):
            _JOBS.pop(job.id, None)


async def create_job() -> RenderJob:
    job, _ = await enqueue()
    return job


async def start_job(job_id):
    job = _JOBS.get(job_id)
    if job:
        job.status = 'running'
        job.updated_at = time.time()
        _save(job)


def get_job(job_id: str) -> Optional[RenderJob]:
    return _JOBS.get(job_id)


def active_retry(job_id):
    return next((j for j in _JOBS.values() if j.status in ('queued','running') and (j.request or {}).get('retry_of') == job_id), None)


async def update_job(job_id: str, progress: float, message: str) -> None:
    job = _JOBS.get(job_id)
    if job and job.status in ('queued', 'running'):
        job.progress = max(job.progress, max(0.0, min(1.0, progress)))
        job.message = message
        job.updated_at = time.time()
        _save(job)


async def finish_job(job_id: str, result: Dict[str, Any]) -> None:
    job = _JOBS.get(job_id)
    if job:
        job.status = "done"
        job.progress = 1.0
        job.message = "Hoàn tất!"
        job.result = result
        job.updated_at = time.time()
        _save(job)


async def fail_job(job_id: str, error: str) -> None:
    job = _JOBS.get(job_id)
    if job:
        job.status = "error"
        job.message = "Thất bại"
        job.error = error
        job.updated_at = time.time()
        _save(job)


def list_jobs() -> List[Dict[str, Any]]:
    return [j.as_dict() for j in sorted(_JOBS.values(), key=lambda x: x.created_at, reverse=True)]
