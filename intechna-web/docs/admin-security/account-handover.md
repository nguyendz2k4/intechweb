> Tài liệu lưu từ giai đoạn PostgreSQL, không phải hướng dẫn triển khai MySQL hiện tại. Xem [cPanel + MariaDB](../../CPANEL-MYSQL.md). Các kết quả database/restore cũ không chứng minh MariaDB iNET đã được kiểm tra.

# Tài khoản và MFA khi bàn giao

Chủ cấp tối đa20 username/role trong `ADMIN_ACCOUNTS_JSON` tại secret manager.
Roles admin/editor/support được server kiểm tra. Thêm người, đổi role hoặc bỏ
account phải do người giữ cấu hình hosting thực hiện; không đăng ký công khai.

## Account ban đầu

Chạy trong thư mục ứng dụng, thay username và HTTPS origin bằng thông tin thật:

```powershell
npm run admin:setup:owner -- --username owner --role admin --origin https://admin.example.com
```

Lệnh tạo `data/owner/account-owner.txt` riêng: password ngẫu nhiên, scrypt hash,
khóa/URI TOTP và cấu hình tham khảo. Không in credential và không ghi đè tệp.
Chủ thêm account JSON vào secret manager, đăng ký app TOTP và thử login.
Gói chưa tự cấp quyền vào web. Khi thêm người, ghép vào mảng account hiện tại,
giữ các khóa chung. Chuyển gói vào password manager chủ; không gửi cùng source
hay JSON nội dung, không đặt trong public/uploads.

Production cần DATABASE_URL runtime, ADMIN_SESSION_SECRET,
ADMIN_CREDENTIAL_ENCRYPTION_KEY riêng ≥32 bytes, HTTPS trusted origins và TOTP
cho mọi account. Chạy đầy đủ migration trước deploy bằng maintenance role.
Runtime dùng credential SELECT/INSERT/UPDATE, session CRUD; không credential
DELETE, CREATE schema, owner database hay sở hữu bảng. Với role chuẩn dùng
scripts/apply-runtime-auth-grants.mjs trong phiên maintenance riêng.

## Tự quản lý và phục hồi

`/admin/tai-khoan` cho xem MFA/số phiên, đổi password, setup/thay app TOTP và
thu hồi mọi phiên. Thao tác nhạy cảm yêu cầu password và MFA hiện tại nếu có.
Mã chỉ dùng một lần; chờ mã kế tiếp giữa thao tác. Khóa mới chỉ bật sau khi
xác nhận đúng mã trong10 phút. Đổi password/MFA đăng xuất mọi thiết bị;
logout thường chỉ thu hồi phiên đó, kể cả cookie sao chép.

DB chỉ lưu password hash và TOTP mã hóa AES-256-GCM gắn username. Role và
username vẫn do chủ cấp trong secret cấu hình. Không có reset qua email.
Khi mất thiết bị/password, người giữ quyền maintenance dùng env riêng chứa
MIGRATION_DATABASE_URL và danh sách account ban đầu:

```powershell
npm run admin:recover -- --username owner --confirm reset-to-owner-secret
```

Recovery xóa credential override và mọi phiên của đúng username đã cấu hình,
khôi phục password/TOTP **ban đầu trong secret manager**. Chủ cần giữ gói ban
đầu hoặc cập nhật credentials ban đầu qua hosting trước. Sau login phục hồi,
đổi password/MFA mới. Không đặt maintenance connection vào web process.

## Backup và vận hành

Backup Neon schema2 và PostgreSQL giữ password hash/credential MFA mã hóa;
không khôi phục session, pending MFA, rate hoặc replay. Với dump PostgreSQL
cũ, restore dọn các trạng thái này trong transaction trước khi báo thành công.
Giữ khóa mã hóa và account JSON ngoài archive trong secret manager: mất/thay
khóa sẽ không giải mã được MFA. Khi restore giữ đúng khóa, xoay session secret
và thử login trên môi trường phục hồi riêng. JSON CMS không chứa credential.

Restore chỉ nhận database rỗng development/staging, khác nguồn/runtime,
kể cả alias Neon pooled/direct. Manifest PostgreSQL mới version2 lưu hash
định danh nguồn; manifest version1 thiếu hash yêu cầu `BACKUP_DATABASE_URL`
riêng để đối chiếu nguồn, thiếu thông tin thì dừng. Không truyền URL vào lệnh.
Xem [quy trình backup/restore](backup-restore-runbook.md).

Backup/restore Neon đã chạy trên database QA riêng. Máy hiện thiếu binary
`pg_dump`/`pg_restore`/`psql`; phương án dump PostgreSQL mới chỉ kiểm thử guard,
tham số và SQL cleanup, chưa thực thi với công cụ PostgreSQL thật.

`npm run security:preflight` chỉ in tên cấu hình còn thiếu. `GET /api/health`
yêu cầu Authorization Bearer HEALTHCHECK_TOKEN ≥32 bytes, kiểm tra DB/schema
và chỉ trả status. Chủ cấu hình monitoring/người nhận alert trên dịch vụ thật.
Chạy security:cleanup theo lịch trong phiên maintenance để dọn state hết hạn.
