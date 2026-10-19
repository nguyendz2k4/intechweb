# Intech website
Website tiếng Việt cho hạ tầng mạng và thiết bị doanh nghiệp, dùng Next.js 16, React, TypeScript, Drizzle và MariaDB 10.6/MySQL 8. Chạy cả web và database trên cPanel iNET có Node.js 22 từ 22.20.

Đọc [hướng dẫn cPanel + MySQL](CPANEL-MYSQL.md) để tạo database, điền `.env.local`, thử local và deploy. Database mới không có sản phẩm mẫu; sản phẩm bạn tự thêm và xuất bản trong admin là nguồn duy nhất của catalog.

```sh
npm ci
npm run db:migrate
npm run db:check
npm run dev
```

Production: cấu hình database/admin/domain, chạy `npm run security:preflight`, `npm run build`, rồi Restart Node.js App với startup file `server.js`. Trên máy tính, có thể dùng `npm run start` sau build.

```sh
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build:ci
```

CI build dùng một bản sao tạm với adapter riêng để kiểm tra catalog trống; không kết nối database thật. Kiểm tra iNET thực tế cần tên database/user/password của chủ website.

Schema trong `app/lib/db/schema.ts`, SQL tạo bảng ở `drizzle/0001_mysql.sql`; migration chạy riêng, không chạy khi khách mở trang. Public catalog/editorial cache tự hết hạn và được xóa ngay khi admin sửa nội dung. Admin kiểm tra quyền, phiên thu hồi và validation ở server. Cấu hình `ADMIN_MFA_REQUIRED=false` dùng `ADMIN_USER`/`ADMIN_PASSWORD` để đăng nhập không cần Authenticator; MFA chỉ áp dụng khi được bật trong môi trường. Upload cPanel lưu trong `public/uploads` cần quyền ghi và được giữ qua deploy.

`db:backup`/`db:restore` sao lưu MySQL và uploads có checksum, không khôi phục các phiên cũ. `content:export/import/validate` chuyển nội dung do chủ website tạo. Không gửi `.env*`, `data/owner`, backups, uploads riêng hay bản build thử kèm source; dùng `handover:package` và `handover:verify`.
