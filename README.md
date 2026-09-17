# Reading Orders VN (Thứ Tự Đọc Truyện Tranh)

Trang tra cứu và theo dõi thứ tự đọc truyện tranh toàn diện dành cho độc giả Việt Nam, được phát triển trực tiếp từ bản gốc của **Comic Book Reading Orders** (hơn **609 reading orders** của Marvel, DC, và truyện tranh độc lập).

---

## 🌟 Các Tính Năng Nổi Bật

1. **Chuẩn xác 100% theo bản gốc**:
   - Toàn bộ hơn 609 reading orders (Marvel Events, Marvel Characters, DC Events, DC Characters, Rebirth, New 52, Invincible, The Boys, Hellboy, TMNT, Star Wars, Spawn...) được bảo toàn nguyên vẹn cấu trúc, màu sắc phân loại tập và hình ảnh.
   - Bảng chú thích màu sắc: Series Dài Kỳ (Đen), Series Giới Hạn (Xanh Lá), One-Shots (Đỏ), Ghi Chú Đọc (Xanh Dương).

2. **Theo dõi tiến độ đọc thông minh (Reading Progress Tracker)**:
   - Checkbox đánh dấu `[x] Đã đọc` bên cạnh từng tập truyện, tự động lưu trữ trên trình duyệt (`localStorage`).
   - Khối hiển thị tiến độ % đọc kèm nút *✓ Đã đọc tất cả* và *↺ Bỏ chọn*.

3. **Tìm kiếm toàn trang tức thì (Global Instant Search)**:
   - Hộp tìm kiếm nhanh hỗ trợ phím tắt `Ctrl + K` hoặc gõ `/`.
   - Tìm kiếm nhanh hơn 609 sự kiện và nhân vật với gợi ý theo vũ trụ (Marvel, DC, Khác).

4. **Nút "Đọc truyện" trực tiếp**:
   - Tích hợp nút `📖 Đọc` bên cạnh từng tập truyện để mở trang đọc online nhanh chóng.

5. **Tốc độ tải trang siêu nhanh**:
   - Chạy trên nền tảng Express tĩnh kết hợp Clean URL, không phụ thuộc cơ sở dữ liệu nặng, tải trang chỉ trong vài mili-giây.

---

## 🚀 Hướng Dẫn Khởi Chạy

Chỉ cần một lệnh duy nhất:

```bash
npm start
```

Mở trình duyệt truy cập: **[http://localhost:3000](http://localhost:3000)**

---

## 📁 Cấu Trúc Dự Án

- `site/`: Thư mục chứa toàn bộ trang web (Marvel, DC, Other, CSS, Fonts, Images, 609 reading orders).
- `site/assets/addon.css` & `addon.js`: Module tương tác (Tracker, Tìm kiếm, Đọc truyện).
- `site/search_index.json`: Chỉ mục tìm kiếm tĩnh hơn 609 reading orders.
- `server/index.ts`: Web server Node/Express phục vụ trang tĩnh và clean URLs.
- `tham_khao/`: Bản sao lưu mirror gốc.

# reading-orders-vn
