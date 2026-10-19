# Triển khai và sở hữu
Dùng [hướng dẫn cPanel MariaDB](CPANEL-MYSQL.md). Chủ website giữ tài khoản cPanel/iNET, database, domain/DNS và email. Database/user phải gắn đúng quyền vào database riêng; runtime dùng DML, tạo schema chạy riêng. Secrets không đưa vào source ZIP.

Admin production dùng HttpOnly cookie, RBAC, giới hạn đăng nhập và phiên thu hồi. Theo lựa chọn của chủ, `ADMIN_MFA_REQUIRED=false` cho phép cấu hình `ADMIN_USER`/`ADMIN_PASSWORD` và đăng nhập bằng mật khẩu; mật khẩu tự đổi được lưu dạng scrypt trong DB. MFA tùy chọn chỉ chạy khi bật lại cấu hình. Tạo khóa session và token health riêng; giữ khóa mã hóa credential đang có cùng backup. IP header chỉ được tin khi proxy iNET xóa/ghi đè đúng.

Upload local cần thư mục bền vững có quyền ghi. Giữ uploads qua deploy và sao lưu cùng database. `db:backup` bỏ session/rate/replay; `db:restore` chỉ vào database trống, tên khác nguồn, ở development/staging. DDL MySQL commit riêng; khi lỗi phải kiểm tra đích trước khi dùng.

Quality gates và CI fixture kiểm tra code; preflight kiểm tra cấu hình. Chúng không chứng minh kết nối iNET, SMTP/email, độ bền storage hay khôi phục trên hosting. Chạy smoke test thật sau deploy. Các tài liệu kiểm chứng PostgreSQL cũ trong docs/admin-security là lịch sử, không xác minh hệ MySQL hiện tại.
