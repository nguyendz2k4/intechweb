# Phạm vi kiểm chứng

Ngày 2026-10-15 đã kiểm tra trực tiếp MariaDB cPanel của chủ website:

- `npm run db:migrate` thành công: tạo 9 bảng InnoDB từ `drizzle/0001_mysql.sql`, không chèn dữ liệu mẫu.
- `npm run db:check` thành công với MariaDB `10.6.28-MariaDB-cll-lve-log`; products/posts/services/warranty/contact_submissions đều có 0 bản ghi tại thời điểm kiểm tra.
- Health probe read-only xác minh các bảng/cột cần thiết, quyền runtime và transaction thành công.
- `npm run build` thành công với cấu hình MySQL thật: biên dịch, TypeScript và prerender hoàn tất, tạo 42 trang tĩnh.
- Custom server `server.js` khởi động production trên localhost. GET `/`, `/san-pham/catalog`, `/admin-login`, `/dich-vu`, `/tin-tuc` đều trả HTTP 200. Server kiểm tra đã dừng sau khi xác minh.
- Hai kiểm thử loader kiểm tra `require()`, binding Passenger/local và việc `app.js` chuyển tiếp mà không khởi động hai server đều đạt. Các kiểm thử này mô phỏng Next/Passenger, không thay thế kiểm tra trên hosting.

Cần kiểm tra sau khi deploy thực tế lên cPanel: khởi động Passenger/Node trên domain HTTPS, đăng nhập MFA production, thêm sản phẩm do chủ tạo, uploads được giữ qua deploy, email và restore backup. Chưa upload/deploy mã nguồn hoặc chạy app trên cPanel trong phiên kiểm tra này.

CI build và các kiểm thử cache/transaction khác dùng fixture tách biệt. Những báo cáo PostgreSQL cũ trong docs/admin-security là lịch sử; không dùng chúng để kết luận MySQL production đã được kiểm chứng.

Ngày 2026-10-15, bản sửa tên miền và nút quay về đã được kiểm tra:

- Logo và liên kết quay về trên trang đăng nhập dùng `/`; tên miền mặc định/build là `https://intechna.vn`.
- 13 kiểm thử SEO/HTTP audit đạt; build production Next.js 16.3.8 hoàn tất TypeScript và 42 trang tĩnh.
- GET `/admin-login` và `/` trên custom server production local trả 200. HTML xác nhận hai liên kết dùng `/`, canonical trang chủ dùng `https://intechna.vn`, không còn `switchcu.vn`. Server tạm đã dừng.
- `release/next-intechna-domain-fix-2026-10-15.zip` chứa 961 file runtime trong `.next`, không có env/credential/node_modules; đã đọc giải nén và đối chiếu SHA-256 từng file với bản build. Gói này chưa được agent triển khai lên hosting.

Ngày 2026-10-15, luồng MFA trong lần đăng nhập đầu đã được kiểm tra:

- Tài khoản bootstrap có `requireMfaSetup: true` chỉ nhận khóa sau khi xác minh mật khẩu. Chưa có mã đúng thì không nhận session quản trị. Cookie thiết lập HttpOnly/SameSite/10 phút không dùng được để vào admin.
- Kiểm thử bao phủ mật khẩu sai, origin sai, mã sai, token giả/hết hạn, giới hạn thử mã, chống replay, hai phiên thiết lập cạnh tranh, cùng khóa ở lần đăng nhập sau và không mở lại thiết lập dù giữ cờ bootstrap.
- `npm test`: 132 kiểm thử, 129 đạt, 3 được đánh dấu skip từ trước, 0 lỗi. ESLint/Prettier cho các file thay đổi đạt. Build Next.js 16.3.8 hoàn tất TypeScript và 42 trang tĩnh.
- Kiểm tra HTTP production thực với MariaDB cPanel bằng username QA ngẫu nhiên: xác nhận MFA, đọc session, dừng và khởi động server mới, xác minh vẫn dùng khóa cũ và yêu cầu mã; ciphertext DB không đổi. Chỉ các bản ghi QA trong bảng bảo mật được tạo/xóa, không thay đổi tài khoản chủ hoặc nội dung. Server tạm đã dừng.
- Cấu hình tài khoản chủ mới chỉ được chuẩn bị trong `data/owner` và env local, chưa hoàn tất MFA thay chủ. Gói `release/cpanel-admin-first-login-2026-10-15.zip` chỉ chứa `.next`, không có env/JSON tài khoản riêng tư; đã quét loại trừ mật khẩu/hash/email bootstrap và đối chiếu file ZIP với bản build. Gói cũng bao gồm bản sửa tên miền trước đó và chưa được agent triển khai lên hosting.

Sau yêu cầu bỏ Google Authenticator của chủ ngày 2026-10-15:

