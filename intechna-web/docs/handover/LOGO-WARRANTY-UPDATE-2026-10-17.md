# Cập nhật logo, bảo hành và giao diện sáng — 17/10/2026

Gói cập nhật: `release/cpanel-logo-warranty-bright-2026-10-17.zip`.
Gói gồm bản build `.next`, ảnh `public/images/brand/intech-logo.png` và bốn file khởi động/hỗ trợ
`server.js`, `app.js`, `scripts/load-env.mjs`, `scripts/admin-config-diagnostics.mjs`.
Áp dụng cho ứng dụng hiện có tại `/home/qnvlpdarhosting/nextjs_app`, đang chạy
Next.js **16.3.8**. Không cần nâng thư viện, cài lại dependencies hoặc chạy migration.

Bản cập nhật thay chữ trên navbar bằng logo mới, chuyển khu vực giới thiệu thiết bị ở trang chủ
sang nền sáng, thêm sửa/xóa hồ sơ bảo hành và cho phép nhập ngày mua thực tế từ năm 2024.
Hạn bảo hành có thể tính theo 12/24/36 tháng từ ngày mua hoặc nhập ngày hết hạn riêng.

## Cập nhật trên cPanel

1. Vào **cPanel → Setup Node.js App → ứng dụng website → STOP APP**.
2. Mở **File Manager**, đến đúng thư mục:

   ```text
   /home/qnvlpdarhosting/nextjs_app
   ```

3. Đổi tên `.next` hiện tại thành tên sao lưu chưa tồn tại, ví dụ
   `.next-backup-20261017-1530`. Nếu đã có tên đó, chọn hậu tố khác. Giữ bản sao lưu cho đến khi
   kiểm tra xong. Sao lưu bốn file khởi động/hỗ trợ đang dùng trước khi ghi đè; có thể sao lưu
   riêng logo hiện tại nếu cần.
4. Upload `cpanel-logo-warranty-bright-2026-10-17.zip` rồi **Extract / Trích ra** ngay tại
   `nextjs_app`. Chọn thư mục đích là `/home/qnvlpdarhosting/nextjs_app`, không chọn bên trong
   `.next` và không tạo thêm thư mục lồng cùng tên ZIP.
5. Gộp thư mục `public` trong ZIP vào `public` hiện có và cho phép cập nhật file logo.
   Giữ nguyên các thư mục/file còn lại, đặc biệt `public/uploads` và ảnh đã tải lên.
   Không xóa hoặc thay toàn bộ `public` trước khi giải nén.
6. Kiểm tra cấu trúc sau giải nén:

   ```text
   nextjs_app/
     .next/
       BUILD_ID
     public/
       images/
         brand/
           intech-logo.png
   ```

   ZIP kèm bốn file khởi động/hỗ trợ để đồng bộ với bản build:
   `server.js`, `app.js`, `scripts/load-env.mjs`, `scripts/admin-config-diagnostics.mjs`.
   Cho phép ghi đè đúng các file này; giữ **Application startup file = `server.js`**.
7. Giữ nguyên `.env`, biến môi trường trên cPanel, khóa bí mật, tài khoản admin, database và
   dữ liệu uploads. Nếu user MySQL đang được cấp quyền theo từng thao tác, chủ hosting cần bảo
   đảm có thêm quyền **UPDATE** và **DELETE** trên bảng `warranty` để sửa/xóa bảo hành; giữ các
   quyền đọc/thêm hiện có. Bản cập nhật không thay cấu trúc bảng hoặc tự chuyển dữ liệu cũ.
8. Bấm **START APP** hoặc **RESTART**, mở website và nhấn **Ctrl + F5**.

## Kiểm tra sau cập nhật

- Mở trang chủ trên máy tính và điện thoại: logo mới hiển thị rõ trên navbar, bấm về trang chủ
  được và menu vẫn hoạt động. Khu vực giới thiệu thiết bị dùng nền sáng, chữ/nút đọc được.
- Đăng nhập admin với tài khoản có quyền quản lý bảo hành. Trong `/admin/bao-hanh`, thêm hồ sơ
  thử với ngày mua năm 2024: kiểm tra mã có năm mua, hạn 12/24/36 tháng tính từ ngày mua, có thể
  nhập ngày hết hạn riêng và lưu cả hồ sơ đã hết hạn.
- Mở **Sửa** hồ sơ thử, đổi thông tin rồi **Lưu thay đổi**; mã hồ sơ giữ nguyên. Kiểm tra cả
  **Hủy chỉnh sửa**. Với trạng thái tự động, gia hạn đến ngày tương lai phải cập nhật trạng
  thái theo ngày mới.
- Thử **Giữ lại** để kiểm tra hủy xóa, sau đó **Xóa → Xác nhận xóa** trên hồ sơ thử vừa tạo.

Chủ website hoặc quản trị viên được chủ cho phép thực hiện các thao tác trên ứng dụng thật.
Tài liệu và ZIP được chuẩn bị để bàn giao; chúng không xác nhận agent đã triển khai lên cPanel
hoặc đã sửa/xóa dữ liệu thật.

## Nếu gặp lỗi

- Không thấy logo: kiểm tra file `public/images/brand/intech-logo.png` đã được giải nén đúng
  đường dẫn, sau đó **Ctrl + F5**.
- Sửa/xóa báo lỗi quyền: kiểm tra quyền tài khoản admin và quyền UPDATE/DELETE của user MySQL;
  xem các dòng mới nhất trong `nextjs_app/stderr.log` nếu cần xác định lỗi máy chủ.
- Ứng dụng không khởi động: **STOP APP**, đổi tên `.next` mới thành tên riêng như
  `.next-failed-20261017-1530`, rồi đổi bản `.next-backup-…` trở lại `.next`. Khôi phục các
  file khởi động/hỗ trợ đã sao lưu nếu đã ghi đè; có thể khôi phục logo cũ riêng. Bấm
  **START APP / RESTART** và **Ctrl + F5**. Giữ nguyên env, database và uploads trong quá trình
  khôi phục. Việc khôi phục build không hoàn tác những hồ sơ đã được người quản trị sửa/xóa.
