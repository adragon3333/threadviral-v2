"""SQLite journal for local render jobs; requests never contain provider keys."""
import json
import sqlite3
import time
from pathlib import Path
from contextlib import contextmanager


class JobStore:
    def __init__(self, path: Path):
        self.path = Path(path)
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute('PRAGMA journal_mode=WAL')
            db.execute('CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, updated REAL NOT NULL, record TEXT NOT NULL)')

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=5)
        try:
            with db:
                yield db
        finally:
            db.close()

    def save(self, record):
        with self.connect() as db:
            db.execute('INSERT INTO jobs(id,updated,record) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET updated=excluded.updated,record=excluded.record',
                       (record['id'], record['updated_at'], json.dumps(record, ensure_ascii=False, allow_nan=False)))
            db.execute('DELETE FROM jobs WHERE id NOT IN (SELECT id FROM jobs ORDER BY updated DESC LIMIT 100)')

    def load(self, recover=False):
        with self.connect() as db:
            rows = db.execute('SELECT record FROM jobs ORDER BY updated DESC LIMIT 100').fetchall()
        records = []
        for row in rows:
            record = json.loads(row[0])
            if recover and record['status'] in ('queued', 'running'):
                record.update(status='error', message='Tác vụ bị gián đoạn', error='Server đã dừng khi tác vụ chưa hoàn tất. Bấm Thử lại để dựng lại từ cấu hình đã lưu.', updated_at=time.time())
                self.save(record)
            records.append(record)
        return records
