# Chạy INTECH trên cPanel iNET với MariaDB 10.6

Dự án dùng Node.js 22 (từ 22.20), Next.js và MariaDB/MySQL qua `mysql2`. Schema tạo mới không chèn dữ liệu mẫu. Bạn thêm sản phẩm ở `/admin/san-pham`; chọn **Xuất bản** để hiện ngoài website.

## 1. Tạo database trong cPanel

Vào **MySQL Databases / Manage My Databases**, tạo database và user, rồi **Add User To Database**. Tên đầy đủ có tiền tố `qnvlpdarhosting_`, ví dụ `qnvlpdarhosting_intech` và `qnvlpdarhosting_web`. Chép đúng tên cPanel hiển thị; đây là ví dụ, code không tự tạo tài khoản/database.

Lần tạo schema cần quyền CREATE. Có thể dùng tài khoản quản lý đầy đủ quyền cho bước này. Tài khoản website cần SELECT/INSERT/UPDATE/DELETE trên database của website. Không cấp quyền trên database khác.

Nếu phân quyền riêng theo bảng, bảng `warranty` cũng cần đủ SELECT/INSERT/UPDATE/DELETE để quản trị có thể thêm, sửa và xóa phiếu bảo hành. Kiểm tra sức khỏe database sẽ báo chưa sẵn sàng nếu thiếu quyền sửa hoặc xóa.

## 2. Điền `.env.local` khi thử trên laptop

File đã được tạo ở thư mục ứng dụng. Điền ba giá trị còn trống:

```dotenv
DATABASE_URL=
DB_HOST=103.57.221.79
DB_PORT=3306
DB_NAME=qnvlpdarhosting_intech
DB_USER=qnvlpdarhosting_web
DB_PASSWORD='mat_khau_database_cua_ban'
DB_CONNECTION_LIMIT=5
DB_SSL=false
DB_SSL_CA_FILE=
```

Tên database/user ở ví dụ cần thay bằng tên bạn đã tạo. Bao mật khẩu bằng dấu nháy nếu chứa `#` hoặc khoảng trắng; ký tự `$` phải viết thành `\$` trong file `.env.local` vì Next.js mở rộng biến môi trường. Không gửi mật khẩu trong chat. Khi dùng DB_* thì để DATABASE_URL trống. URL PostgreSQL cũ bị từ chối.

Trong cPanel **Remote Database Access / Remote MySQL**, cho phép đúng IP công khai hiện tại của laptop. iNET cũng phải cho phép truy cập cổng 3306 từ IP đó. Nếu không kết nối được, nhờ iNET kiểm tra quyền truy cập từ xa; không dùng `%` để mở cho mọi IP. Khi máy chủ hỗ trợ TLS, đặt `DB_SSL=true` và cấu hình `DB_SSL_CA_FILE` nếu dùng CA riêng. Có thể dùng SSH tunnel nếu gói hosting cung cấp SSH.

Chạy lệnh trong thư mục chứa `package.json`:

```powershell
cd D:\intechna-web\intechna-web
npm ci
npm run db:migrate
npm run db:check
npm run dev
```

`db:migrate` chỉ tạo 9 bảng, không nạp dữ liệu. `db:check` báo phiên bản MariaDB, bảng và số bản ghi, không in mật khẩu. Các cấu hình admin/email đang có trong `.env` được giữ lại; `.env.local` ưu tiên khi trùng biến. Khi chưa điền database, website chưa thể đọc/ghi dữ liệu thật.

Muốn xem tốc độ gần production: dừng dev, chạy `npm run build` rồi `npm run start`, mở `http://127.0.0.1:3000`. Build cần kết nối tới database đã tạo schema.

## 3. Deploy cả website lên cPanel