- Bản cấu hình hiện tại đặt `ADMIN_MFA_REQUIRED=false` và dùng `ADMIN_USER`/`ADMIN_PASSWORD`. Cặp biến trực tiếp được ưu tiên hơn JSON cũ; khóa MFA cũ không được giải mã hay dùng để yêu cầu mã. Trang tài khoản ẩn các thao tác Authenticator và server từ chối bắt đầu/xác nhận MFA trong chế độ này. MFA cũ vẫn chỉ chạy nếu được bật rõ trong cấu hình.
- `npm test`: 139 kiểm thử, 136 đạt, 3 skip từ trước, 0 lỗi. ESLint các file thay đổi và build Next.js 16.3.8/TypeScript/42 trang tĩnh đều đạt.
- Kiểm thử production HTTP với MariaDB thật và username QA ngẫu nhiên xác minh đăng nhập không OTP, từ chối mật khẩu sai, Restart, bỏ qua ciphertext MFA cũ và JSON lỗi, tự đổi mật khẩu không cần mã, thu hồi cookie cũ và đăng xuất. Không đổi credential chủ/nội dung; các bản ghi QA đã được xóa, server tạm đã dừng.
- `release/cpanel-admin-password-only-2026-10-15.zip` chứa 962 file gồm `.next` và 4 file startup/helper. Gói không chứa env hoặc tài khoản rõ; đã quét email/mật khẩu chủ khỏi output và đối chiếu SHA-256 từng file ZIP với bản build. File hướng dẫn chứa giá trị thật nằm riêng trong `data/owner/ADMIN-PASSWORD-ONLY-CPANEL.txt`, không đưa vào gói. Agent chưa triển khai gói này lên hosting.

Ngày 2026-10-16, bản sửa nội dung và sản phẩm đã được kiểm tra:

- Tin tức hiển thị từng thẻ chỉ chứa tiêu đề và liên kết đến trang chi tiết. Trang Giải pháp đọc nội dung CMS đã xuất bản, giữ các giải pháp có sẵn và ẩn bản nháp. Thêm/sửa/xóa dịch vụ làm mới cache cả Dịch vụ, Giải pháp và sitemap.
- Admin sản phẩm dùng sáu danh mục cố định, không tự mặc định Switch; API đồng bộ nhãn và mã danh mục. Chỉ tên hãng được chuyển thành chữ hoa khi lưu; tên/model, mô tả và slug giữ nguyên quy tắc cũ. Không tự đổi danh mục hoặc tên hãng của dữ liệu đang có nếu chưa lưu lại.
- Upload giữ tên tệp, có preview/trạng thái rõ ràng; lỗi tải lên chặn lưu cho đến khi thử lại hoặc bỏ tệp lỗi. Guard lưu trữ production, giới hạn tệp và phân quyền được giữ nguyên.
- `npm test`: 148 kiểm thử, 145 đạt, 3 skip từ trước, 0 lỗi. Full ESLint đạt; sau bổ sung viết hoa hãng, ESLint/Prettier tập trung và kiểm thử CMS đạt. Build production Next.js 16.3.8 hoàn tất TypeScript và 37 trang tĩnh.
- Kiểm tra HTTP production local với MariaDB thật: thẻ tin tức chỉ có tiêu đề, đọc được chi tiết; nội dung CMS đã xuất bản có thẻ/chi tiết Giải pháp; ảnh multipart được phục vụ ngay mà không Restart; sản phẩm QA nháp lưu Router dù nhãn cũ gửi Switch, đổi sang WiFi, tên hãng tạo/sửa được viết hoa và tên/model/mô tả không đổi. Trang bản nháp không lộ nội dung, có noindex khi Next stream trang không tìm thấy. Đăng nhập không OTP, đổi mật khẩu tùy chọn và thu hồi session vẫn đạt.
- Chỉ tạo một bản nháp, ảnh và tài khoản bảo mật QA ngẫu nhiên để kiểm tra; các bản ghi và ảnh QA đã được dọn, server tạm đã dừng. Không tạo nội dung QA xuất bản, không đổi tài khoản chủ hoặc nội dung đang có. Kiểm tra giao diện Tin tức bằng trình duyệt local xác nhận các thẻ và tiêu đề riêng.
- Gói `release/cpanel-content-product-fixes-2026-10-16.zip` gồm 926 file `.next` runtime và bốn startup/helper, không chứa env, upload người dùng, cache runtime hay giá trị bí mật đã quét. Đã đọc từng entry ZIP bằng .NET và đối chiếu SHA-256 với bản build cuối; tất cả khớp. Hướng dẫn cập nhật nằm trong `docs/handover/CONTENT-PRODUCT-UPDATE.md`. Chưa triển khai gói mới lên cPanel trong phiên này.

## Gói cập nhật logo, bảo hành và nền sáng — bàn giao 18/10/2026

