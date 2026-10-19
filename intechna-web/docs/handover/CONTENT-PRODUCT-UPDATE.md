# Cập nhật nội dung và sản phẩm trên cPanel — 16/10/2026

Gói cập nhật: `release/cpanel-content-product-fixes-2026-10-16.zip`.
Gói gồm bản build `.next` và bốn file khởi động/hỗ trợ: `server.js`, `app.js`,
`scripts/load-env.mjs`, `scripts/admin-config-diagnostics.mjs`.

## Các thay đổi

- Trang Tin tức chia từng bài thành thẻ chỉ có tiêu đề; bấm thẻ để xem nội dung chi tiết.
- Nội dung xuất bản từ admin Dịch vụ & giải pháp xuất hiện trên trang Giải pháp và có trang chi tiết.
  Bản nháp được ẩn; các giải pháp có sẵn vẫn được giữ lại.
- Sản phẩm được chọn một trong sáu danh mục: Switch; WiFi Access Point; Router; Firewall;
  Module quang và phụ kiện hạ tầng; NAS-server và lưu trữ dữ liệu.
- Chỉ tên hãng được chuẩn hóa thành chữ in hoa khi lưu, ví dụ `cisco` thành `CISCO`.
  Tên/model sản phẩm, mô tả và nội dung khác giữ nguyên cách viết.
- Ảnh sản phẩm có xem trước và trạng thái tải lên để biết ảnh đã được chọn/lưu hay chưa.

## Cách cập nhật

1. Vào **cPanel → Setup Node.js App → ứng dụng website → STOP APP**.
2. Mở **File Manager**, đến thư mục ứng dụng:

   ```text
   /home/qnvlpdarhosting/nextjs_app
   ```

3. Đổi tên `.next` hiện tại thành một tên sao lưu chưa tồn tại, chẳng hạn
   `.next-backup-20261016-1530`. Nếu tên đã có, chọn hậu tố khác; giữ lại để có thể phục hồi.
4. Upload ZIP rồi **Trích ra / Extract** ngay trong `nextjs_app` ở bước 2.
   Không giải nén vào bên trong `.next`. Cho phép ghi đè bốn file khởi động/hỗ trợ trong gói.
5. Kiểm tra sau giải nén có cấu trúc sau:

   ```text
   nextjs_app/
     .next/
       BUILD_ID
     server.js
     app.js
     scripts/
       load-env.mjs
       admin-config-diagnostics.mjs
   ```

6. Trong **Setup Node.js App → Environment variables**, đặt:

   | Tên biến | Giá trị |
   | --- | --- |
   | `UPLOAD_STORAGE` | `local` |
   | `UPLOAD_LOCAL_PERSISTENT` | `true` |
   | `UPLOADS_ENABLED` | `true` |

   Bấm **DONE** cho từng biến, rồi **SAVE**. Giữ **Application startup file = `server.js`**.
7. Bấm **START APP** hoặc **RESTART**, mở website và nhấn **Ctrl + F5**.

Giữ nguyên `public`, `public/uploads`, các file ảnh đã tải lên, biến môi trường còn lại và database.
Cách đăng nhập, tài khoản và mật khẩu admin không thay đổi trong bản cập nhật này.
Không cần cài thêm thư viện hoặc chạy migration. Thư viện Next.js trên hosting cần đúng phiên bản
**16.3.8**, tương ứng với bản build; không nâng phiên bản khi cài gói này.

## Kiểm tra sau cập nhật

1. Mở `/tin-tuc`: mỗi bài chỉ hiển thị tiêu đề trên thẻ; bấm vào đọc được trang chi tiết.
2. Trong admin, xuất bản nội dung Dịch vụ & giải pháp, rồi kiểm tra thẻ và trang chi tiết trên
   `/giai-phap`. Nội dung để Bản nháp không xuất hiện trên website.
3. Thêm/sửa sản phẩm: chọn đúng một trong sáu danh mục, nhập thương hiệu, chọn ảnh và đợi thông báo
   tải lên thành công trước khi lưu. Mở lại sản phẩm để kiểm tra danh mục, thương hiệu và ảnh.

Sản phẩm cũ đã lưu sai vào Switch cần mở Chỉnh sửa, chọn lại danh mục rồi Lưu sản phẩm.
Hệ thống không tự đoán danh mục của dữ liệu đã có.

Tài liệu này hướng dẫn cập nhật; việc có ZIP trên laptop không có nghĩa ứng dụng trên hosting đã
được triển khai hoặc kiểm tra thành công. Nếu khởi động lỗi, xem những dòng mới nhất trong
`nextjs_app/stderr.log` để xác định nguyên nhân trước khi thay thêm file.