1. Trong **Setup Node.js App**, chọn Node 22 từ 22.20, **Production**, application root như `intechna-web` ngoài `public_html`, URL là domain của bạn, startup file **server.js**. Application Manager của iNET cũng dùng startup file này. Cần gói hosting có đủ RAM để chạy `next build`.
2. Upload mã nguồn ứng dụng, gồm `server.js`, `scripts`, `app`, `components`, `public`, `drizzle`, package/lockfile và các cấu hình. Không upload `node_modules` Windows, `.next` cũ, backups, scratch hay các file cấu hình chứa tài khoản thử.
3. Điền biến trong giao diện Node.js App hoặc `.env.local` riêng trên hosting. Đổi **DB_HOST=localhost**, giữ port 3306 và tên/user/password thật. Đặt `NODE_ENV=production`, `NEXT_PUBLIC_SITE_URL=https://domain-cua-ban`, `ADMIN_TRUSTED_ORIGINS=https://domain-cua-ban`, `RATE_LIMIT_BACKEND=database`, `UPLOAD_STORAGE=local`, `UPLOAD_LOCAL_PERSISTENT=true`.
4. Với chế độ đăng nhập bằng mật khẩu do chủ website lựa chọn, đặt `ADMIN_MFA_REQUIRED=false`, `ADMIN_USER` là tài khoản chủ, `ADMIN_PASSWORD` là mật khẩu đã chọn (8–256 ký tự). Đặt `ADMIN_SESSION_SECRET` riêng tối thiểu 32 byte và `HEALTHCHECK_TOKEN`. `ADMIN_TRUSTED_ORIGINS` là các origin HTTPS của website, ngăn cách bởi dấu phẩy. Có thể xóa `ADMIN_ACCOUNTS_JSON` cũ; khi đã có cặp USER/PASSWORD hợp lệ và MFA=false, cấu hình trực tiếp này được ưu tiên. Giữ nguyên các khóa và DB đang chạy, không đưa mật khẩu rõ vào source hoặc gói deploy. Chế độ MFA tùy chọn được mô tả riêng bên dưới.
5. Trong Terminal/SSH, kích hoạt môi trường Node bằng lệnh cPanel hiển thị, vào application root rồi chạy:

```sh
npm ci
npm run db:migrate
npm run db:check
npm run security:preflight
npm run build
```

6. **Restart** Node.js App. Không chạy thêm `npm start` song song với Passenger. Kiểm tra trang chủ, `/admin-login`, thêm một sản phẩm nháp rồi xuất bản, thử form liên hệ/bảo hành và upload ảnh. `public/uploads` phải ghi được và được giữ lại qua các lần deploy. Chỉ cấu hình header IP chống spam khi iNET xác nhận proxy đã xóa và ghi đè header đó.