- Build production thật bằng Next.js 16.3.8 và Node.js 22.20.0, đặt NEXT_PUBLIC_SITE_URL=https://intechna.vn; hoàn tất TypeScript và 39 trang tĩnh, exit 0. Không dùng adapter/dữ liệu CI.
- BUILD_ID: AruClW1MW85sZB7NGT5YQ.
- Chạy server.js production cục bộ: trang chủ HTTP 200, canonical đúng tên miền, CSS nền #edf5fc, logo HTTP 200 và khớp nguyên tệp, API admin bảo hành từ chối yêu cầu chưa đăng nhập. Server thử đã dừng; không sửa dữ liệu database.
- Gói release/cpanel-logo-warranty-bright-2026-10-17.zip gồm 933 tệp, 11.754.916 byte: .next runtime, logo mới và bốn file startup/helper. Không chứa env, cache, bản dev, node_modules, uploads của người dùng hoặc dữ liệu giả lập.
- Đã quét giá trị cấu hình riêng tư trong bộ nhớ và marker fixture; đã đọc từng entry bằng .NET ZipArchive, đối chiếu kích thước/SHA-256 với manifest và tệp runtime hiện tại: tất cả đạt.
- SHA-256 ZIP: a67ef63de0db48e56bde5d61d2cd961b3a110ec11d6e20887bb05642b12177be. Checksum và manifest đặt cạnh ZIP.
- Hướng dẫn: LOGO-WARRANTY-UPDATE-2026-10-17.md. Chưa upload hoặc triển khai gói lên hosting.


## Bảo hành nhập file và giá sản phẩm — 18/10/2026

- Unit/integration tests: 171 tổng, 168 đạt, 3 skip, 0 lỗi. Bao gồm DOCX gộp ô/serial có số 0 đầu, CSV, ngày sai, trùng serial, giao dịch nhập rollback, phân quyền/CSRF, model và mã cũ, giá VND, slug từ nội dung dán, 1.000 từ, migration có thể chạy lại và đọc backup phiên bản 2.
- TypeScript, ESLint các tệp thay đổi và kiểm tra whitespace đều đạt.
- Build CI cách ly thành công. Build production thật cho https://intechna.vn thành công, 32 trang tĩnh; catalog render khi truy cập với cache dữ liệu hiện có. BUILD_ID: `pV0bW5Lh5tll07BYt9vZO`.
- UI kiểm thử cục bộ dùng bộ nhớ: dán tên có ®/™ và dấu gạch đặc biệt, sinh slug và lưu giá; đọc file Word thành 198 linh kiện/22 bộ; xem trước và nhập 198 dòng từ ngày mua năm 2024; sửa model, giữ mã cũ dạng ngắn. Navbar/catalog desktop và menu mobile đã kiểm tra ảnh.
- HTTP smoke bản production localhost: trang chủ, CSS, logo, favicon, mẫu CSV đều 200; domain chính xác; API bảo hành và nhập file chặn yêu cầu không đăng nhập (403). Không gọi thao tác ghi vào DB production.
- Hai thư viện fflate/fast-xml-parser được bundle; không có dependency mới bên ngoài trong Next server traces.
- ZIP: `release/cpanel-warranty-import-price-2026-10-18.zip`, 956 tệp, 12.999.908 byte. SHA256 `c5779f70d19e155bbc5feeedc42f4cc6c9e236b498ccde5ac8c599a74d4daa74`.
- Đã quét nội dung cho dấu hiệu fixture và giá trị cấu hình bí mật, không chứa `.env`, tài khoản, DB dump, uploads hay file Word khách hàng. Có checksum/manifest bên cạnh ZIP.
- Cần chạy migration `0002_product_price_warranty_model.sql` trên hosting trước khi dùng runtime mới. Chưa tự động cập nhật cấu trúc, nhập dữ liệu hay triển khai lên hosting.

## Đồng bộ favicon logo navbar — 18/10/2026

- Thay hai PNG icon cũ bằng logo navbar, bổ sung ICO 16/32/48 px, giữ SVG chứa đúng logo gốc. Các đường dẫn metadata dùng `intech-gold-3`; icon điện thoại đúng 180 x 180 px.
- Build production thật thành công (bao gồm TypeScript), BUILD_ID `BTM-_PIjEU62JOfrGAfth`. ESLint các tệp thay đổi đạt. Đã xem PNG 180 px để xác nhận logo vàng trên nền xanh nhạt.
- HTTP localhost xác nhận trang chủ và đăng nhập admin có đủ bốn liên kết icon mới; PNG/SVG/ICO đều HTTP 200 và nội dung khớp tệp. Đã kiểm tra kích thước PNG, cả ba frame ICO và logo nhúng trong SVG khớp nguyên tệp navbar.
- Gói đầy đủ mới: `release/cpanel-warranty-import-price-favicon-2026-10-18.zip`, 959 tệp, 13.018.576 byte; SHA-256 `6b4a0a3848dc6e891f506f6412ee256ef587e9793e9115dfa65dbfdd38aef830`.
- Quét cấu hình riêng tư/fixture đạt; đọc toàn bộ ZIP bằng .NET và so SHA-256/kích thước từng tệp với manifest và nguồn build đều khớp. Gói cũ được giữ lại. Server thử đã dừng; không thay đổi database hoặc triển khai production.
