# Kế hoạch hoàn thiện website Intech trong 2 ngày

## Mục tiêu
Hoàn thiện website giới thiệu Công ty Cổ phần Đầu tư và Phát triển Intech theo hướng:
- Giao diện chuyên nghiệp: Gold / Champagne Gold / trắng / xám / đen.
- Nội dung rõ năng lực: mạng LAN/WAN, thiết bị mạng, firewall, WiFi, server, camera, bảo trì, tư vấn.
- Chuẩn SEO cơ bản đến nâng cao: cấu trúc heading, meta, sitemap, robots, schema, tốc độ, responsive, nội dung theo từ khóa.
- Sẵn sàng deploy demo/public.

## Định hướng SEO chính

### Từ khóa chính
- thi công mạng LAN WAN Nghệ An
- thiết bị mạng Nghệ An
- lắp đặt firewall doanh nghiệp
- thi công hệ thống wifi doanh nghiệp
- bảo trì hệ thống mạng doanh nghiệp
- tư vấn thiết kế hạ tầng CNTT

### Từ khóa phụ
- switch router firewall wifi server camera
- triển khai mạng văn phòng
- dịch vụ IT doanh nghiệp Nghệ An
- công ty hạ tầng mạng Nghệ An

### Cấu trúc trang cần có
- `/` Trang chủ
- `/gioi-thieu` Giới thiệu công ty
- `/san-pham` Sản phẩm
- `/dich-vu` Dịch vụ
- `/du-an` Dự án
- `/tin-tuc` Tin tức / bài viết
- `/lien-he` Liên hệ

> Ghi chú kỹ thuật: bản hiện tại đang là Vite React SPA. Để SEO chuẩn hơn, nên nâng cấp sang Next.js hoặc ít nhất tạo prerender/static HTML tốt hơn. Nếu cần SEO nghiêm túc để Google index tốt, khuyến nghị chuyển sang Next.js trong ngày 1.

---

# Ngày 1: Xây nền chuẩn SEO + hoàn thiện giao diện chính

## 08:00 - 08:30: Chốt phạm vi & cấu trúc
- Rà lại yêu cầu công ty, lĩnh vực, thông tin liên hệ.
- Chốt sitemap chính.
- Chốt tone nội dung: uy tín, kỹ thuật, thực chiến, hướng B2B.
- Chốt CTA chính: gọi điện, gửi form, yêu cầu tư vấn.

## 08:30 - 09:30: Nâng cấp nền kỹ thuật
- Khuyến nghị chuyển từ Vite SPA sang Next.js + TypeScript để SEO tốt hơn.
- Thiết lập cấu trúc thư mục:
  - `app/`
  - `components/`
  - `data/`
  - `public/`
- Cấu hình ESLint/TypeScript.
- Kiểm tra build sạch.

## 09:30 - 10:30: Thiết kế UI system
- Tạo bộ màu:
  - Gold: `#D4AF37`
  - Champagne: `#F5DE9A`
  - Dark: `#161616`
  - Light gray: `#F6F3EC`
- Tạo typography, button, card, section layout.
- Tạo responsive layout cho mobile/tablet/desktop.

## 10:30 - 12:00: Trang chủ
- Hero section: thông điệp chính + CTA.
- Section năng lực công ty.
- Section sản phẩm nổi bật.
- Section dịch vụ chính.
- Section dự án tiêu biểu.
- Section liên hệ nhanh.
- SEO heading chuẩn: mỗi trang chỉ 1 H1, H2/H3 phân cấp đúng.

## 12:00 - 13:30: Nghỉ / rà nội dung nhẹ
- Rà lỗi chính tả.
- Bổ sung thuật ngữ ngành: LAN/WAN, VLAN, firewall, VPN, WiFi roaming, server, camera IP.

## 13:30 - 15:00: Trang Giới thiệu + Dịch vụ
- `/gioi-thieu`: năng lực, quy trình, cam kết.
- `/dich-vu`: thi công, bảo trì, tư vấn, triển khai firewall/WiFi.
- Viết nội dung theo từ khóa dịch vụ.
- Thêm CTA cuối trang.

## 15:00 - 16:00: Trang Sản phẩm
- Nhóm sản phẩm:
  - Switch
  - Router
  - Firewall
  - WiFi/AP/Controller
  - Server/Lưu trữ
  - Camera/IP CCTV
- Mỗi nhóm có mô tả ngắn + lợi ích + khách hàng phù hợp.

## 16:00 - 17:00: Trang Dự án
- Tạo layout case study.
- Mẫu nội dung dự án:
  - Bối cảnh
  - Giải pháp
  - Thiết bị dùng
  - Kết quả
- Nếu chưa có dự án thật, dùng mô tả nhóm dự án, tránh bịa tên khách hàng.

## 17:00 - 18:00: SEO kỹ thuật vòng 1
- Thêm title/meta description riêng từng trang.
- Thêm Open Graph cho chia sẻ Zalo/Facebook.
- Thêm canonical URL.
- Thêm favicon/logo placeholder.
- Tạo `robots.txt`.
- Tạo `sitemap.xml`.

## 20:00 - 21:00: Form liên hệ + bản đồ
- Form: họ tên, SĐT, email, nhu cầu.
- Nút gọi nhanh `tel:0395337755`.
- Nút email `mailto:info@intechna.vn`.
- Nhúng Google Map theo địa chỉ công ty.

