> Tài liệu lưu từ giai đoạn PostgreSQL, không phải hướng dẫn triển khai MySQL hiện tại. Xem [cPanel + MariaDB](../../CPANEL-MYSQL.md). Các kết quả database/restore cũ không chứng minh MariaDB iNET đã được kiểm tra.

# Admin CMS và bảo mật — 13/10/2026

## Phạm vi đã thống nhất

Giữ nguyên template sản phẩm đang dùng: ảnh, tên/model, hãng/danh mục, nhãn,
mô tả ngắn, thông số, ứng dụng và datasheet. Admin chỉ sửa dữ liệu của template.
Không có chọn bố cục, kéo chữ/ảnh, section builder, khung khuyến mãi hoặc bộ lọc
thẻ mới trên trang khách hàng. CSS public và markup chi tiết sản phẩm không sửa
trong lượt này. Bài viết tiếp tục dùng `description` và `body` văn bản, với
heading/danh sách được renderer hiện có hiển thị an toàn.

Admin dùng màu trắng/xám `#f5f5f7`, chữ `#1d1d1f`, hành động `#0066cc` và font
system giống public. Danh sách và trình biên tập tách riêng; màn hình biên tập
70/30 thu về một cột trên màn hình nhỏ. Có tìm kiếm, lọc trạng thái, phân trang,
loading/error/retry, xác nhận xóa và phản hồi khi lưu.

## Điều chỉnh kế hoạch gốc

| Hạng mục gốc | Quyết định triển khai |
| --- | --- |
| CMS danh sách và editor 70/30 | Giữ, đồng bộ ngôn ngữ thiết kế public |
| Chọn bố cục từng đoạn | Bỏ vì xung đột yêu cầu giữ giao diện sản phẩm |
| `sections`, `layout`, `visible` | Không thêm vào DB vì public hiện không dùng |
| `promotion`, `focusKeyword`, `seoTitle`, `seoDescription` | Không thêm trường chưa được public dùng; SEO preview suy ra từ nội dung hiện có |
| Bảng tags, màu/scope và tag arrays mới | Không thêm; giữ `badges` sản phẩm hiện có |
| Trạng thái `featured` trộn vào trạng thái xuất bản | Bỏ; chỉ `published`/`draft` với CHECK constraint |
| `ensureAdminSchema()` sửa DB trong request | Bỏ; migration chạy riêng bằng schema owner |
| Hộp thư liên hệ | Thêm đọc/lọc/đổi trạng thái/xóa theo quyền, không gửi phản hồi email tự động |
| Bản lưu reply ghi đè trong contact | Không thêm khi chưa triển khai trả lời và lịch sử email |
| Thay đổi form khách hàng/catalog | Không đổi giao diện trong lượt này |

## Cấu trúc dữ liệu

`products` giữ các trường hiện có, thêm `status`. `posts` giữ title, slug,
description, body, publishedAt và thêm `status`. Dữ liệu cũ mặc định `published`;
nội dung mới mặc định nháp trong admin/API. `contact_submissions` dùng các
trường đã có, chuẩn hóa trạng thái `mới` / `đang xử lý` / `đã xử lý`.

`security_rate_limits` và `security_totp_replays` là trạng thái bảo mật có hạn
sử dụng, không chứa password/token/khóa MFA thô. Cả hai được khai báo trong
Drizzle để công cụ đồng bộ schema không coi chúng là bảng dư. Username/role
vẫn do chủ cấp qua secret cấu hình. Bổ sung `security_admin_credentials` cho
password hash/khóa TOTP mã hóa AES-256-GCM và `security_admin_sessions` cho
hash token/expiry/revision. Đổi password/MFA được lưu bền vững; không mở đăng
ký admin công khai.

