> Tài liệu lưu từ giai đoạn PostgreSQL, không phải hướng dẫn triển khai MySQL hiện tại. Xem [cPanel + MariaDB](../../CPANEL-MYSQL.md). Các kết quả database/restore cũ không chứng minh MariaDB iNET đã được kiểm tra.

# Quyết định dùng thực tế — cập nhật 14/10/2026

**Chức năng thiếu đã hoàn thiện và kiểm thử local/staging. Chưa xác nhận
production đạt trên hạ tầng thật của chủ.**

Đã đạt100/100 test, TypeScript, build sạch550/550 trang, runtime audit ngày13/10 có0 advisory,
dịch vụ/public/sitemap, password/MFA/revocation qua HTTP DB thật,404/500/retry
trên trình duyệt và restore archive cũ/schema mới. Bằng chứng:
[completed-functions.md](completed-functions.md).

## Đã hoàn thiện

- Dịch vụ CMS nối danh sách/chi tiết/SEO/sitemap; nháp ẩn cả fallback tĩnh.
- Tài khoản: đổi password, thiết lập/thay MFA và thu hồi mọi phiên.
- Session server: logout thu hồi cookie sao chép ngay.
- Cập nhật credential nguyên tử: yêu cầu cũ không thể thu hồi phiên mới;
  rotation secret cấu hình vô hiệu hóa cả phiên dùng credential override.
- Công cụ setup account ban đầu và maintenance recovery cho chủ.
- Trang error/global-error500 và retry phục hồi lỗi trang/root layout thật.
- Backup credential mã hóa, restore cũ/mới, preflight và health có token.

Danh sách/role account vẫn do chủ cấp qua secret manager, tối đa20 người;
không mở đăng ký admin công khai. Product template/CSS giữ nguyên. Hộp thư
khách đọc/lọc/đổi trạng thái; email trả lời tự động không thuộc phạm vi đã
điều chỉnh để giữ giao diện và schema gọn.

## Điều kiện cần trên môi trường triển khai

1. Chủ nhận Git/hosting/Neon/DNS/email, bật MFA/recovery, thu hồi quyền người
   làm thuê. Thiết lập production account theo account-handover.md và secrets
   mới. Local hiện dùng dev credentials; artifact production đóng admin503
   vì chưa có owner account/MFA production.
2. Production DB riêng, migration đủ, runtime DML; xác minh cloud IAM, IP
   allowlist/private networking, TLS và ingress trên tài khoản chủ.
3. Persistent shared upload volume hoặc object storage tích hợp với hosting;
   backup assets ngoài máy. Không bật cờ persistent trên ổ đĩa tạm.
4. Trusted IP header do ingress xóa/ghi đè. Nếu chưa cấu hình, khách dùng chung
   quota bảo thủ. Chặn direct origin nếu kiến trúc yêu cầu.
5. Monitoring gọi health probe có token; chốt người nhận alert/dự phòng,
   backup schedule/retention và thử rollback/failover trên deployment thật.
6. Chủ duyệt nội dung/thông tin doanh nghiệp/xử lý dữ liệu form, xác minh
   mail domain và thử giao nhận với người nhận được chỉ định. QA không gửi mail.

Preflight hiện báo thiếu account production, HTTPS origins, rate backend
cấu hình rõ và persistent upload. Code health/backup đã có; ownership, domain,
người nhận alert và cloud permissions cần thông tin thật từ chủ. Giữ đúng khóa
mã hóa MFA khi restore; không thay ngẫu nhiên.

Sites chưa được dùng làm hosting. App hiện dùng Next Node/scrypt/filesystem;
chuyển platform cần runtime/storage tương thích. Chưa publish hay tạo bản
static bỏ backend thay cho app này.

Chạy smoke test trên deployment thật và chủ nghiệm thu data/email trước
go-live. Test pass ở local không thay cho kiểm chứng hạ tầng production.
