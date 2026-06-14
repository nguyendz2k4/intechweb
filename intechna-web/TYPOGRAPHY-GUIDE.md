# Hướng dẫn chỉnh font chữ, cỡ chữ và khoảng cách website Intechna

## 1. Vị trí code website

Thư mục chính:

```text
C:\Users\Admin_int\.openclaw\workspace\intechna-web
```

Các file quan trọng:

```text
app/globals.css              # Chỉnh giao diện chung: font, màu, nút, card, spacing, responsive
app/layout.tsx               # Header, menu, footer, SEO mặc định
app/page.tsx                 # Trang chủ
app/data.ts                  # Menu, nội dung sản phẩm/giải pháp/tin tức/tên công ty/số điện thoại
app/components.tsx           # Hero, CTA, FAQ, quy trình, breadcrumb
app/san-pham/page.tsx        # Trang sản phẩm
app/san-pham/catalog/...     # Catalog sản phẩm
app/lien-he/page.tsx         # Trang liên hệ
next.config.ts               # Security headers, cấu hình Next.js
proxy.ts                     # Bảo mật /admin và /api/admin
```

## 2. File cần chỉnh giao diện nhiều nhất

Mở file:

```text
app/globals.css
```

Hiện website đang dùng CSS dạng nén một dòng ở phần đầu, và các block bổ sung ở cuối file. Để chỉnh nhanh, ưu tiên sửa các block ở cuối file vì dễ tìm hơn.

## 3. Chỉnh font toàn website

Tìm đoạn:

```css
:root{--font-sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;--text-base:16px;--leading-base:1.65;--section-max:1180px}
body{font-family:var(--font-sans);font-size:var(--text-base);line-height:var(--leading-base)}
```

Ý nghĩa:

- `--font-sans`: font toàn website.
- `--text-base`: cỡ chữ mặc định.
- `--leading-base`: độ cao dòng, số càng lớn dòng càng thoáng.

Ví dụ muốn chữ toàn web to hơn:

```css
--text-base:17px;
```

Muốn chữ thoáng hơn:

```css
--leading-base:1.75;
```

## 4. Chỉnh tiêu đề H1, H2, H3

Tìm đoạn:

```css
h1{font-size:clamp(36px,5.2vw,68px);line-height:1.02;letter-spacing:-.045em}
h2{font-size:clamp(26px,2.8vw,42px);line-height:1.12;letter-spacing:-.03em}
h3{font-size:clamp(19px,1.5vw,23px);line-height:1.22;letter-spacing:-.015em}
```

Cách hiểu `clamp(min, co giãn, max)`:

```css
clamp(36px,5.2vw,68px)
```

- `36px`: nhỏ nhất, thường cho mobile.
- `5.2vw`: tự co giãn theo màn hình.
- `68px`: lớn nhất, thường cho desktop.

Nếu Ông chủ thấy tiêu đề trang chủ quá to, giảm số cuối:

```css
h1{font-size:clamp(34px,4.8vw,58px)}
```

Nếu muốn H2 nhỏ hơn:

```css
h2{font-size:clamp(24px,2.4vw,36px)}
```

## 5. Chỉnh chữ mô tả lớn dưới tiêu đề

Tìm:

```css
.lead{font-size:clamp(17px,1.45vw,20px);line-height:1.72}
```

Muốn nhỏ hơn:

```css
.lead{font-size:clamp(16px,1.3vw,18px);line-height:1.65}
```

## 6. Chỉnh chữ trong card

Tìm:

```css
.card h2{font-size:clamp(22px,2vw,30px)}
.card h3{font-size:21px}
.card p{font-size:15.5px}
```

Ví dụ muốn card gọn hơn:

```css
.card h2{font-size:clamp(20px,1.8vw,26px)}
.card h3{font-size:19px}
.card p{font-size:15px}
```

## 7. Chỉnh nút bấm

Tìm:

```css
.btn{font-size:15px;letter-spacing:-.01em}
```

