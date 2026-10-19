# Chuyển nội dung MySQL
Content JSON gồm products/posts/services với slug ổn định; không gồm contacts, warranty, credential hay layout. Schema/version và toàn bộ nội dung được kiểm tra trước khi bắt đầu transaction. Nhập là upsert theo slug, không xóa bản ghi ngoài file.

Dùng content:export/import/validate với cấu hình DB_* hoặc DATABASE_URL=mysql://... riêng của nguồn/đích. Export read-only ở REPEATABLE READ; import commit/rollback toàn bộ nội dung. Sau nhập, rebuild hoặc làm mới cache public để kiểm tra. data/content.example.json có products=[]; không có lệnh nạp sản phẩm mẫu.

Các URL uploads cần chuyển cả tệp hoặc đổi URL; không dùng content JSON thay cho db:backup. Xem [hướng dẫn cPanel](../../CPANEL-MYSQL.md).
