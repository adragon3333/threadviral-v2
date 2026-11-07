# Studio local — bàn giao ngày 05/11/2026

Trạng thái: bản triển khai local có chức năng hoạt động, chưa nghiệm thu tương đương ThreadViral 100%.

## Truy cập

- Studio: http://127.0.0.1:8000/studio
- Tài nguyên: http://127.0.0.1:8000/resources
- Giao diện cũ của repo: http://127.0.0.1:8000/

Không cài lại dependencies. Server chỉ nghe 127.0.0.1:8000. Kiểm tra listener và job trước khi khởi động lại.

## Đợt triển khai này

| Hạng mục | Hành vi đã nối vào sản phẩm |
|---|---|
| Bìa | Bật/tắt, tiêu đề và thời lượng; có cảnh bìa thật trong timeline, không đọc tiêu đề bìa |
| Mở đầu / lời kết | Nội dung riêng, có giọng đọc; các lớp trong phần Mở đầu được xuất đúng phần |
| Chuyển cảnh | Cắt thẳng, hiện dần hoặc trồi lên; không làm thay đổi độ dài voice |
| Lớp | Chữ/hình/ảnh/video có hiệu ứng vào cảnh: tĩnh, hiện dần, trồi lên hoặc trượt vào |
| B-roll | Lớp video độc lập với nền, chỉnh X/Y/rộng/cao/opacity; video tắt âm gốc |
| SFX | Chọn từ thư viện, chỉnh âm lượng; phát tối đa 1.2 giây tại mỗi lần đổi cảnh sau cảnh đầu |
| Phụ đề | Lưu và dùng WordBoundary thực từ Edge-TTS; kết quả dựng ghi rõ khi dùng ước tính |
| Giọng đọc | Nghe thử trước khi xuất; Studio giữ đúng giọng được chọn, dừng và báo lỗi khi provider thất bại |
| Nội dung | Nối bộ chấm điểm bình luận và gợi ý kịch bản sẵn có của repo; nguồn template hiển thị rõ |
| Dự án | Tự lưu trình duyệt, xuất/nhập JSON có version và xác thực cấu hình ở backend |
| Tiến trình | Reload trang tiếp tục theo dõi job hiện có; không tự gửi thêm job trùng |
| Đầu ra | MP4 H.264/AAC, ảnh bìa JPG, timeline và loại timing phụ đề trong kết quả API |
| Preflight | Kiểm tra cảnh trống, giới hạn cảnh và tài nguyên thiếu trước khi gọi TTS/render |

Icon Threads và icon tương tác tiếp tục dùng SVG đã trích từ trang tham chiếu. Không thay logo bằng ký tự.

## Bằng chứng kiểm thử

- Bộ gốc: **134 pass, 0 fail**.
- Studio: **13 test pass**, gồm Chromium chụp thẻ, cấu hình nhập, đường dẫn tài nguyên, WordBoundary/gap thực, cách ly lớp theo phần, lỗi provider và preflight API.
- JavaScript module: kiểm tra cú pháp bằng Node thành công.
- Xuất thử nhiều cảnh: **1080 × 1920**, bìa → mở đầu → hai cảnh → lời kết, chuyển cảnh/lớp/SFX; FFprobe đọc được video/audio và thời lượng hợp lệ.
- Xuất thử có giọng thật: **1080 × 1920, 7.12 giây**, WordBoundary và B-roll độc lập. Đây là mẫu xác nhận tích hợp, không phải kiểm định độ tự nhiên của mọi giọng/nội dung.
- Trên UI: MP4 có giọng đọc phát được, readyState 4, 1080 × 1920. Reload trong lúc dựng vẫn nhận kết quả; thử nghe giọng thành công.
- Đã thử xuất rồi nhập lại dự án qua file chooser và khôi phục cấu hình trước khi kiểm thử.
- Ghi nhận một lần Edge-TTS thất bại ở câu mở đầu. Luồng lỗi được bổ sung kiểm thử để đảm bảo không xuất thành video im lặng. Dịch vụ bên ngoài vẫn có thể lỗi ở lần sử dụng tiếp theo.

Lệnh chạy:

```powershell
.venv/Scripts/python.exe -X utf8 tools/run_tests.py
.venv/Scripts/python.exe -X utf8 -m unittest tools.test_studio tools.test_studio_pipeline -v
Get-Content studio/studio.js -Raw | node --input-type=module --check
.venv/Scripts/python.exe -X utf8 tools/verify_studio_export.py
```

Lệnh cuối sinh mẫu nhiều cảnh không giọng để kiểm tra bố cục; không được dùng để tuyên bố TTS đã thành công.

## Phần chưa nghiệm thu / công việc tiếp theo

1. **Độ giống thiết kế:** cần đối chiếu từng màn/preset với sản phẩm gốc ở cùng kích thước, chủ đề và nội dung. Chưa có toàn bộ preset, timeline biên tập theo giây hay chuyển động keyframe tùy ý.
2. **AI qua tài khoản web:** chưa có adapter tự động dùng Gemini Pro, ChatGPT Plus hay Muse trong tab ẩn. Gợi ý hiện dùng template khi không có provider API được cấu hình; không ghi nhãn template là AI từ các tài khoản này.
3. **SFX/B-roll thông minh:** đã chọn và chèn thủ công, chưa có mô hình tự chọn theo cảm xúc/ngữ cảnh.
4. **Tài nguyên master:** nhạc/video crawl được là preview. Những đường dẫn master đã kiểm tra trả 404; chưa có bằng chứng bộ master đầy đủ.
5. **Độ bền job:** trạng thái job đang giữ trong bộ nhớ server. Reload trình duyệt được hỗ trợ, khởi động lại server không tự phục hồi tác vụ đang chạy.
6. **Nguồn Threads:** sử dụng scraper hiện có. Đợt này chưa kiểm định lại nhiều bài Threads thực hoặc mọi trường hợp đăng nhập/chặn truy cập; không thể đảm bảo mọi URL đều lấy đủ bình luận.
7. **Hiệu năng:** chưa stress test dự án nhiều lớp/nhiều cảnh dài hoặc nhiều người dùng; cần worker riêng, giới hạn tài nguyên và kiểm thử tải trước khi chạy dịch vụ công khai.
8. **Preview:** bố cục xem trước không mô phỏng audio timeline đầy đủ; dùng Nghe thử và MP4 đầu ra để kiểm tra giọng. Bìa JPG lấy khung đầu của MP4.

## Phân công theo trách nhiệm cho đợt tiếp theo

- BA/PO: lập danh sách màn/tùy chọn và tiêu chí so sánh 1:1; chốt trường hợp dữ liệu bài viết/bình luận.
- Frontend: hoàn thiện preset, timeline và kiểm tra responsive/accessibility, đối chiếu ảnh cùng viewport.
- Backend/media: provider adapter, job lưu bền, render worker và tối ưu số lượng input FFmpeg.
- QA: kiểm tra luồng URL thật, dịch vụ lỗi, dữ liệu dài, nhiều lớp, âm thanh, reload và nhập/xuất dự án.
- DevOps: chỉ triển khai công khai sau khi có cấu hình xác thực, lưu trữ và giới hạn tải phù hợp; hiện là local.

Các vai trò trên là kế hoạch trách nhiệm, không phải tuyên bố có các thành viên độc lập đã thực hiện.
