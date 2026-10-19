# Cập nhật bảo hành, nhập file và giá sản phẩm ngày 18/10/2026

Bản cập nhật dành cho ứng dụng Next.js đang chạy trong thư mục `nextjs_app` trên cPanel. Gói chạy mới nhất: `cpanel-warranty-import-price-favicon-2026-10-18.zip`. Gói này bao gồm toàn bộ chức năng của bản trước, cộng với icon PNG/ICO và icon điện thoại dùng đúng logo vàng trên navbar.

Nếu đã cập nhật bản `cpanel-warranty-import-price-2026-10-18.zip` và hai cột dữ liệu đã có, bỏ qua bước SQL, chỉ sao lưu, thay bản chạy bằng ZIP mới và khởi động lại Node.

## Những thay đổi

- Mã mới theo mẫu `INT-C9B9CA2FE18A`, không có năm. Mã cũ dạng INTECH/INT có năm và 12 ký tự hex hiển thị dạng ngắn; vẫn tra cứu được bằng cả mã gốc lẫn mã ngắn. Khóa lưu trong dữ liệu cũ được giữ nguyên.
- Sản phẩm và Model có hai ô riêng trong thêm/sửa và hiển thị model khi tra cứu. Hồ sơ cũ chưa có model vẫn giữ nguyên nội dung; có thể mở Sửa để tách chính xác.
- Admin nhập Word `.docx` hoặc CSV UTF-8, tối đa 5 MB/500 linh kiện. File mẫu có 198 linh kiện thuộc 22 bộ máy. Mỗi linh kiện được tạo một phiếu; serial bộ máy nằm trong ghi chú nội bộ. Không dùng ngày của giấy chứng nhận làm ngày mua.
- Có xem trước, sửa từng dòng, kiểm tra dữ liệu, bỏ qua serial trùng và xác nhận nhập. Máy chủ kiểm tra lại trong giao dịch khi lưu; lỗi ghi sẽ hoàn tác cả đợt nhập.
- Mô tả ngắn tối đa 1.000 từ, có bộ đếm. Đường dẫn tự tạo khi gõ hoặc dán tên/thương hiệu, xử lý dấu tiếng Việt và ký hiệu thương mại. Đường dẫn sản phẩm đã có giữ nguyên khi sửa.
- Admin chọn hiển thị giá VND hoặc Liên hệ. Catalog và trang chi tiết hiển thị giá, có nút Liên hệ. Sản phẩm cũ chưa nhập giá hiển thị Liên hệ.
- Navbar và menu điện thoại nền xanh nhạt, favicon dùng logo vàng.

## Trước khi cập nhật

1. Tải ZIP lên thư mục `nextjs_app`, ngang hàng với `.next`, `public` và `server.js`. Chưa giải nén.
2. Xuất bản sao cơ sở dữ liệu bằng cPanel/phpMyAdmin (Export → SQL), hoặc dùng công cụ sao lưu hiện có trước khi thay tệp. Cất bản sao ngoài `public_html`/`public`.
3. Sao lưu thư mục ứng dụng hoặc ít nhất `.next`, các file `public/favicon*`, `public/apple-touch-icon.png`, các script bảo trì sắp thay và hai file khởi động `server.js`, `app.js`. Không xóa `.env`, `node_modules`, thư mục uploads hay dữ liệu khách hàng.
4. Thực hiện lúc ít người dùng. Nếu công cụ quản lý Node có Stop, dừng ứng dụng trước khi thay bản chạy.

## Cập nhật hai cột dữ liệu

Trong cPanel → phpMyAdmin → chọn đúng database mà website đang dùng → tab SQL, chạy **một lần** hai câu sau:

```sql
ALTER TABLE products ADD COLUMN price_vnd BIGINT UNSIGNED NULL;
ALTER TABLE warranty ADD COLUMN model TEXT NULL;
```

Các câu lệnh chỉ thêm cột cho giá và model, không xóa bản ghi hay đổi mã cũ. Sau khi chạy, kiểm tra tab Structure: `products` có `price_vnd`; `warranty` có `model`.

Nếu báo `#1060 Duplicate column name`, cột đó đã có: không chạy lại câu đã thành công; kiểm tra và chạy riêng câu của cột còn thiếu. Nếu không có quyền ALTER, dùng tài khoản quản trị database hoặc nhờ iNET chạy đúng hai câu này. Chỉ thay bản chạy mới khi cả hai cột đã có.

Nếu dùng Terminal, sau khi giải nén tệp bảo trì có thể chạy `node scripts/db-migrate.mjs` trong `nextjs_app`. Script dùng cấu hình kết nối hiện có và có thể chạy lại; kiểm tra dòng `migration.completed` trước khi khởi động app mới. Đừng dùng đồng thời cả hai cách nếu không cần.