Migration: 0001 CMS/security, 0002 credentials/sessions và 0003 service content,
chạy theo thứ tự bằng `npm run db:migrate:admin`.
Migration thêm cột/bảng/constraint và không xóa sản phẩm mẫu. Đã chạy trên
database **thử nghiệm do người dùng xác nhận**. Chạy lại idempotent khi schema
đúng; dữ liệu trạng thái trái constraint sẽ làm toàn bộ transaction thất bại.

Nội dung bàn giao độc lập với repo nằm ở `data/owner/content.json` (Git bỏ qua).
Mẫu cấu trúc: [`content.example.json`](../../data/content.example.json).
Đọc [cách xuất/nhập và bàn giao cho chủ website](data-handover.md).

## Sáu nhóm kiểm tra

| Nhóm | Đã làm và bằng chứng | Phần còn cần ở production |
| --- | --- | --- |
| 1. AI, authentication, authorization | Repo chưa có SDK/endpoint AI. Phiên admin ký HMAC, mặc định hết hạn 1 giờ; cookie HttpOnly/SameSite Strict/Secure trên production. MFA TOTP bắt buộc với mọi account production; replay chặn bằng DB. Roles admin/editor/support, kiểm tra permission ở từng API và trang tải dữ liệu. | Chủ tự quản lý MFA/recovery cho Neon, hosting, Git, DNS/email; secret account production chưa được cấp. |
| 2. API | Chỉ public: contact POST, warranty GET với dữ liệu giảm lộ, auth login POST, ảnh/PDF public. Admin APIs tự kiểm tra auth/quyền, same-origin mutation, rate DB atomic, validation trường/kiểu/độ dài/body/upload bytes. | Cấu hình trusted ingress IP header/WAF và quan sát tải; chưa đo tải production. |
| 3. Secrets | Scan file Git đang theo dõi không thấy mẫu credential. `.env` và file maintenance bị Git bỏ qua; không xuất secrets vào content/backup manifest/log. Session secret local đã tạo; password production dùng scrypt hash. | Scan toàn bộ Git history và secret manager/provider chưa kiểm chứng; chuyển giá trị sang secret storage chủ sở hữu khi deploy. |
| 4. Data/cloud | Đã kiểm tra trực tiếp role runtime: không sở hữu bảng, không create DB/role/schema, không superuser hoặc RLS bypass; chỉ DML trên bảng ứng dụng. Contacts/warranty đầy đủ chỉ admin/support. Mã bảo hành mới ngẫu nhiên, mã cũ vẫn tra cứu được. | Endpoint Neon kết nối qua internet bằng credentials; IP allowlist/private network, IAM, mã hóa/retention provider chưa kiểm chứng. Chưa có production DB riêng được cấu hình ở repo. |
| 5. Backup/incident | Có rollback schema tương thích code cũ, backup/restore PostgreSQL và phương án logical qua Neon, checksum, restore vào DB rỗng tách biệt; có killswitch, audit events. | Chủ phải chốt người nhận alert, lịch backup và lưu bản mã hóa ngoài máy; chưa tích hợp hệ thống uptime/on-call. |
| 6. Tổng hợp | Kết quả test, HTTP smoke, quyền DB, backup/restore và hạn chế được ghi trong [verification.md](verification.md). | Chỉ đánh dấu production đạt sau khi chạy lại checks với cấu hình và hạ tầng thực tế. |

AI trong phiên làm việc này có thể đọc/sửa mã trong workspace và dùng thông
tin kết nối local để kiểm tra DB thử nghiệm theo ủy quyền. File maintenance
vẫn có quyền quản lý schema cho công việc bảo trì. Quyền này không phải
quyền của visitor hay tài khoản chạy web; khi bàn giao, chủ phải thu hồi
quyền của người làm thuê/AI trên Git, hosting và Neon, đồng thời xoay secrets.