`server.js` hỗ trợ binding riêng của Passenger và chạy production mặc định. Nếu Application Manager chỉ nhận tên mặc định `app.js`, giữ cả hai file: `app.js` chuyển tiếp sang `server.js`. Trên laptop có thể chạy `npm run start:cpanel` sau khi build thành công. Không bật `NEXT_STANDALONE=true` khi dùng custom server này. Xem [Passenger reverse port binding](https://www.phusionpassenger.com/docs/advanced_guides/in_depth/node/reverse_port_binding.html).

### Nếu gặp 503 hoặc Internal Server Error

Đọc các dòng cuối của `stderr.log`. Nếu báo `ReferenceError: require is not defined in ES module scope` tại `server.js`, file khởi động trên hosting đang dùng CommonJS trong project có `"type": "module"`. Upload lại đúng `server.js`, `app.js` và `scripts/load-env.mjs` từ project, giữ nguyên cấu trúc thư mục, startup file `server.js`, rồi Restart. Không xóa `"type": "module"` trong package.json. File khởi động nằm ngoài `.next`, nên upload riêng `.next` không cập nhật được file này; không cần build lại chỉ vì thay file khởi động.

Bản server hiện tại ghi bước khởi động và mã lỗi an toàn, không ghi nội dung exception có thể chứa bí mật. `environment-load / ERR_MODULE_NOT_FOUND` cần kiểm tra `scripts/load-env.mjs` và gói `@next/env`; `next-import / ERR_MODULE_NOT_FOUND` cần kiểm tra thư viện đã cài trên hosting; `next-prepare` cần kiểm tra bản build/config và dependency; `server-listen` cần kiểm tra Passenger/cổng. Bước lỗi chỉ giúp thu hẹp phạm vi, không tự chứng minh nguyên nhân.

Với application root `nextjs_app` và Node 22, kiểm tra trong **Terminal của cPanel**:

```sh
source /home/qnvlpdarhosting/nodevenv/nextjs_app/22/bin/activate && cd /home/qnvlpdarhosting/nextjs_app
head -n 3 server.js
ls -l scripts/load-env.mjs .next/BUILD_ID
node -p 'require("next/package.json").version'
tail -n 40 stderr.log
```

Dòng đầu của server phải là `import { createServer } from 'node:http'`. Bản build `.next`, source và dependency phải cùng phiên bản. Không dùng `node_modules` lấy từ Windows trên Linux. Nếu build trực tiếp trên CloudLinux, dùng `npm install --include=dev` rồi `npm run build -- --webpack` để tránh Turbopack gặp symlink `node_modules` ngoài project root.

Nếu hosting đã cài Next.js 16.4.1 trong khi `.next` được build bằng 16.3.8, có thể gặp lỗi thiếu `.next/server/preview-props.json`. Không tự tạo file preview để vá định dạng build. Đồng bộ runtime với bản build bằng `npm install --save-exact next@16.3.8 @next/env@16.3.8`, xác nhận `node -p 'require("next/package.json").version'` trả về `16.3.8`, rồi Restart trên cPanel. Project ghim Next.js 16.3.8 trong package.json và lockfile để cài lại đúng phiên bản. Khi nâng Next.js, build lại `.next` bằng cùng phiên bản mới trước khi deploy.

Tên miền mặc định của project là `https://intechna.vn`. Logo và nút quay về website trên trang đăng nhập dùng đường dẫn `/`, giữ người dùng trên cùng website đang mở. Đặt `NEXT_PUBLIC_SITE_URL=https://intechna.vn` trước khi build để canonical, sitemap và metadata đúng tên miền. Biến `NEXT_PUBLIC_*` được đóng vào bản build; chỉ đổi biến trên cPanel rồi Restart không sửa được các URL đã nằm trong `.next`. Khi thay tên miền phải build lại và triển khai đồng bộ bản `.next` mới.

Nếu trang đăng nhập báo "Quản trị chưa được cấu hình an toàn", lỗi xảy ra trước xác minh mật khẩu. Bản `server.js` hiện tại gọi `scripts/admin-config-diagnostics.mjs` sau khi nạp env và ghi một dòng `[admin-config]` vào stderr. Dòng này chỉ chứa `ready`, tên trường sai, số tài khoản và cờ thiết lập lần đầu; không chứa username/password/hash/khóa. Kiểm tra log này sau Restart để biết cấu hình **thực tế của tiến trình web**, thay vì suy đoán từ môi trường Terminal có thể khác. `ready: true` chỉ xác nhận định dạng cấu hình, không xác nhận quyền DB hay thành công đăng nhập. Nếu diagnostic báo ready nhưng API vẫn báo cấu hình lỗi, kiểm tra Passenger đã nạp đúng `.next` mới và đã dừng/khởi động lại process. Giữ `server.js`, `app.js`, `scripts/load-env.mjs` và `scripts/admin-config-diagnostics.mjs` cùng nhau khi upload bản startup mới.

Nếu gặp `ER_ACCESS_DENIED_ERROR` (1045), máy chủ đang từ chối xác thực. Chép chính xác tên user trong **Current Users** (gồm tiền tố tài khoản cPanel), dùng mật khẩu của user MySQL đó và kiểm tra **Add User To Database**. Nếu cần, đổi mật khẩu rồi cập nhật `.env.local`. Không lấy mật khẩu cPanel hoặc tài khoản admin website làm mật khẩu database. Build cần truy cập MySQL để tạo trang, nên phải xử lý lỗi này trước khi build hoàn tất.

Cũng có thể import trực tiếp `drizzle/0001_mysql.sql` qua phpMyAdmin thay cho `db:migrate`. Không import file dữ liệu hay bản build cũ vào database mới.

## 4. Sao lưu và nội dung

### Tài khoản thiết lập Google Authenticator ngay lần đăng nhập đầu

Phần này chỉ áp dụng khi chủ chọn `ADMIN_MFA_REQUIRED=true` (hoặc bỏ biến này). Cấu hình triển khai hiện tại theo yêu cầu của chủ là `false`: đăng nhập thẳng bằng tài khoản/mật khẩu, không nhập mã, không phát khóa và không hiện phần đổi Authenticator trong trang tài khoản. Đổi mật khẩu và thu hồi phiên chỉ cần xác nhận mật khẩu hiện tại. Khóa MFA cũ trong DB không bị xóa và không được giải mã để đăng nhập ở chế độ này. Thay chế độ sẽ làm thay đổi phiên bản xác thực và vô hiệu các cookie cũ.

`ADMIN_ACCOUNTS_JSON` có thể khai báo tài khoản với `requireMfaSetup: true`, passwordHash scrypt hợp lệ và **không có** `totpSecret`. Đây là tài khoản chờ thiết lập MFA, không phải tắt MFA. Không ghi mật khẩu rõ vào source. Giữ JSON trong biến môi trường cPanel; nếu dùng file env phải escape ký tự `$` trong hash.

1. Nhập đúng tài khoản và mật khẩu tại `/admin-login` để nhận khóa thiết lập qua kết nối HTTPS. Bước này chỉ cấp cookie thiết lập HttpOnly trong 10 phút, không cấp quyền quản trị.
2. Thêm khóa vào Google Authenticator với loại dựa trên thời gian. Nhập mã 6 số vào website để hoàn tất. Khóa được mã hóa vào bảng `security_admin_credentials`; database và `ADMIN_CREDENTIAL_ENCRYPTION_KEY` phải được giữ nguyên qua các lần deploy.
3. Những lần đăng nhập sau: nhập tài khoản/mật khẩu, rồi nhập mã từ mục đã thêm. Web không phát khóa mới hoặc cho xem lại khóa cũ khi tài khoản đã hoàn tất MFA. Không bắt đổi mật khẩu ban đầu.

Việc xác nhận dùng lại bảng session, cột pending_totp/pending_expires_at và CAS của credential; không cần thêm bảng hay chạy lại migration. Phiên thiết lập chỉ dùng được trên trình duyệt đã bắt đầu, hết hạn sau 10 phút, bị giới hạn thử mã và bị thu hồi khi hoàn tất. Hai thiết lập đồng thời chỉ một thiết lập có thể thắng. Mỗi mã được chấp nhận một lần. Luồng đổi ứng dụng xác thực trong `/admin/tai-khoan` vẫn cần mật khẩu và mã của khóa hiện tại.

Khi triển khai thay tài khoản bootstrap, cập nhật JSON riêng do chủ giữ cùng bản build `.next` tương ứng, giữ nguyên khóa dùng chung, rồi Restart. File trong `data/owner` không được đưa vào thư mục công khai hoặc gói `.next`. Không xóa bảng credential để cập nhật giao diện. Bộ tài khoản cũ vẫn nằm riêng trên laptop để dự phòng; quyền đăng nhập thực tế được quyết định bởi danh sách tài khoản trong môi trường hosting và credential đã lưu.

`npm run db:backup` tạo snapshot MySQL + uploads trong `backups`, có checksum, giữ credential mã hóa và bỏ session/rate-limit/MFA tạm. Giữ khóa mã hóa admin riêng để khôi phục MFA. `npm run db:restore -- <thu-muc-backup>` yêu cầu `RESTORE_DATABASE_URL=mysql://...`, `RESTORE_TARGET_ENV=staging` và database trống có tên khác nguồn; không ghi vào database đang chạy. MySQL DDL không rollback: khi restore lỗi, giữ database đích tách biệt để kiểm tra.

`content:export`, `content:import`, `content:validate` tiếp tục hỗ trợ nội dung bạn tự tạo. `data/content.example.json` không có sản phẩm. Database Neon cũ không được kết nối hay xóa từ dự án này; cấu hình cũ đã được giữ riêng trong `backups/pre-mysql-config` để có thể tra cứu khi cần. Không đưa thư mục đó lên hosting.

Tài liệu nhà cung cấp: [cPanel Node.js Application](https://docs.cpanel.net/knowledge-base/web-services/how-to-install-a-node.js-application/), [Drizzle + MySQL](https://orm.drizzle.team/docs/get-started/mysql-new).