Ở phần đầu file cũng có:

```css
.btn{min-height:46px;padding:0 20px;border-radius:999px;font-weight:900}
```

Muốn nút nhỏ hơn:

```css
.btn{min-height:42px;padding:0 16px;font-size:14px}
```

Muốn nút vuông hơn, giảm bo góc:

```css
.btn{border-radius:14px}
```

## 8. Chỉnh khoảng cách từng vùng/section

Tìm:

```css
.section{padding:clamp(56px,7vw,96px) clamp(20px,5vw,72px)}
```

Ý nghĩa:

- Số đầu: padding trên/dưới.
- Số sau: padding trái/phải.

Muốn các vùng ngắn lại:

```css
.section{padding:clamp(42px,5vw,72px) clamp(20px,5vw,72px)}
```

Chỉnh riêng mobile có đoạn:

```css
@media(max-width:920px){.section{padding:52px 20px}}
@media(max-width:560px){.section{padding-right:16px;padding-left:16px}}
```

## 9. Chỉnh vùng hero đầu trang

Tìm:

```css
.hero{padding:clamp(60px,8vw,118px) clamp(20px,5vw,72px)}
```

Muốn hero thấp hơn:

```css
.hero{padding:clamp(48px,6vw,86px) clamp(20px,5vw,72px)}
```

## 10. Chỉnh lưới card 3 cột / 1 cột

Tìm:

```css
.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
```

Muốn card cách nhau rộng hơn:

```css
.cards{gap:24px}
```

Mobile đang tự chuyển 1 cột:

```css
@media(max-width:920px){.cards{grid-template-columns:1fr}}
```

## 11. Chỉnh khung sản phẩm cuộn

Tìm:

```css
.product-scroll-panel{max-height:min(720px,72vh)}
.product-scroll-panel.compact{max-height:min(520px,62vh)}
```

Muốn khung sản phẩm thấp hơn:

```css
.product-scroll-panel{max-height:min(600px,65vh)}
.product-scroll-panel.compact{max-height:min(420px,55vh)}
```

Muốn cao hơn:

```css
.product-scroll-panel{max-height:min(820px,80vh)}
```

## 12. Chỉnh menu trên điện thoại

Mobile nav đang là dạng kéo ngang:

```css
@media(max-width:920px){.nav{width:100%;flex-wrap:nowrap;overflow-x:auto;gap:8px}.nav a{flex:0 0 auto;padding:8px 12px;border-radius:999px}}
```

Muốn nút menu nhỏ hơn:

```css
.nav a{font-size:12px;padding:7px 10px}
```

## 13. Quy trình tự chỉnh an toàn

Sau khi sửa CSS, chạy kiểm tra:

```powershell
cd C:\Users\Admin_int\.openclaw\workspace\intechna-web
npm run lint
npm run build
```

Nếu muốn xem web local:

```powershell
$env:ADMIN_USER='admin'
$env:ADMIN_PASSWORD='test-password-123456'
npm run start -- -p 3030
```

Mở:

```text
http://localhost:3030
http://192.168.50.11:3030
```

## 14. Gợi ý kích thước đẹp hiện tại

- H1 desktop: 58-68px là đẹp.
- H1 mobile: 34-42px là dễ đọc.
- H2 desktop: 34-42px.
- H2 mobile: 25-32px.
- Body: 16-17px.
- Card text: 15-16px.
- Button: 14-15px, cao 42-46px.
- Section padding desktop: 72-96px.
- Section padding mobile: 44-56px.

## 15. Nếu không chắc sửa chỗ nào

Ông chủ chỉ cần nói kiểu:

- “Tiêu đề trang chủ nhỏ lại 15%”
- “Chữ trong card to hơn”
- “Khoảng cách các vùng ngắn lại”
- “Mobile menu nhìn to quá”
- “Khung sản phẩm cao/thấp hơn”

Em sẽ chỉnh đúng phần CSS tương ứng.