Next.js yêu cầu authorization ở nơi xử lý dữ liệu, vì proxy chỉ là lớp chặn
ban đầu: [Authentication](https://nextjs.org/docs/app/guides/authentication).

## Cấu hình chạy và quyền

Local: `.env` đã dùng role runtime, có session secret và origin localhost.
Mật khẩu local cũ không đạt kiểm tra tối thiểu đã được thay bằng mật khẩu ngẫu
nhiên; thông tin nằm trong `data/owner/admin-local-access.txt`, bị Git bỏ qua.
`ADMIN_USER`/`ADMIN_PASSWORD` chỉ được nhận trên development. Production cần
`ADMIN_ACCOUNTS_JSON`, `ADMIN_SESSION_SECRET`, origins HTTPS và DB migration.
Khóa `ADMIN_CREDENTIAL_ENCRYPTION_KEY` riêng giữ trong secret manager cho DB MFA.
Thiếu cấu hình sẽ đóng admin với 503; không có mật khẩu mặc định production.

```json
[{"username":"owner","passwordHash":"<scrypt hash>","role":"admin","totpSecret":"<base32 secret>"}]
```

Tạo gói password/hash/TOTP riêng bằng `npm run admin:setup:owner` theo hướng
dẫn bàn giao; hoặc dùng hash-admin-password.mjs khi đã có password. Chủ đưa
TOTP vào app authenticator và kiểm tra login. Không có khóa mẫu production
trong source; password và MFA thuộc secret storage của chủ.

| Role | Quyền |
| --- | --- |
| admin | Sản phẩm, bài viết, dịch vụ, bảo hành, liên hệ, upload |
| editor | Sản phẩm, bài viết, dịch vụ, upload; không đọc liên hệ/bảo hành |
| support | Liên hệ và bảo hành; không sửa nội dung/upload |

Đăng xuất xóa cookie và phiên server; cookie đã sao chép bị từ chối ngay.
`/admin/tai-khoan` cho đổi mật khẩu, thiết lập MFA và thu hồi mọi phiên của
chính người đăng nhập. Thao tác nhạy cảm yêu cầu password/MFA hiện tại. MFA
mới chỉ bật sau khi mã được xác nhận; setup hết hạn sau 10 phút. Đổi password
hoặc MFA thu hồi mọi phiên và yêu cầu đăng nhập lại. Production cần DB và
`ADMIN_CREDENTIAL_ENCRYPTION_KEY` riêng ≥32 bytes, không dùng memory.
Killswitch `ADMIN_ENABLED=false` chặn ngay mọi phiên hiện có.

Tạo tài khoản ban đầu và recovery theo [hướng dẫn chủ](account-handover.md).
Giữ khóa mã hóa trong secret manager cùng kế hoạch backup; xoay khóa này cần
tái thiết lập MFA có kiểm soát, không thay ngẫu nhiên khi restore.

Rate backend production bắt buộc database. Để trống
`RATE_LIMIT_TRUSTED_IP_HEADER` thì dùng bucket chung bảo thủ. Chỉ đặt header
khi reverse proxy thực sự xóa giá trị visitor gửi và ghi lại single IP; việc
đặt một header tùy ý sẽ làm mất bảo vệ chống giả mạo. Dọn bucket hết hạn định kỳ:

```sql
DELETE FROM security_rate_limits WHERE expires_at < now() - interval '1 day';
DELETE FROM security_totp_replays WHERE expires_at < now();
DELETE FROM security_admin_sessions WHERE expires_at < now();
```

Upload chỉ dùng ảnh JPEG/PNG/WebP/GIF và PDF public, xác minh bytes, UUID từ
server. Production local upload yêu cầu `UPLOAD_STORAGE=local` và
`UPLOAD_LOCAL_PERSISTENT=true`, volume dùng chung có backup. Reader
`/uploads/[...path]` phục vụ UUID file mới sau startup; PDF tải dạng attachment.
Không lưu dữ liệu khách hàng/private keys trong uploads. Serverless cần
tích hợp object storage trước khi bật upload. CSP còn dùng `unsafe-inline`
để tương thích Next/template hiện có; nonce CSP chưa triển khai.

## Rollout, rollback và sự cố

Đánh giá hiện tại: **đạt để nghiệm thu/staging, chưa xác nhận production
ready**. Bản404 riêng và bản vá dependency đã bổ sung sau lần rà soát go-live.
Các điều kiện còn thiếu được ghi trong [production-readiness.md](production-readiness.md).
Trước dùng thật phải hoàn thành cấu hình bên dưới trên hạ tầng của chủ,
không chỉ chuyển database thử nghiệm sang một tên miền public.

1. Chủ kiểm soát Git, hosting, Neon, DNS và email; bật MFA cho các tài khoản đó.
2. Tạo production DB/branch và secrets tách thử nghiệm. Không dùng credentials
   của người làm thuê cho production. Backup trước thay đổi.
3. Dùng schema owner chạy `npm run db:migrate:admin`, web chỉ dùng DML role.
   Không dùng `db:push` trực tiếp lên production để tự suy đoán migration.
4. Deploy build đã kiểm thử, chạy lại HTTP/role/CRUD/draft/upload checks.
5. Chốt người nhận alert và kênh trực tiếp trong sổ bàn giao. `CONTACT_NOTIFY_EMAIL`
   chỉ là email yêu cầu khách hàng, không phải cấu hình cảnh báo uptime.

Critical: Next runtime/proxy, PostgreSQL, DNS/HTTPS và storage ảnh/PDF.
Resend notification không được làm mất liên hệ đã lưu nếu gửi mail lỗi.
Ngưỡng alert cần cấu hình tại monitoring: outage liên tục trên 2 phút,
HTTP5xx >5% trong 5 phút, backup quá 24h hoặc restore drill thất bại,
login failures tăng bất thường. Đây là ngưỡng đề xuất, chưa có monitor đang chạy.

Khi sự cố: ghi timestamp và audit log; nếu có truy cập sai quyền đặt
`ADMIN_ENABLED=false`; nếu form bị lạm dụng đặt `CONTACT_ENABLED=false`; có
thể tắt `WARRANTY_LOOKUP_ENABLED` hoặc `UPLOADS_ENABLED` từng tính năng. Xoay
secrets khi nghi lộ. Rollback build bằng version hosting trước đó, giữ cột
status/bảng mới vì tương thích code cũ. Code cũ không lọc nháp: trước rollback
phải chặn public routes hoặc triển khai bản vá lọc trạng thái, tránh lộ nháp.
Không drop cột/bảng để rollback code.

Mục tiêu dự kiến để chủ duyệt: RPO24h và RTO4h, backup mỗi ngày, retention30
ngày, restore drill mỗi tháng. Khôi phục vào DB tách biệt, kiểm tra dữ liệu
và app rồi mới đổi connection của web. Xem [verification.md](verification.md)
để phân biệt restore dữ liệu đã thử với DR/hosting failover chưa thử.

Neon hỗ trợ restore theo lịch sử trong phạm vi retention của gói; cần kiểm tra
gói cụ thể của chủ trong console: [Neon Restore API](https://api-docs.neon.tech/reference/restoreprojectbranch).

## Sites và bàn giao hosting

Đã đọc skill Sites và dùng workflow preview local. Repo hiện là Next.js Node
server, Neon, filesystem upload và scrypt; chưa có project_id/hosting manifest
Sites. Sites hosted server chạy Cloudflare Workers (128MB/isolate), còn
password hashing hiện cần bộ nhớ tối đa160MB và upload dùng filesystem Node.
Đưa nguyên app lên Sites cần một kế hoạch chuyển runtime/storage/auth riêng;
không tự chuyển framework hoặc publish một bản thiếu backend trong lượt này.
Preview local đã mở trong Codex; production hosting vẫn do chủ lựa chọn và
kiểm soát. Skill đã đọc: [Sites SKILL.md](C:/Users/vtrun/.codex/plugins/cache/openai-curated-remote/sites/1.0.1/skills/sites/SKILL.md).