## Thay bản chạy và khởi động lại

1. Trong File Manager, bật hiển thị tệp ẩn. Đổi `.next` cũ thành `.next-backup-20261018` (chọn tên khác nếu đã có).
2. Giải nén `cpanel-warranty-import-price-favicon-2026-10-18.zip` **ngay tại `nextjs_app`**, không giải nén vào trong `.next`. Cho phép ghi đè các tệp cập nhật trong ZIP. Thư mục `public` được gộp với thư mục đang có; không xóa `public` cũ.
3. Kiểm tra có `nextjs_app/.next/BUILD_ID`, `public/favicon.svg`, `public/favicon-48.png`, `public/favicon.ico`, `public/apple-touch-icon.png`, `public/templates/bao-hanh.csv`, `drizzle/0002_product_price_warranty_model.sql`. Không được lồng thành `.next/.next` hoặc `nextjs_app/nextjs_app`.
4. Giữ Node 22 và startup file `server.js` đang dùng. Đây là bản đã build production cho `https://intechna.vn`; không chạy build lại trên hosting. Các thư viện đọc Word đã nằm trong JavaScript của gói chạy; không cần cài lại dependencies cho lần cập nhật runtime này.
5. Khởi động lại bằng công cụ hiện có: `Setup Node.js App` → ứng dụng → **Restart** (hoặc **Start** nếu đã Stop). Nếu hosting dùng Passenger/Application Manager và không có nút Restart, vào thư mục `nextjs_app/tmp`, tạo hoặc chỉnh sửa/lưu tệp `restart.txt` để đổi thời gian sửa; Passenger sẽ nạp lại ứng dụng ở lần truy cập tiếp theo. Không chỉnh `server.js` để restart.
6. Đóng tab cũ, mở lại website rồi Ctrl+F5 hoặc thử cửa sổ riêng tư. Favicon có đường dẫn `?v=intech-gold-3` để hạn chế cache cũ. Có thể kiểm tra trực tiếp `/favicon-48.png?v=intech-gold-3` và `/favicon.ico?v=intech-gold-3`: cả hai phải là logo vàng trên nền xanh nhạt. Nếu ảnh đã mới nhưng tab còn cũ, đóng/mở lại trình duyệt. Biểu tượng đã lưu trên màn hình chính điện thoại có thể cần xóa lối tắt rồi thêm lại.

## Kiểm tra sau cập nhật

- Đăng nhập admin → Bảo hành: Sản phẩm và Model là hai ô, mã hiển thị không có năm.
- Chọn Nhập file → chọn Word → kiểm tra số dòng → nhập khách hàng và ngày mua thực tế → chọn thời hạn → Kiểm tra dữ liệu. Đảm bảo các thông tin đúng rồi mới Xác nhận nhập. Đây là lúc tạo dữ liệu thật. Không nhập mẫu chỉ để thử trên production nếu chưa có ngày mua/thời hạn xác nhận.
- Với file Word đã gửi, dự kiến 198 linh kiện. Dữ liệu trùng serial sẽ được báo và bỏ qua; nội dung đã có không bị ghi đè. Mỗi ngày mua riêng trong CSV được tính hạn theo thời hạn chọn nếu ô hạn còn trống.
- Trong Thêm/Sửa sản phẩm, dán tên và thương hiệu; chọn danh mục, Hiển thị giá bán và nhập số VND (ví dụ `2500000`). Lưu rồi mở trang sản phẩm để đối chiếu. Chọn Liên hệ sẽ bỏ giá công khai.
- Tra cứu một mã cũ/mã ngắn và serial đang có. Mở menu trên điện thoại để kiểm tra navbar.
- Nếu trang sản phẩm/bảo hành báo lỗi ngay sau cập nhật, kiểm tra trước tiên hai cột mới và log Node. Không chạy import lại khi chưa biết kết quả; kiểm tra danh sách/serial trước.

## Khôi phục bản chạy

Dừng ứng dụng nếu có nút Stop. Đổi `.next` mới sang tên lưu riêng, trả `.next-backup-20261018` về `.next`, khôi phục các tệp khởi động/bảo trì đã sao lưu, rồi restart. Hai cột nullable có thể giữ lại vì bản cũ bỏ qua chúng. Không DROP bảng/cột hoặc phục hồi SQL lên dữ liệu mới phát sinh. Việc quay lại ứng dụng cũ không tự xóa các phiếu đã nhập thành công.

## Ghi chú kỹ thuật

Trang catalog lấy dữ liệu khi truy cập và vẫn dùng cache có tag được xóa ngay khi admin cập nhật; dữ liệu giá không bị cố định vào thời điểm build. Gói này không chứa database, `.env`, tài khoản, file Word của khách hàng hay thư mục uploads. Cập nhật cấu trúc và dữ liệu production chưa được thực hiện tự động.
