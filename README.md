# 📚 Reading Orders VN (Thứ Tự Đọc Truyện Tranh)

<p align="center">
  <img src="site/wp-content/uploads/main.header.svg" alt="Comic Book Reading Orders VN" width="480">
</p>

<p align="center">
  <strong>Cổng tra cứu và theo dõi thứ tự đọc truyện tranh toàn diện nhất dành cho độc giả Việt Nam</strong>
</p>

<p align="center">
  <a href="https://reading-orders-vn-puce.vercel.app/"><img src="https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel" alt="Vercel Deployment"></a>
  <img src="https://img.shields.io/badge/Reading_Orders-609+-e42525?style=for-the-badge&logo=marvel" alt="609+ Reading Orders">
  <img src="https://img.shields.io/badge/Language-Tiếng_Việt_100%25-0066aa?style=for-the-badge" alt="Vietnamese 100%">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 📖 Giới Thiệu Dự Án

**Reading Orders VN** là nền tảng tra cứu thứ tự đọc truyện tranh (Comic Book Reading Orders) chuẩn xác và đầy đủ nhất, được tối ưu và bản địa hóa **100% Tiếng Việt** từ cơ sở dữ liệu khổng lồ của *Comic Book Reading Orders*. 

Hệ thống bao gồm hơn **609 danh sách thứ tự đọc** bao quát từ các vũ trụ điện ảnh, đại sự kiện (Events), hành trình nhân vật (Characters) đến các bộ truyện tranh độc lập (Indie Comics).

