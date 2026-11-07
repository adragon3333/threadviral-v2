# Studio — đợt triển khai tiếp theo, 05/11/2026

Tài nguyên master được loại khỏi phạm vi đợt này theo yêu cầu. Không tải thêm master, không cài lại môi trường.

## Chức năng đã triển khai

| Phần | Hành vi |
|---|---|
| 18 preset phụ đề | Đo trực tiếp tên mẫu, font, trọng lượng, kiểu chữ và màu từ trang tham chiếu; cấu hình chung cho CSS preview và MP4. Có một từ, theo nhóm, phối chữ, nền đỏ, bảng neon, các kiểu nhấn màu. |
| 6 tab phụ đề | Mẫu, Chữ, Hiển thị, Chuyển động, Vị trí, Màu & viền. Font thực từ kho local, không dùng ký tự để giả biểu tượng. |
| Minh họa theo cảnh | Gợi ý B-roll, sticker và SFX dựa trên từ khóa nội dung/mô tả tài nguyên; hiển thị lý do chọn, cho sửa từng lựa chọn trước khi áp dụng. |
| Điều khiển theo cảnh | Mỗi cảnh giữ media riêng, có thể tắt minh họa trong nội dung. Nút Xem cảnh đổi preview sang cảnh được chọn. |
| Timeline lớp | Bắt đầu/kết thúc theo giây tương đối trong mỗi cảnh. Bản xuất tự giới hạn thời gian vào độ dài cảnh. Preview có thanh tua và ghi rõ thời lượng ước tính. |
| Gemini / ChatGPT | Có prompt chứa nội dung và danh sách ID tài nguyên; người dùng gửi bằng tài khoản web rồi nhập JSON. Backend kiểm tra phiên bản, hash nội dung, chỉ số cảnh và loại/ID tài nguyên trước khi áp dụng. **Đây là luồng nhập thủ công; chưa điều khiển tab đăng nhập tự động.** |
| Nhật ký tác vụ | SQLite tại `data/render-jobs.sqlite3`, giữ 100 tác vụ gần nhất. Lịch sử đã xong vẫn còn sau restart; job đang chạy khi server dừng được đánh dấu gián đoạn và có thể thử lại bằng cấu hình đã lưu. |
| Hàng đợi | Tối đa 4 tác vụ chờ/đang chạy, 1 tác vụ encode đồng thời; cùng mã yêu cầu/cấu hình trả về cùng job. Cấu hình retry dùng dữ liệu đã lưu, không lấy nhầm dự án đang mở. |
| Dữ liệu cấu hình | Không lưu API key/token/password trong journal; kiểm tra đường dẫn tài nguyên, ID lớp, giới hạn lớp và dữ liệu AI nhập. |
| Nạp bản mới | Gắn phiên bản cho các module/CSS để tránh trình duyệt ghép module cũ và mới. |

Các gợi ý local được ghi nguồn `local_rules`; JSON nhập được ghi `ai_import`. Không ghi nhãn gợi ý quy tắc là đầu ra của Gemini/GPT.

## Bằng chứng kiểm tra

- **134 test gốc + 21 test Studio = 155 pass, 0 fail.**
- Kiểm tra cú pháp các JavaScript module bằng Node thành công.
- Cả 18 preset đã được dựng qua FFmpeg/libASS; ảnh tổng hợp: `outputs/subtitle-presets-contact.jpg`.
- Đã hiệu chỉnh chênh lệch cách tính cỡ font giữa CSS/Pillow và libASS bằng thông số EM/Windows ascender-descender của font TTF để nền nhấn và vị trí từng từ khớp hơn.
- Video thử nhiều cảnh có giọng thật, WordBoundary, B-roll/sticker/SFX riêng theo cảnh: 1080 × 1920, 9.46 giây. Lớp đặt thời gian chỉ xuất hiện trong khoảng đã cấu hình; ảnh trước/trong/sau có số pixel trắng trong vùng kiểm tra là 0 / 3673 / 0.
- Trên UI đã chọn preset, tạo/xem/sửa đề xuất, áp dụng và xuất thêm MP4 có giọng thật: 1080 × 1920; browser đọc được duration, readyState 4, không có lỗi video.
- Đã gửi lại chính payload của job trên server; nhận cùng job ID và chỉ có một bản ghi.
- Đã restart server rồi đọc lại job hoàn tất và tải file MP4: HTTP 200.
- Kiểm thử SQLite riêng xác nhận job đang chạy/chờ được đánh dấu gián đoạn khi phục hồi; kết quả job hoàn tất được giữ và thông tin credential bị loại.
- Trên UI: nhập JSON có URL ngoài kho bị chặn; nhập JSON kiểm thử dùng ID hợp lệ mở được màn xem xét. Không gọi tài khoản AI bên ngoài trong kiểm thử này.
- Trên UI: lớp 0.5–1.5 giây ẩn ở giây 0, hiện ở giây 1 và ẩn ở giây 3.
- Đã xuất bản sao rồi nhập lại cấu hình ban đầu sau kiểm thử; không giữ các lớp/minh họa thử trong dự án người dùng.

## Sử dụng

1. Mở http://127.0.0.1:8000/studio.
2. Nhập bài viết/bình luận; chọn Xem cảnh để kiểm tra từng cảnh.
3. Mở **Tự động → Tạo gợi ý theo cảnh**, xem lý do và sửa lựa chọn, sau đó Áp dụng.
4. Mở **Phụ đề** để chọn trong 18 mẫu và chỉnh thông số.
5. Chọn lớp để đặt Bắt đầu/Kết thúc; tua preview để kiểm tra vị trí/thời gian ước tính.
6. Dựng video. Xem lại kết quả ở **Tác vụ dựng** hoặc **Video đã tạo**.

Luồng AI: **Tự động → Dùng kết quả Gemini / GPT → Sao chép prompt → gửi trên web AI → dán JSON → Kiểm tra → xem xét → Áp dụng**. Khi sửa nội dung sau khi tạo prompt, phải tạo prompt mới; kế hoạch cũ sẽ bị từ chối.

Lệnh kiểm tra:

```powershell
.venv/Scripts/python.exe -X utf8 tools/run_tests.py
.venv/Scripts/python.exe -X utf8 -m unittest tools.test_studio tools.test_studio_pipeline tools.test_studio_next -v
.venv/Scripts/python.exe -X utf8 tools/verify_subtitle_presets.py
```

## Phần vẫn chưa nghiệm thu

- Tự động điều khiển Gemini Pro/ChatGPT Plus/Muse trong tab đăng nhập; hiện có cầu nối prompt/JSON thủ công.
- Nhận diện cảm xúc/hình ảnh bằng mô hình AI thực: gợi ý nội bộ vẫn là bộ quy tắc, có thể chọn chưa phù hợp và cần xem lại.
- Độ giống từng pixel, glow/gradient và toàn bộ động học của preset gốc; CSS và libASS vẫn có khác biệt.
- Preview chưa phát toàn bộ timeline giọng đọc như một trình biên tập NLE; thời lượng preview ghi rõ là ước tính. MP4 dùng thời lượng thật của audio.
- Chưa có keyframe tùy ý, worker tách tiến trình, kiểm thử tải nhiều người dùng hoặc kiểm định lại tập URL Threads thực đa dạng.
- Job gián đoạn cần bấm Thử lại; không tiếp tục encode từ frame đang dở. Bản ghi cũ trước đợt lưu journal có thể không có cấu hình retry.

Đây là bản local được kiểm thử chức năng, chưa phải nghiệm thu toàn bộ sản phẩm giống ThreadViral 100%.
