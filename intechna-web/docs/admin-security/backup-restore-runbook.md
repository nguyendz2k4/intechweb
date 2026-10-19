# Sao lưu MariaDB/MySQL
Chạy npm run db:backup trên môi trường có DB_* hoặc BACKUP_DATABASE_URL=mysql://...; sao lưu lưu trong thư mục riêng ngoài public, kèm checksum. Snapshot giữ 6 bảng dữ liệu/credential bền vững, bỏ session/rate-limit/replay và pending MFA. Giữ khóa mã hóa credential riêng cùng bản sao lưu.

Thử restore bằng npm run db:restore -- <thu-muc-backup> với RESTORE_DATABASE_URL=mysql://... và RESTORE_TARGET_ENV=staging vào database trống, có tên khác nguồn/runtime/backup. Mọi checksum được kiểm tra trước khi tạo bảng hoặc nhập. Chỉ dùng SQL schema từ repository; dữ liệu snapshot được bind qua placeholder. Tệp uploads được đưa vào thư mục review riêng.

DDL MySQL commit riêng, dữ liệu restore commit trong một transaction. Khi lỗi, giữ đích tách biệt và kiểm tra trước khi dùng. Chưa thực hiện restore trên hosting iNET vì cấu hình database chưa được cung cấp. Xem [hướng dẫn](../../CPANEL-MYSQL.md).