🌐 **Trang web chính thức:** [https://reading-orders-vn-puce.vercel.app/](https://reading-orders-vn-puce.vercel.app/)

---

## ✨ Tính Năng Nổi Bật

### 1. 🗂️ Thư Viện 609+ Thứ Tự Đọc Toàn Diện
- **Marvel Universe**:
  - *Đại Sự Kiện (Events)*: Từ các sự kiện kinh điển (Secret Wars 1984, Infinity Gauntlet, Civil War, House of M...) đến thời kỳ hiện đại (Secret Wars 2015, Krakoa Era, Blood Hunt, One World Under Doom...).
  - *Hành Trình Nhân Vật (Characters)*: Spider-Man, Iron Man, Wolverine, Avengers, X-Men, Deadpool, Moon Knight, Daredevil...
  - *Kỷ Nguyên Đọc (Master Orders)*: 15 phần Master Reading Order phân theo từng giai đoạn thời gian.
- **DC Comics**:
  - *Đại Sự Kiện (Events)*: Crisis on Infinite Earths, Flashpoint, Blackest Night, Dark Nights: Metal, DC All In...
  - *Hành Trình Nhân Vật (Characters)*: Batman, Superman, Flash, Green Lantern, Wonder Woman...
  - *Thời Kỳ (Eras)*: Golden Age, Silver Age, Post-Crisis, New 52, DC Rebirth, Infinite Frontier.
- **Truyện Khác (Other / Indie Comics)**:
  - The Boys, Invincible, Hellboy, Spawn, TMNT (Teenage Mutant Ninja Turtles), Star Wars (Canon & Legends), Doctor Who, Transformers, Valiant Universe...

### 2. 🇻🇳 Bản Địa Hóa 100% Tiếng Việt
- Toàn bộ giao diện hệ thống: Trang chủ, Thanh điều hướng (Navbar), Tìm kiếm, Hỏi Đáp (FAQ), Liên Hệ (Contact), và Nhật Ký Cập Nhật (Updates) được dịch thuật tự nhiên, chuẩn văn phong truyện tranh.
- Giữ nguyên cấu trúc phân màu chuẩn quốc tế:
  - ⚫ **Màu Đen**: Bộ truyện dài kỳ (Ongoing Series).
  - 🟢 **Màu Xanh Lá**: Bộ truyện ngắn / Giới hạn (Limited Series).
  - 🔴 **Màu Đỏ**: Tập phát hành đơn lẻ (One-Shots / Annuals).
  - 🔵 **Màu Xanh Dương**: Hướng dẫn và ghi chú mạch truyện (Reading Notes).

### 3. 🎯 Trình Theo Dõi Tiến Độ Đọc Thông Minh (Reading Tracker)
- **Đánh dấu từng tập**: Tích chọn `[x] Đã đọc` trực tiếp bên cạnh từng issue.
- **Tự động đồng bộ**: Lưu trạng thái vào `localStorage` của trình duyệt, không lo mất tiến độ khi đóng tab.
- **Bảng điều khiển tiến độ**: Tự động hiển thị thanh tiến độ %, tổng số tập đã đọc / tổng số tập của từng sự kiện kèm tính năng *Đánh dấu tất cả* hoặc *Bỏ chọn toàn bộ*.

### 4. ⚡ Hiệu Năng Vượt Trội & Tương Thích Vercel
- Nền tảng Static Site kết hợp Clean URLs mang lại tốc độ phản hồi cực nhanh (<100ms).
- Hệ thống **Smart Aliases / Direct Slug Redirects**: Truy cập trực tiếp mọi đường dẫn ngắn như `/the-boys-reading-order/` hay `/house-of-m-reading-order/` mượt mà, không gặp lỗi 404.

---

## 🛠️ Công Nghệ Sử Dụng

- **Frontend Core**: HTML5 Semantic, CSS3 / Custom Variables, Vanilla JavaScript tối ưu hiệu năng cao.
- **Runtime & Tools**: Node.js, Express (phục vụ local test), Concurrently, TypeScript.
- **Build Engine**: Pipeline tự động (`scripts/build_site.js`) tự động tiêm modules tiện ích (`addon.css`, `addon.js`) và tạo bí danh redirect 609 reading orders.
- **Hosting**: Triển khai liên tục (CI/CD) tự động qua [Vercel](https://vercel.com).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

### Yêu Cầu Hệ Thống
- [Node.js](https://nodejs.org/) phiên bản 18.x trở lên.
- npm hoặc yarn/pnpm.

### Các Bước Khởi Chạy

1. **Clone repository về máy**:
   ```bash
   git clone https://github.com/mihchis/reading-orders-vn.git
   cd reading-orders-vn
   ```

2. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

3. **Chạy máy chủ phát triển (Development Server)**:
   ```bash
   npm start
   ```
   > Truy cập tại địa chỉ: **[http://localhost:3000](http://localhost:3000)**

4. **Biên dịch bản phân phối tĩnh (Build for Production)**:
   ```bash
   npm run build
   ```
   Toàn bộ website sẵn sàng xuất bản sẽ nằm gọn trong thư mục `dist/`.

---

## 📂 Cấu Trúc Thư Mục

```text
reading_orders/
├── site/                     # Thư mục mã nguồn giao diện & dữ liệu tĩnh
│   ├── marvel/               # 300+ Reading Orders Marvel (Events, Characters, Master)
│   ├── dc/                   # 250+ Reading Orders DC Comics (Events, Characters, Eras)
│   ├── other/                # 50+ Reading Orders truyện độc lập (The Boys, Invincible...)
│   ├── updates/              # Nhật ký cập nhật và bổ sung thứ tự đọc
│   ├── faq/                  # Trang giải đáp thắc mắc (FAQ)
│   ├── contact/              # Trang liên hệ ban quản trị
│   ├── assets/               # CSS tùy biến, JavaScript tiện ích bổ sung (addon.js, addon.css)
│   └── search_index.json     # Cơ sở dữ liệu tìm kiếm tĩnh
├── scripts/                  # Bộ công cụ build, trích xuất dữ liệu & việt hóa
│   ├── build_site.js         # Script build đóng gói thư mục site -> dist & tạo alias redirects
│   └── translate_updates.js  # Script xử lý bản địa hóa tự động
├── server/                   # Máy chủ Express phục vụ môi trường local
├── dist/                     # Thư mục đích đầu ra sau khi build (sẵn sàng deploy Vercel)
├── vercel.json               # Cấu hình routing & cleanUrls cho Vercel
└── README.md                 # Tài liệu hướng dẫn dự án
```

---

## 🤝 Đóng Góp & Báo Lỗi

Nếu bạn phát hiện sai sót trong thứ tự đọc truyện, link hỏng hoặc muốn yêu cầu bổ sung bộ truyện mới:
1. Gửi tin nhắn qua trang [Liên Hệ](https://reading-orders-vn-puce.vercel.app/contact/).
2. Hoặc tạo [Issue / Pull Request](https://github.com/mihchis/reading-orders-vn/issues) trên GitHub repository này.

---

## 📜 Bản Quyền & Lời Cảm Ơn

- Dữ liệu thứ tự đọc gốc thuộc quyền sở hữu của cộng đồng **Comic Book Reading Orders**.
- Hình ảnh và tên nhân vật thuộc bản quyền của **Marvel Comics**, **DC Comics**, **Image Comics**, **Dark Horse**, **Dynamite Entertainment** và các tác giả gốc.
- Dự án được thực hiện phi thương mại nhằm phục vụ cộng đồng đam mê truyện tranh tại Việt Nam.
