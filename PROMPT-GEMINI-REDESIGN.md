# Prompt cho Gemini: lập kế hoạch thiết kế lại website Intech

Bạn đóng vai trò Product Designer, UX Designer và Frontend Architect. Hãy khảo sát dự án, làm rõ các quyết định quan trọng rồi lập kế hoạch thiết kế lại website Intech. Giai đoạn này chỉ phân tích và lập kế hoạch; chưa sửa code, cài dependency hoặc thay đổi dữ liệu.

## 1. Bối cảnh dự án và tài liệu cần đọc

- Repository: `D:\intechna-web`.
- Thư mục ứng dụng Next.js: `D:\intechna-web\intechna-web`.
- Tài liệu định hướng: `D:\intechna-web\apple-DESIGN.md`. Đọc đầy đủ và rút ra nguyên tắc thiết kế áp dụng cho dự án.
- Đọc `README.md`, `package.json`, `components.json`, `app/ui-toolkit.css`, `app/globals.css`, layout, component dùng chung và các trang liên quan trong thư mục ứng dụng.
- Kiểm tra các route `/`, `/san-pham`, `/san-pham/catalog`, trang danh mục, trang hãng `/thuong-hieu`, trang chi tiết sản phẩm và `/bao-hanh`. Xem luồng tìm kiếm, bộ lọc, `WarrantyCheck` và API bảo hành thực tế.
- Nếu có quyền truy cập trình duyệt, xem giao diện hiện tại và trang development `/ui-preview`. Nếu không đọc được file hoặc mở được trang, nêu rõ phần chưa xác minh; không tự giả định nội dung.

Website giới thiệu, cung cấp thiết bị mạng như router, switch, WiFi, firewall và các giải pháp hạ tầng. Tra cứu bảo hành là chức năng quan trọng; người dùng cũng cần tìm sản phẩm, xem thông số, tìm theo hãng và liên hệ tư vấn/báo giá. Giao diện dùng tiếng Việt.

Nền tảng hiện tại: Next.js App Router, React, TypeScript; backend Route Handlers, Drizzle và PostgreSQL trên Neon. Giữ kiến trúc này trong kế hoạch thiết kế giao diện.

UI đã có trong `components/ui/`:
- Aceternity UI: Tracing Beam, Spotlight, Card Stack, Background Beams.
- Magic UI: Border Beam, Number Ticker, Retro Grid.
- Dependency đã cài: Motion for React (`motion/react`), GSAP, ScrollTrigger, `@gsap/react`, Tailwind CSS v4, `clsx`, `tailwind-merge`.
- Helper `cn()` ở `lib/utils.ts`; registry được cấu hình trong `components.json`.
- Tailwind hiện không nạp Preflight vì dự án đã có reset CSS riêng. Khi đề xuất chuyển đổi CSS, phải có phương án tránh xung đột.

Đây là các component đã cài riêng lẻ, không phải toàn bộ thư viện. Bento Grid, spotlight bám con trỏ, scroll-driven stacking, horizontal scroll và text scrubbing chưa được xác nhận là đã có; kiểm tra trước khi đề xuất bổ sung. Không coi `Spotlight` hiện tại là spotlight hover hoặc `CardStack` tự luân phiên là card stacking theo cuộn.

## 2. Hướng thiết kế

Tôi muốn giao diện mang tinh thần Apple: tinh gọn, hiện đại, cao cấp; hình ảnh thiết bị là trung tâm; typography rõ ràng; nhiều khoảng thở; UI/UX trực quan, dễ sử dụng. Chất công nghệ đến từ cách thể hiện sản phẩm, đường kết nối và chuyển động có ý nghĩa.

Áp dụng các nguyên tắc trong `apple-DESIGN.md`: nền trắng/off-white xen kẽ các section tối, màu xanh hành động làm điểm nhấn, bố cục product-first, phân cấp chữ và spacing nhất quán, hạn chế chrome trang trí. Typography phải đọc tốt tiếng Việt và có font fallback trên Windows, Android, macOS và iOS.

Phối hợp các hiệu ứng công nghệ dưới đây với ngôn ngữ Apple. Giải thích những điểm cần điều chỉnh so với tài liệu gốc, nhất là spotlight hover, ánh sáng và mesh. Yêu cầu hover của tôi được ưu tiên hơn dòng “Never document hover” trong tài liệu tham chiếu. Không sao chép nguyên xi demo UI với màu sắc, shadow và bố cục mặc định.

Trang chủ là ưu tiên cao nhất về ấn tượng đầu tiên. Ngay màn hình đầu, người dùng cần hiểu Intech cung cấp gì, thấy hình ảnh thiết bị phù hợp và tìm được đường đến sản phẩm hoặc tra cứu bảo hành. Hiệu ứng phải hỗ trợ nội dung và tác vụ; không bắt người dùng xem hết animation mới thao tác được.

