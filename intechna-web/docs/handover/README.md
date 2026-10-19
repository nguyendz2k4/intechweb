# Bàn giao website
Dự án đã chuyển sang MariaDB 10.6/MySQL và chạy Node.js trên cPanel. Hướng dẫn đầy đủ ở [CPANEL-MYSQL.md](../../CPANEL-MYSQL.md).

Database mới trống; chủ website tự thêm sản phẩm ở admin. Không nạp catalog mẫu. Cấu hình DB_* và các khóa admin riêng trên hosting, tạo schema bằng drizzle/0001_mysql.sql hoặc db:migrate, build rồi Restart server.js.

Gói source tạo bằng handover:package, kiểm tra bằng handover:verify; không chứa tài khoản/database cũ, secrets, runtime uploads hoặc build thử. Tài khoản và billing thuộc chủ website. Dùng db:backup để sao lưu dữ liệu thật và uploads; thử restore vào database development/staging trống có tên khác trước khi nghiệm thu.
