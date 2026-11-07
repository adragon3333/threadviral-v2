# Kho mẫu giọng — 05/11/2026

Đã lấy đủ **35 giọng đang hiển thị trong mục tiếng Việt** của ThreadViral: **3 CapCut cơ bản + 32 VieNeu Pro**.

## Kết quả

- 35 MP3 riêng biệt, tổng **1.777.968 byte**, mỗi đoạn **3.017–5.112 giây**.
- Tên, mã giọng gốc, nhà cung cấp, giới tính và mô tả được đối chiếu với phản hồi `voices-config?lang=vi` trong phiên đăng nhập được người dùng cho phép.
- URL MP3 được quan sát khi bấm nghe thử từng giọng. Khi tải file dùng GET công khai, không sao chép cookie hoặc API key.
- Mọi file được FFprobe xác nhận là MP3 có audio/thời lượng hợp lệ; lưu kích thước và SHA-256. Có 35 checksum khác nhau.
- Tài nguyên tại `assets/library/voices/`; thư viện chung hiện có **1.112 tài nguyên**, kiểm tra SHA-256 đạt **1.112/1.112**.

## Truy cập

- `http://127.0.0.1:8000/studio` → **Giọng đọc → Mẫu ThreadViral (35)**.
- Kho độc lập: `http://127.0.0.1:8000/assets/library/voices/index.html`.
- Có tìm tên/phong cách, lọc nam/nữ và CapCut/VieNeu, nghe thử và tải từng MP3. Trang kho độc lập dùng file tương đối, có thể mở sau khi giải nén ZIP.

## Ranh giới chức năng

Các MP3 này là **đoạn nghe thử cố định**, không phải model, trọng số hay bộ tổng hợp giọng. Tải file mẫu không cho phép tạo câu mới bằng cùng giọng.

Studio giữ hai giọng tổng hợp đã nối: Hoài My/Nam Minh qua Edge-TTS. Những giọng mẫu không được gán giả sang hai giọng này. API và file dự án từ chối dùng ID giọng mẫu để dựng nội dung mới, thay vì âm thầm thay sang giọng khác.

Muốn đọc văn bản mới bằng 35 giọng này cần một bộ tổng hợp/dịch vụ tương ứng được kết nối riêng. Đợt này chưa triển khai bộ tổng hợp đó. Chưa lấy các catalog tiếng Anh/tiếng Trung; phạm vi hoàn tất là 35 giọng tiếng Việt quan sát được.

## Kiểm tra

- **134 test gốc + 27 test Studio = 161 pass, 0 fail**.
- Kiểm tra API phân biệt mẫu/giọng tổng hợp; thử ID mẫu trong render/project/voice-preview bị từ chối, không bị thay giọng ngầm.
- Kiểm tra Range HTTP trả đúng 128 byte đầu của MP3 với mã 206.
- Trên UI: 35 dòng; tìm không dấu `co gai` trả đúng Cô Gái Hoạt Ngôn; bộ lọc CapCut + nữ trả đúng một giọng.
- Phát mẫu tại local thành công: readyState 4, duration 4.8 giây, không có lỗi media.
- Tải MP3 bằng link giao diện thành công. Giọng dựng video vẫn là Hoài My sau khi nghe/lọc mẫu.

Lệnh tái kiểm tra:

```powershell
.venv/Scripts/python.exe -X utf8 tools/sync_voice_previews.py
.venv/Scripts/python.exe -X utf8 tools/register_voice_previews.py
.venv/Scripts/python.exe -X utf8 tools/sync_resources.py --verify
.venv/Scripts/python.exe -X utf8 -m unittest tools.test_voice_library -v
```

`catalog.json` và `source-map.json` lưu nguồn/metadata; không có tài khoản, token, cookie hoặc mã JavaScript ứng dụng gốc trong bộ ZIP giọng.
