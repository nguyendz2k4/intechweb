import { articleBlocks } from './public-posts-data'

type ArticleSection = { title: string; body: string }

const sections: Record<string, ArticleSection[]> = {
  'checklist-trien-khai-mang-lan-van-phong': [
    {
      title: '1. Khảo sát hiện trạng trước khi mua thiết bị',
      body: 'Kiểm kê mặt bằng, số lượng người dùng, thiết bị hiện có, tuyến cáp, tủ rack, đường Internet và các ứng dụng quan trọng. Ghi lại nhu cầu WiFi, camera, VPN và khả năng tăng nhân sự để lập danh mục vật tư phù hợp.',
    },
    {
      title: '2. Thiết kế sơ đồ mạng và phân vùng truy cập',
      body: 'Chuẩn bị sơ đồ kết nối, kế hoạch địa chỉ IP, VLAN cho nhân viên, khách, camera và server. Thống nhất quyền truy cập giữa các vùng mạng và quy ước đặt tên thiết bị trước khi cấu hình.',
    },
    {
      title: '3. Chọn thiết bị theo nhu cầu vận hành',
      body: 'Đối chiếu số cổng mạng, nhu cầu PoE, uplink, băng thông Internet, vùng phủ WiFi và cách quản trị với thông số từng model. Tính cả vật tư, giấy phép, bảo hành và khả năng mở rộng trong ngân sách.',
    },
    {
      title: '4. Thi công, đánh nhãn và nghiệm thu',
      body: 'Kiểm tra từng tuyến cáp, đánh nhãn hai đầu dây, chuẩn hóa tủ rack và lưu bản cấu hình. Nghiệm thu Internet, VLAN, WiFi, VPN, camera, máy in và ứng dụng nội bộ theo yêu cầu đã thống nhất.',
    },
    {
      title: '5. Bàn giao tài liệu và kế hoạch bảo trì',
      body: 'Bàn giao sơ đồ, danh sách thiết bị, IP/VLAN, kết quả kiểm tra và bản sao cấu hình. Xác định người tiếp nhận, cách báo sự cố, lịch rà soát thiết bị và quy trình ghi nhận thay đổi sau triển khai.',
    },
  ],
  'khi-nao-doanh-nghiep-nen-dung-firewall-chuyen-dung': [
    {
      title: '1. Rà soát yêu cầu kiểm soát truy cập',
      body: 'Liệt kê những nhóm người dùng, máy chủ và ứng dụng cần được bảo vệ. Khi doanh nghiệp cần quản lý quyền truy cập theo phòng ban, tách mạng khách hoặc ghi nhận lưu lượng để xử lý sự cố, hãy đánh giá khả năng của thiết bị đang dùng.',
    },
    {
      title: '2. Xác định nhu cầu VPN và kết nối chi nhánh',
      body: 'Làm rõ số người dùng từ xa, số chi nhánh và ứng dụng cần truy cập. Đề xuất firewall phải tính cả việc xác thực người dùng, phân quyền, lưu nhật ký và người chịu trách nhiệm quản lý tài khoản VPN.',
    },
    {
      title: '3. Đối chiếu tính năng và giấy phép từng model',
      body: 'Kiểm tra thông số theo chế độ sử dụng thực tế, số cổng, khả năng quản trị và các dịch vụ bảo mật cần giấy phép. Không mặc định mọi tính năng đều có sẵn hoặc giữ nguyên hiệu năng khi bật nhiều chức năng cùng lúc.',
    },
    {
      title: '4. Chuẩn bị policy và phương án chuyển đổi',
      body: 'Trước khi thay thiết bị, ghi lại kết nối Internet, địa chỉ IP, NAT, rule, VPN và các ứng dụng quan trọng. Chuẩn bị bản sao cấu hình, thời gian chuyển đổi, kế hoạch kiểm tra và phương án khôi phục khi phát sinh lỗi.',
    },
    {
      title: '5. Duy trì việc vận hành sau bàn giao',
      body: 'Firewall cần được theo dõi và điều chỉnh cùng với thay đổi của hệ thống. Thống nhất lịch rà soát rule, tài khoản VPN, giấy phép, cảnh báo và bản sao cấu hình; phân công người tiếp nhận các sự cố bảo mật.',
    },
  ],
  'wifi-doanh-nghiep-khac-gi-wifi-gia-dinh': [
    {
      title: '1. Chọn theo mật độ người dùng và mặt bằng',
      body: 'WiFi văn phòng, khách sạn hoặc trường học cần được thiết kế theo số người dùng đồng thời, ứng dụng, vật cản và vị trí lắp đặt. Một thiết bị phù hợp cho gia đình chưa chắc đáp ứng được nhu cầu của nhiều khu vực trong doanh nghiệp.',
    },
    {
      title: '2. Quản trị nhiều Access Point',
      body: 'Khi sử dụng nhiều AP, doanh nghiệp nên xem xét cách quản trị tập trung, theo dõi trạng thái và cập nhật cấu hình. Controller tại chỗ hoặc nền tảng cloud là các lựa chọn cần đối chiếu với từng model và chi phí giấy phép.',
    },
    {
      title: '3. Tách WiFi khách và mạng nội bộ',
      body: 'Xác định những thiết bị và ứng dụng mà từng nhóm được phép truy cập. Kiểm tra khả năng kết hợp SSID, VLAN và firewall trên toàn hệ thống; việc đặt tên WiFi riêng cần đi kèm cấu hình phân quyền phù hợp.',
    },
    {
      title: '4. Kiểm tra trải nghiệm khi di chuyển',
      body: 'Với người dùng di chuyển giữa phòng hoặc tầng, cần kiểm tra vùng phủ và khả năng chuyển kết nối bằng các thiết bị thực tế. Không chỉ dựa vào tên tính năng roaming trên tài liệu mà bỏ qua cấu hình, mặt bằng và thiết bị đầu cuối.',
    },
    {
      title: '5. Nghiệm thu và theo dõi sau triển khai',
      body: 'Thống nhất vị trí đo, ứng dụng kiểm thử, số người dùng dự kiến và tiêu chí bàn giao. Lưu sơ đồ AP, SSID/VLAN, tài khoản quản trị và kết quả kiểm tra để thuận tiện xử lý vùng sóng yếu hoặc thay đổi nhu cầu.',
    },
  ],
  'thi-cong-mang-benh-vien-phong-kham-can-luu-y-gi': [
    {
      title: '1. Khảo sát theo từng khu vực sử dụng',
      body: 'Làm rõ nhu cầu của quầy tiếp nhận, phòng khám, khu làm việc, camera và hệ thống máy chủ. Ghi lại ứng dụng đang sử dụng, vị trí thiết bị, tuyến cáp và các khung giờ phù hợp để triển khai mà hạn chế ảnh hưởng vận hành.',
    },
    {
      title: '2. Phân vùng truy cập rõ ràng',
      body: 'Xác định quyền truy cập cho nhân viên, khách, camera và máy chủ. Sơ đồ VLAN và policy cần được thống nhất với người phụ trách hệ thống, đồng thời kiểm tra các kết nối mà ứng dụng chuyên môn cần sử dụng.',
    },
    {
      title: '3. Thiết kế WiFi theo mặt bằng thực tế',
      body: 'Khảo sát vị trí AP, vật cản và mật độ người dùng ở các khu vực chờ hoặc làm việc. Kiểm tra WiFi khách riêng với mạng nội bộ và xác định cách quản trị, cấp quyền, theo dõi khi có sự cố.',
    },
    {
      title: '4. Lập kế hoạch chuyển đổi và nghiệm thu',
      body: 'Thống nhất thời gian thi công, đầu mối liên hệ, hạng mục có thể gián đoạn và phương án khôi phục. Nghiệm thu kết nối của từng ứng dụng, máy in, camera và khu vực sử dụng cùng với người phụ trách tại cơ sở.',
    },
    {
      title: '5. Bàn giao và quản lý thay đổi',
      body: 'Bàn giao sơ đồ mạng, vị trí cổng, danh sách thiết bị, cấu hình và quy trình hỗ trợ. Mỗi lần thêm thiết bị hoặc thay đổi quyền truy cập cần được ghi nhận để đội vận hành có thể tra cứu và xử lý sự cố.',
    },
  ],
  'bao-tri-he-thong-mang-doanh-nghiep-dinh-ky': [
    {
      title: '1. Kiểm kê thiết bị và trạng thái vận hành',
      body: 'Đối chiếu danh sách switch, router, firewall, AP, camera và lưu trữ với hiện trạng. Ghi lại thiết bị mất kết nối, cổng bất thường, cảnh báo, lỗi người dùng phản ánh và những thay đổi kể từ lần kiểm tra trước.',
    },
    {
      title: '2. Lưu cấu hình và kiểm tra tài liệu',
      body: 'Tạo bản sao cấu hình theo quy trình được thống nhất, kiểm tra nơi lưu và quyền truy cập. Cập nhật sơ đồ mạng, IP/VLAN, vị trí cổng và thông tin bàn giao sau các lần thay thiết bị hoặc mở rộng hệ thống.',
    },
    {
      title: '3. Rà soát firewall, VPN và tài khoản',
      body: 'Kiểm tra nhật ký, rule, tài khoản từ xa và các dịch vụ đang dùng. Đối chiếu với nhu cầu hiện tại, ghi nhận mục cần điều chỉnh và thống nhất thời điểm thực hiện với người phụ trách trước khi thay đổi cấu hình.',
    },
    {
      title: '4. Kiểm tra WiFi, camera và lưu trữ',
      body: 'Kiểm tra trải nghiệm kết nối ở các vị trí sử dụng thực tế, trạng thái AP, camera và dung lượng lưu trữ. Với hệ thống sao lưu, rà soát kết quả tác vụ và kế hoạch kiểm tra khôi phục theo yêu cầu của doanh nghiệp.',
    },
    {
      title: '5. Lập báo cáo và ưu tiên xử lý',
      body: 'Tổng hợp tình trạng thiết bị, công việc đã thực hiện, vấn đề còn tồn tại và phương án đề xuất. Phân loại theo mức ảnh hưởng, người xử lý và thời gian dự kiến để khách hàng chủ động quyết định việc bảo trì hoặc nâng cấp.',
    },
  ],
}

export function staticArticleSections(slug: string): ArticleSection[] {
  return sections[slug] ?? []
}

export function publicArticleContent(post: { slug: string; body: string }) {
  const sections = post.body.trim() ? [] : staticArticleSections(post.slug)
  const blocks = articleBlocks(post.body)
  const body = sections.length
    ? sections.map((section) => `${section.title}\n${section.body}`).join('\n\n')
    : blocks.map((block) => block.text).join('\n\n')
  return { sections, blocks, body }
}
