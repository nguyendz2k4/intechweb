# Phạm vi kiểm tra an toàn sau chuyển MySQL
Code dùng MariaDB/MySQL với query có tham số, pool giới hạn, InnoDB transaction và khóa credential chung giữa đăng nhập/đổi mật khẩu. Production giữ MFA, RBAC, phiên thu hồi và rate limit dùng database; lỗi lưu trữ không mở quyền truy cập.

Test driver/transaction/cache và CI build dùng fixture tách biệt. Kết nối, quyền user, phiên bản MariaDB iNET, Passenger, uploads, email và restore thật phải kiểm tra sau khi chủ điền cấu hình. Các báo cáo PostgreSQL trong docs/admin-security là lịch sử.

Chủ website quản lý HTTPS, tài khoản cPanel/database, proxy IP header, thư mục uploads bền vững, khóa mã hóa và backup riêng. Xem [CPANEL-MYSQL.md](CPANEL-MYSQL.md) và [DEPLOYMENT-SECURITY.md](DEPLOYMENT-SECURITY.md).