## 21:00 - 22:00: Build + kiểm tra ngày 1
- Chạy `npm run build`.
- Kiểm tra responsive bằng browser.
- Chạy Lighthouse lần 1.
- Ghi danh sách lỗi cần xử lý ngày 2.

Deliverable cuối ngày 1:
- Web có đủ trang chính.
- Giao diện ổn trên desktop/mobile.
- Có meta SEO cơ bản, sitemap, robots.
- Build thành công.

---

# Ngày 2: Tối ưu SEO, nội dung, tốc độ, deploy

## 08:00 - 09:00: Rà lại toàn bộ nội dung
- Sửa câu chữ cho chuyên nghiệp.
- Tăng độ tin cậy bằng các khối:
  - Quy trình làm việc
  - Cam kết kỹ thuật
  - Lợi ích cho khách hàng
  - Vì sao chọn Intech
- Không dùng nội dung chung chung quá nhiều.

## 09:00 - 10:30: Viết bài SEO nền tảng
Tạo 3 bài tin tức đầu tiên:
1. Checklist triển khai mạng LAN cho văn phòng doanh nghiệp.
2. Khi nào doanh nghiệp nên dùng firewall chuyên dụng?
3. WiFi doanh nghiệp khác gì WiFi gia đình?

Mỗi bài cần:
- Title rõ từ khóa.
- Slug tiếng Việt không dấu.
- Meta description 140-160 ký tự.
- H1/H2/H3 rõ.
- CTA cuối bài.

## 10:30 - 11:30: Schema SEO
Thêm JSON-LD:
- `Organization`
- `LocalBusiness`
- `ProfessionalService`
- `ContactPoint`
- `BreadcrumbList`
- `Article` cho bài viết

Thông tin dùng:
- Name: Công ty Cổ phần Đầu tư và Phát triển Intech
- Phone: 0395337755
- Email: info@intechna.vn
- Address: Số 31, ngõ 20, đường Nguyễn Đức Cảnh, phường Thành Vinh, tỉnh Nghệ An

## 11:30 - 12:00: Tối ưu ảnh & asset
- Dùng ảnh WebP/SVG nếu có.
- Thêm `alt` cho toàn bộ ảnh.
- Lazy load ảnh dưới màn hình đầu.
- Giảm JS/CSS thừa.

## 13:30 - 14:30: Tối ưu tốc độ
- Kiểm tra bundle size.
- Tối ưu font.
- Kiểm tra Core Web Vitals:
  - LCP
  - CLS
  - INP
- Mục tiêu Lighthouse:
  - Performance: >= 90
  - Accessibility: >= 90
  - Best Practices: >= 90
  - SEO: >= 95

## 14:30 - 15:30: Responsive & UX
- Test mobile 360px, 390px, 430px.
- Test tablet 768px.
- Test desktop 1366px/1920px.
- Kiểm tra menu, CTA, form, khoảng cách, font size.

## 15:30 - 16:30: Tối ưu chuyển đổi bán hàng
- CTA cố định hoặc nổi nhẹ trên mobile: Gọi ngay.
- Section “Nhận tư vấn khảo sát”.
- Thêm trust block:
  - Khảo sát nhanh
  - Giải pháp đúng nhu cầu
  - Thi công gọn
  - Hỗ trợ sau bàn giao

## 16:30 - 17:30: Kiểm tra SEO lần cuối
- Check title/meta từng trang.
- Check sitemap/robots.
- Check heading structure.
- Check internal links.
- Check broken links.
- Check schema bằng Rich Results test nếu có mạng.

## 20:00 - 21:00: Deploy demo
- Deploy lên Vercel hoặc hosting chỉ định.
- Cấu hình domain sau nếu Ông chủ có domain.
- Kiểm tra HTTPS.
- Kiểm tra link public.

## 21:00 - 22:00: Báo cáo bàn giao
- Gửi link demo.
- Gửi checklist đã hoàn thành.
- Gửi danh sách nội dung cần Ông chủ bổ sung:
  - Logo chính thức
  - Ảnh công ty/đội ngũ
  - Dự án thật
  - Danh sách hãng/thiết bị phân phối
  - Google Maps chính xác
  - Zalo OA/Facebook nếu có

Deliverable cuối ngày 2:
- Web hoàn chỉnh mức MVP chuyên nghiệp.
- Chuẩn SEO on-page + technical SEO cơ bản.
- Có bài viết SEO nền tảng.
- Build/deploy chạy được.
- Có báo cáo Lighthouse.

---

# Ưu tiên thực hiện

## Bắt buộc
1. Chuyển/nâng nền SEO tốt.
2. Hoàn thiện đủ trang.
3. Meta title/description từng trang.
4. Sitemap + robots.
5. Schema LocalBusiness/Organization.
6. Responsive tốt.
7. Lighthouse SEO >= 95.

## Nên có
1. 3 bài viết SEO đầu tiên.
2. Form liên hệ thật.
3. CTA gọi nhanh trên mobile.
4. Bản đồ Google Maps.
5. Case study dự án.

## Có thể làm sau
1. Trang chi tiết từng sản phẩm.
2. Bộ lọc sản phẩm.
3. CMS quản trị bài viết.
4. Tích hợp Zalo/Facebook chat.
5. Tracking Google Analytics/Search Console.
