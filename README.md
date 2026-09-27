# LearnVocab

Ứng dụng web tĩnh, có thể cài lên màn hình chính và dùng lại offline sau lần mở đầu tiên.

## Chạy trên máy

Mở terminal ở thư mục này và chạy một static server, ví dụ:

```powershell
python -m http.server 8000
```

Truy cập `http://localhost:8000`. Không mở `index.html` bằng `file://` vì trình duyệt chặn service worker và việc nạp catalog.

## Thêm giáo trình hoặc bài học

1. Tạo thư mục giáo trình ở thư mục gốc, ví dụ `mimikara/`.
2. Đặt các file `lesson1.js`, `lesson2.js`... trong đó. Mỗi file khai báo dữ liệu theo cấu trúc `window.LESSONS[...]` hiện có.
3. Chạy `python tools/build_catalog.py` để quét thư mục và cập nhật `catalog.json`.
4. Đưa các file website lên static hosting. Trên GitHub Pages không cần chạy Python server; chỉ cần publish các file tĩnh sau khi tạo catalog.

Tên thư mục được dùng làm nhóm giáo trình trong giao diện. Tên file được dùng làm định danh bài học.

## Dữ liệu học

Tiến độ lưu trong trình duyệt trên từng thiết bị. Xuất/nhập JSON vẫn dùng được để chuyển tiến độ thủ công giữa thiết bị; muốn tự đồng bộ cần bổ sung dịch vụ lưu trữ có tài khoản.
