# Bàn giao cPanel MariaDB
- Chủ website tạo database/user trong cPanel, gắn quyền và điền DB_* riêng theo [CPANEL-MYSQL.md](CPANEL-MYSQL.md).
- Node 22 từ 22.20, production mode, startup server.js, application root ngoài public_html.
- Import SQL tạo bảng hoặc chạy db:migrate. Database mới không có sản phẩm mẫu.
- Cấu hình admin theo chế độ chủ chọn: hiện tại `ADMIN_MFA_REQUIRED=false` với USER/PASSWORD riêng; giữ khóa session/credential và health token, thông tin tài khoản trong password manager.
- Kiểm tra quality gates, preflight, build và Restart app.
- Thử đăng nhập, thêm/sửa/xóa sản phẩm, nháp/xuất bản, liên hệ, bảo hành, upload trên domain thật.
- Kiểm tra quyền ghi uploads, lưu qua deploy, nhận email, HTTPS và IP header của proxy.
- Sao lưu database/uploads, giữ khóa giải mã, thử restore vào database trống có tên khác.
- Gói source không gồm secrets, cấu hình cũ, runtime data hoặc build thử. Kiểm tra bằng handover:verify.