## 3. Trang chủ và chuyển động

Đề xuất storyboard cụ thể cho toàn bộ trang chủ: thứ tự section, mục tiêu, nội dung, hình ảnh, CTA và cách chuyển tiếp giữa các section. Hero cần có concept riêng phù hợp router/switch và hạ tầng mạng, thể hiện rõ trên desktop và mobile.

Tôi muốn sử dụng các nhóm hiệu ứng sau ở những vị trí phù hợp:

1. **Card Stacking:** các thẻ xếp lớp để kể câu chuyện sản phẩm hoặc giải pháp. Phân biệt rõ stacking theo cuộn với Card Stack tự luân phiên đã có; đề xuất cách triển khai đúng trải nghiệm.
2. **SVG Line Tracing / Cable Data Flow:** đường kết nối và luồng dữ liệu gắn với router, switch, access point hoặc sơ đồ mạng. Cân nhắc Tracing Beam cho tiến trình dọc và SVG + GSAP cho đường cáp tùy chỉnh; không giả định một component đáp ứng tất cả.
3. **Bento Grid + Spotlight Hover:** nhóm năng lực, sản phẩm hoặc lợi ích theo ô có phân cấp rõ. Đề xuất spotlight nhẹ bám con trỏ, cùng trạng thái focus và phương án cho thiết bị cảm ứng.
4. **Horizontal Scroll:** một khu vực giới thiệu dải thiết bị hoặc giải pháp; mô tả cách kích hoạt, chiều dài, tiến trình và lối thoát. Trên mobile ưu tiên swipe/scroll-snap hoặc bố cục dọc phù hợp.
5. **Text Scrubbing / Reveal:** chữ xuất hiện hoặc thay đổi theo tiến trình cuộn để nhấn mạnh thông điệp ngắn. Nội dung quan trọng vẫn đọc được khi JavaScript hoặc animation không hoạt động.
6. **Background Grid / Interactive Mesh:** nền gợi cấu trúc hạ tầng mạng, tương tác nhẹ và tương phản vừa đủ. So sánh grid bằng CSS/SVG với Retro Grid hoặc canvas; chọn theo hiệu quả thị giác và chi phí render.

Với từng hiệu ứng, trình bày bảng: vị trí → mục đích → trigger → thư viện/component → mức tùy chỉnh → phương án mobile → reduced motion → rủi ro hiệu năng. Mỗi section có một hiệu ứng chủ đạo; phân bố các hiệu ứng thành một câu chuyện thống nhất.

Chuyển cảnh, cuộn chuột, trackpad và vuốt cảm ứng phải tự nhiên. Mặc định giữ cuộn native; nếu dùng pinning hoặc scroll-linked animation, giới hạn ở đoạn có mục đích rõ, không giữ trang hoặc cản điều hướng. Dùng Motion cho micro-interaction/reveal và GSAP khi cần timeline/scrub/pinning; tránh hai hệ thống cùng điều khiển một thuộc tính trên một phần tử.

## 4. Sản phẩm và thương hiệu

Thiết kế lại luồng duyệt sản phẩm để hai trục **loại thiết bị** và **hãng** rõ ràng, có thể kết hợp. Người dùng phải dễ thực hiện các việc:
- Xem toàn bộ một loại thiết bị, ví dụ switch.
- Xem sản phẩm của một hãng.
- Lọc một loại thiết bị trong một hãng cụ thể.
- Tìm bằng tên hoặc mã model rồi vào trang chi tiết.

Dựa trên dữ liệu thực tế để đề xuất danh mục, nhãn và bộ lọc. Cân nhắc số cổng, PoE, tốc độ, chuẩn WiFi hoặc nhu cầu sử dụng chỉ khi có dữ liệu phù hợp; nêu phần cần chuẩn hóa thay vì giả định schema đã hỗ trợ.

Mô tả navigation, trang danh mục, trang hãng, catalog và trang chi tiết; làm rõ mối quan hệ giữa các trang để tránh nội dung trùng lặp. Đề xuất search, bộ lọc desktop/mobile, filter chip, số kết quả, xóa bộ lọc, sắp xếp và phân trang/tải thêm. Bộ lọc nên có trạng thái trong URL để chia sẻ và quay lại đúng kết quả.

Product card cần dễ so sánh: hình ảnh, hãng, tên/model, loại thiết bị, thông số nổi bật và CTA phù hợp. Trang chi tiết có ảnh, thông số, ứng dụng, datasheet nếu có, thông tin bảo hành và liên hệ/báo giá. Không tự thêm giỏ hàng, thanh toán, giá, tồn kho hoặc thông số chưa được xác nhận.

## 5. Tra cứu bảo hành

