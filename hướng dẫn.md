# Chạy website INTECH
Mở thư mục ứng dụng D:\intechna-web\intechna-web. Dự án đã chuyển sang MariaDB 10.6/MySQL trên cPanel iNET có Node.js 22 từ 22.20.

Xem [hướng dẫn MySQL/cPanel](intechna-web/CPANEL-MYSQL.md). Điền DB_NAME, DB_USER, DB_PASSWORD trong .env.local; laptop dùng 103.57.221.79, deploy cPanel dùng localhost. Tạo schema bằng npm run db:migrate, kiểm tra npm run db:check, thử npm run dev.

Không có sản phẩm mẫu được nạp; thêm sản phẩm tại /admin/san-pham và chọn Xuất bản. Cấu hình database cũ được giữ trong backups riêng, không dùng bởi website.