Làm lại `/bao-hanh` cùng ngôn ngữ thiết kế chung nhưng ưu tiên tốc độ và sự rõ ràng. Form phải dễ thấy ngay khi mở trang, có nhãn, ví dụ mã/serial, nút hành động hoặc cơ chế tra cứu rõ ràng và hướng dẫn ngắn.

Kiểm tra phương thức tra cứu hiện tại trước khi đề xuất thay đổi. Mô tả đầy đủ các trạng thái: ban đầu, nhập sai/thiếu, đang tra cứu, tìm thấy còn bảo hành, hết bảo hành, không tìm thấy và lỗi hệ thống. Chỉ áp dụng trạng thái nghiệp vụ phù hợp dữ liệu thực tế.

Kết quả cần phân cấp rõ thiết bị, mã/serial, ngày mua, hạn bảo hành, trạng thái và bước hỗ trợ tiếp theo; dùng cả chữ và màu cho trạng thái. Chỉ hiển thị dữ liệu cần thiết và cân nhắc che thông tin khách hàng nhạy cảm. Giữ kết nối với API hiện có, tránh request thừa nếu tra cứu theo gõ chữ. Rà soát các nội dung “dữ liệu mẫu” để copy trên giao diện phản ánh đúng cách hệ thống đang hoạt động.

## 6. Yêu cầu triển khai và nghiệm thu

- Đồng bộ navigation, footer và design system cho các trang công khai. Ưu tiên trang chủ, sản phẩm và bảo hành; nêu phạm vi các trang còn lại. Trang admin không nằm trong đợt redesign này.
- Giữ URL, SEO, nội dung, dữ liệu và luồng chức năng hiện có; nếu cần thay đổi phải chỉ rõ lý do, tác động và cách chuyển đổi.
- Phân chia Server/Client Component theo nhu cầu thực tế; tải animation nặng theo khu vực cần dùng, cleanup khi unmount và hạn chế animation ngoài viewport.
- Có phương án responsive, bàn phím, focus, touch target, độ tương phản và `prefers-reduced-motion`. Trạng thái hover không được là cách duy nhất truy cập nội dung.
- Dùng hình ảnh sản phẩm thực tế; kiểm kê asset có sẵn, nêu hình cần bổ sung, tối ưu ảnh và tránh layout shift. Không bịa sản phẩm, thông số, thành tích hoặc testimonial.
- Đề xuất ngân sách hiệu năng và cách đo trên thiết bị di động, thay vì chỉ hứa animation mượt.
- Có bước kiểm tra TypeScript, build, luồng tìm kiếm/lọc, bảo hành, responsive và ảnh chụp trước/sau ở các viewport đại diện.

## 7. Quy trình: /grill-me → /plan

**Giai đoạn 1 — /grill-me:** sau khi đọc dự án, tóm tắt hiện trạng đã xác minh và chỉ hỏi những quyết định ảnh hưởng lớn đến thiết kế. Đặc biệt làm rõ ưu tiên CTA giữa sản phẩm/báo giá/bảo hành; catalog hay mua hàng trực tiếp; người dùng mục tiêu; light/dark; mức độ animation; hình ảnh sẵn có và phạm vi triển khai. Hỏi theo nhóm nhỏ, đưa lựa chọn kèm khuyến nghị và trade-off. Không hỏi lại những thông tin đã có trong prompt hoặc code. Chờ câu trả lời cho các quyết định quan trọng trước khi chốt kế hoạch; ghi rõ giả định còn lại.

**Giai đoạn 2 — /plan:** dựa trên câu trả lời, đưa ra một phương án được khuyến nghị với:
1. Mục tiêu, phạm vi, ưu tiên và giả định.
2. Concept thị giác, design tokens và cách hòa hợp Apple với hiệu ứng công nghệ.
3. Sitemap, luồng sản phẩm/bộ lọc và luồng bảo hành.
4. Storyboard/wireframe bằng chữ cho từng section trang chủ và các màn hình chính; mô tả desktop/mobile cụ thể.
5. Bảng mapping hiệu ứng với component đã có, component cần tùy chỉnh và phần cần xây/thêm.
6. Kiến trúc component, các file/route dự kiến thay đổi và chiến lược chuyển đổi CSS.
7. Các giai đoạn triển khai theo thứ tự, dependencies, độ phức tạp, rủi ro và tiêu chí nghiệm thu đo được.
8. Danh sách quyết định còn thiếu và bước triển khai đầu tiên sau khi tôi duyệt kế hoạch.

Nếu môi trường không hỗ trợ slash command `/grill-me` và `/plan`, thực hiện hai giai đoạn tương đương bằng ngôn ngữ tự nhiên. Không dừng ở việc báo thiếu command. Trả lời bằng tiếng Việt; kế hoạch phải đủ cụ thể để một lập trình viên triển khai, không chỉ liệt kê xu hướng thiết kế. Chưa viết code cho đến khi tôi duyệt kế hoạch.
