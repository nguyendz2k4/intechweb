export const siteConfig = {
  name: 'Công ty Cổ phần Đầu tư và Phát triển Intech',
  shortName: 'Intech',
  domain: 'https://intechna.vn',
  phone: '0395337755',
  phoneDisplay: '0395 337 755',
  email: 'info@intechna.vn',
  address: 'Số 31, ngõ 20, đường Nguyễn Đức Cảnh, phường Thành Vinh, tỉnh Nghệ An',
  description:
    'Intech tư vấn, thiết kế, cung cấp thiết bị và thi công hạ tầng mạng LAN/WAN, firewall, WiFi, server, camera cho doanh nghiệp tại Nghệ An.',
}

export const navItems = [
  ['Trang chủ', '/'],
  ['Giới thiệu', '/gioi-thieu'],
  ['Sản phẩm', '/san-pham'],
  ['Giải pháp', '/giai-phap'],
  ['Dự án', '/du-an'],
  ['Tin tức', '/tin-tuc'],
  ['Bảo hành', '/bao-hanh'],
  ['Liên hệ', '/lien-he'],
] as const

export const products = [
  { title: 'Switch Layer 2/Layer 3', desc: 'Switch core/access, VLAN, PoE, uplink quang, quản trị tập trung cho văn phòng, nhà xưởng và hệ thống nhiều tầng.', models: ['Cisco CBS/Catalyst/Nexus', 'Aruba/HPE Switch', 'Ruijie, H3C, Edgecore'] },
  { title: 'WiFi Access Point doanh nghiệp', desc: 'Access Point WiFi 6/WiFi 6E, controller/cloud, roaming, captive portal và tách mạng khách/nội bộ.', models: ['Aruba AP', 'Cisco/Meraki AP', 'Ruijie, UniFi, Ruckus'] },
  { title: 'Router doanh nghiệp', desc: 'Router WAN, cân bằng tải, định tuyến chi nhánh, VPN site-to-site/remote access và kết nối đa nhà mạng.', models: ['Cisco ISR', 'MikroTik RB/CCR', 'Router VPN doanh nghiệp'] },
  { title: 'Firewall & bảo mật mạng', desc: 'Tường lửa chuyên dụng, NAT, VPN, web filtering, IPS/IDS, phân quyền truy cập và bảo vệ hệ thống doanh nghiệp.', models: ['Fortinet FortiGate', 'Cisco ASA/Firepower/Meraki MX', 'Juniper SRX, Sophos, SonicWall'] },
  { title: 'Module quang & phụ kiện mạng', desc: 'SFP/SFP+/QSFP, DAC cable, patch cord, patch panel, hạt mạng, dây nhảy và vật tư hoàn thiện hạ tầng.', models: ['Module Cisco/HPE/Juniper compatible', 'DAC cable', 'Patch panel, dây nhảy, tủ rack'] },
  { title: 'NAS, server & lưu trữ', desc: 'NAS, máy chủ, lưu trữ tập trung, backup dữ liệu, phân quyền truy cập và phục hồi khi có sự cố.', models: ['Synology NAS', 'QNAP NAS', 'Server/lưu trữ doanh nghiệp'] },
  { title: 'Camera IP & giám sát', desc: 'Camera IP, đầu ghi, lưu trữ, giám sát tập trung, phân quyền xem và truy cập từ xa an toàn.', models: ['Camera IP', 'NVR', 'Lưu trữ camera'] },
  { title: 'Thiết bị phòng họp thông minh', desc: 'Giải pháp trình chiếu không dây, hội nghị trực tuyến, chia sẻ nội dung và tối ưu phòng họp doanh nghiệp.', models: ['Barco ClickShare C/CX', 'Thiết bị hội nghị', 'Màn hình/phụ kiện phòng họp'] },
]

export const productCategories = [
  { slug: 'switch', title: 'Switch mạng doanh nghiệp', description: 'Switch Layer 2/Layer 3, switch PoE, switch core/access cho văn phòng, nhà xưởng, bệnh viện và hệ thống nhiều tầng.', keywords: ['Cisco CBS/Catalyst', 'Aruba/HPE', 'Ruijie', 'H3C', 'Edgecore'], useCases: ['Chia VLAN phòng ban', 'Cấp nguồn PoE cho camera/AP', 'Uplink quang giữa các tầng', 'Quản trị tập trung'] },
  { slug: 'wifi-access-point', title: 'WiFi Access Point doanh nghiệp', description: 'Access Point WiFi 6/WiFi 6E, controller cloud/on-premise, roaming và captive portal cho môi trường nhiều người dùng.', keywords: ['Aruba AP', 'Cisco/Meraki AP', 'Ruijie AP', 'UniFi AP', 'Ruckus AP'], useCases: ['WiFi văn phòng', 'WiFi khách sạn/quán cafe', 'WiFi bệnh viện/phòng khám', 'WiFi nhà xưởng'] },
  { slug: 'router', title: 'Router doanh nghiệp', description: 'Router cân bằng tải, định tuyến WAN, VPN chi nhánh và kết nối đa nhà mạng cho doanh nghiệp.', keywords: ['Cisco ISR', 'MikroTik CCR/RB', 'Router VPN', 'Load balancing'], useCases: ['Kết nối nhiều ISP', 'VPN site-to-site', 'Định tuyến chi nhánh', 'Tối ưu đường truyền'] },
  { slug: 'firewall', title: 'Firewall bảo mật mạng', description: 'Firewall chuyên dụng giúp bảo vệ hệ thống, phân quyền truy cập, VPN, lọc web và giám sát lưu lượng.', keywords: ['Fortinet FortiGate', 'Cisco Firepower/Meraki MX', 'Juniper SRX', 'Sophos', 'SonicWall'], useCases: ['Bảo mật mạng nội bộ', 'VPN làm việc từ xa', 'Tách vùng server/user/guest', 'Kiểm soát truy cập Internet'] },
  { slug: 'module-quang-phu-kien', title: 'Module quang và phụ kiện hạ tầng', description: 'Module SFP/SFP+/QSFP, DAC cable, patch panel, dây nhảy, tủ rack, UPS và vật tư thi công mạng.', keywords: ['SFP/SFP+/QSFP', 'DAC cable', 'Patch panel', 'Tủ rack', 'UPS'], useCases: ['Kết nối quang giữa tầng', 'Kết nối switch core', 'Hoàn thiện tủ rack', 'Chuẩn hóa vật tư bàn giao'] },
  { slug: 'nas-luu-tru', title: 'NAS, server và lưu trữ dữ liệu', description: 'NAS Synology/QNAP, server và giải pháp backup dữ liệu tập trung cho doanh nghiệp.', keywords: ['Synology NAS', 'QNAP NAS', 'Backup dữ liệu', 'Server lưu trữ'], useCases: ['File server nội bộ', 'Backup dữ liệu', 'Lưu trữ camera', 'Phân quyền truy cập'] },
]

export const services = [
  { title: 'Thi công mạng LAN/WAN', desc: 'Khảo sát, thiết kế sơ đồ mạng, kéo cáp, lắp tủ rack, cấu hình switch/router và nghiệm thu hệ thống.' },
  { title: 'Triển khai firewall & VPN', desc: 'Thiết lập firewall, VPN site-to-site, remote access, phân quyền truy cập và tăng cường bảo mật.' },
  { title: 'WiFi doanh nghiệp', desc: 'Thiết kế vùng phủ sóng, tối ưu roaming, chia VLAN, quản trị tập trung và hạn chế nhiễu.' },
  { title: 'Bảo trì hệ thống mạng', desc: 'Kiểm tra định kỳ, xử lý sự cố, cập nhật cấu hình, backup và tối ưu hiệu năng vận hành.' },
  { title: 'Tư vấn hạ tầng CNTT', desc: 'Đề xuất giải pháp phù hợp ngân sách, nhu cầu bảo mật, hiệu năng và khả năng mở rộng.' },
  { title: 'Camera & giám sát', desc: 'Lắp đặt camera IP, lưu trữ, phân quyền xem, kết nối đa điểm và hỗ trợ vận hành.' },
]

export const industrySolutions = [
  { title: 'Thi công mạng LAN văn phòng', desc: 'Thiết kế sơ đồ mạng, kéo cáp, chia VLAN, WiFi roaming và tài liệu bàn giao cho văn phòng doanh nghiệp.' },
  { title: 'Hạ tầng mạng nhà xưởng', desc: 'Triển khai mạng có dây, WiFi vùng phủ rộng, camera IP, tủ rack và kết nối khu vực sản xuất ổn định.' },
  { title: 'Thi công mạng bệnh viện/phòng khám', desc: 'Tư vấn hạ tầng mạng bảo mật, tách vùng truy cập, WiFi khách, camera và ưu tiên hệ thống vận hành liên tục.' },
  { title: 'Giải pháp WiFi doanh nghiệp', desc: 'Khảo sát vùng phủ sóng, bố trí access point, controller, roaming, captive portal và tối ưu trải nghiệm người dùng.' },
]

export const servicePages = [
  { slug: 'thi-cong-mang-lan', title: 'Thi công mạng LAN cho doanh nghiệp', description: 'Khảo sát, thiết kế sơ đồ mạng, kéo cáp, lắp tủ rack, cấu hình switch, chia VLAN và nghiệm thu hệ thống mạng LAN.', keywords: ['thi công mạng LAN', 'thi công mạng văn phòng', 'hạ tầng mạng doanh nghiệp'], deliverables: ['Sơ đồ mạng và sơ đồ tủ rack', 'Danh sách vật tư/thiết bị đề xuất', 'Thi công kéo cáp, đánh nhãn, test line', 'Cấu hình switch, VLAN, IP plan', 'Biên bản nghiệm thu và tài liệu bàn giao'], benefits: ['Hệ thống rõ ràng, dễ quản trị', 'Giảm lỗi do dây/cổng không được chuẩn hóa', 'Dễ mở rộng khi tăng nhân sự hoặc thêm thiết bị'] },
  { slug: 'wifi-doanh-nghiep', title: 'Giải pháp WiFi doanh nghiệp', description: 'Thiết kế vùng phủ sóng, bố trí Access Point, tối ưu roaming, tách mạng khách/nội bộ và quản trị WiFi tập trung.', keywords: ['WiFi doanh nghiệp', 'lắp WiFi văn phòng', 'WiFi roaming'], deliverables: ['Khảo sát vùng phủ sóng', 'Đề xuất số lượng/vị trí AP', 'Cấu hình SSID, VLAN, captive portal', 'Tối ưu roaming và hạn chế nhiễu', 'Bàn giao tài khoản quản trị'], benefits: ['WiFi ổn định hơn cho nhiều người dùng', 'Tách mạng khách và mạng nội bộ an toàn', 'Dễ giám sát và xử lý sự cố'] },
  { slug: 'firewall-vpn', title: 'Triển khai firewall và VPN', description: 'Cấu hình firewall, NAT, policy, VPN site-to-site/remote access, lọc web và phân quyền truy cập cho doanh nghiệp.', keywords: ['triển khai firewall', 'VPN doanh nghiệp', 'bảo mật mạng nội bộ'], deliverables: ['Đánh giá vùng mạng cần bảo vệ', 'Thiết lập policy, NAT, route', 'Cấu hình VPN chi nhánh/người dùng từ xa', 'Phân quyền truy cập theo phòng ban', 'Backup cấu hình và tài liệu quản trị'], benefits: ['Tăng bảo mật hệ thống', 'Quản lý truy cập rõ ràng', 'Hỗ trợ làm việc từ xa và kết nối chi nhánh'] },
  { slug: 'bao-tri-he-thong-mang', title: 'Bảo trì hệ thống mạng định kỳ', description: 'Kiểm tra switch, router, firewall, WiFi, camera, log, backup cấu hình và xử lý sự cố để hệ thống vận hành ổn định.', keywords: ['bảo trì hệ thống mạng', 'bảo trì mạng doanh nghiệp', 'kiểm tra firewall switch WiFi'], deliverables: ['Kiểm tra trạng thái thiết bị', 'Backup cấu hình định kỳ', 'Rà soát log và cảnh báo bất thường', 'Tối ưu WiFi, VLAN, policy firewall', 'Báo cáo hiện trạng và khuyến nghị'], benefits: ['Giảm rủi ro downtime', 'Phát hiện lỗi trước khi ảnh hưởng vận hành', 'Có tài liệu cập nhật để xử lý nhanh khi sự cố'] },
  { slug: 'thi-cong-mang-benh-vien', title: 'Thi công mạng bệnh viện/phòng khám', description: 'Thiết kế hạ tầng mạng cho bệnh viện, phòng khám với yêu cầu bảo mật dữ liệu, WiFi khách, camera và vận hành liên tục.', keywords: ['thi công mạng bệnh viện', 'hạ tầng mạng phòng khám', 'WiFi bệnh viện'], deliverables: ['Tách vùng mạng nhân viên/khách/camera/server', 'Thiết kế VLAN và policy truy cập', 'WiFi khách có kiểm soát', 'Giải pháp camera và lưu trữ', 'Tài liệu bàn giao theo khu vực'], benefits: ['Bảo vệ dữ liệu nội bộ tốt hơn', 'Hạn chế ảnh hưởng giữa các vùng mạng', 'Dễ mở rộng thêm phòng/khoa/thiết bị'] },
  { slug: 'thi-cong-mang-nha-xuong', title: 'Thi công mạng nhà xưởng', description: 'Triển khai mạng LAN, WiFi vùng phủ rộng, camera IP, tủ rack và kết nối khu vực sản xuất cho nhà xưởng.', keywords: ['thi công mạng nhà xưởng', 'WiFi nhà xưởng', 'camera IP nhà xưởng'], deliverables: ['Khảo sát mặt bằng và tuyến cáp', 'Thiết kế vùng phủ WiFi/kết nối xưởng', 'Lắp tủ rack, switch, uplink quang', 'Cấu hình mạng văn phòng/sản xuất/camera', 'Nghiệm thu và đánh nhãn hệ thống'], benefits: ['Kết nối ổn định giữa văn phòng và xưởng', 'Phù hợp môi trường nhiều vật cản/nhiễu', 'Dễ bảo trì khi mở rộng dây chuyền'] },
]

export const solutionPages = [
  { slug: 'mang-van-phong', title: 'Giải pháp mạng văn phòng', description: 'Thiết kế và thi công mạng LAN, WiFi, firewall, camera, máy in, NAS và VPN cho văn phòng doanh nghiệp.', keywords: ['mạng văn phòng', 'thi công mạng LAN văn phòng', 'WiFi văn phòng'], needs: ['Kết nối ổn định cho nhân viên', 'Tách mạng nội bộ và khách', 'Quản lý máy in, camera, NAS', 'VPN làm việc từ xa'], recommended: ['Switch PoE/access', 'WiFi Access Point roaming', 'Firewall/VPN', 'Tủ rack, patch panel, NAS backup'] },
  { slug: 'mang-nha-xuong', title: 'Giải pháp mạng nhà xưởng', description: 'Triển khai hạ tầng mạng, WiFi vùng phủ rộng, camera IP, uplink quang và kết nối khu vực sản xuất.', keywords: ['mạng nhà xưởng', 'WiFi nhà xưởng', 'thi công mạng nhà xưởng'], needs: ['Kết nối nhiều khu vực xa nhau', 'WiFi ổn định trong môi trường nhiều vật cản', 'Camera giám sát nhà xưởng', 'Kết nối văn phòng - kho - sản xuất'], recommended: ['Uplink quang', 'Switch công nghiệp/PoE', 'AP indoor/outdoor', 'Camera IP và lưu trữ NAS/NVR'] },
  { slug: 'mang-benh-vien-phong-kham', title: 'Giải pháp mạng bệnh viện/phòng khám', description: 'Thiết kế mạng bảo mật cho bệnh viện/phòng khám: tách VLAN, WiFi khách, camera, server/NAS và ưu tiên vận hành liên tục.', keywords: ['mạng bệnh viện', 'thi công mạng phòng khám', 'WiFi bệnh viện'], needs: ['Bảo mật dữ liệu nội bộ', 'Tách mạng bệnh nhân/khách/nhân viên', 'Hệ thống camera và lưu trữ', 'Vận hành ổn định nhiều khu vực'], recommended: ['Firewall policy rõ ràng', 'VLAN theo khoa/phòng', 'WiFi controller', 'NAS/server backup'] },
  { slug: 'wifi-khach-san-truong-hoc', title: 'Giải pháp WiFi khách sạn/trường học', description: 'Thiết kế WiFi mật độ cao, roaming, captive portal, chia băng thông và quản trị tập trung cho khách sạn/trường học.', keywords: ['WiFi khách sạn', 'WiFi trường học', 'WiFi mật độ cao'], needs: ['Nhiều người dùng đồng thời', 'Roaming giữa tầng/phòng học', 'Tách mạng khách và quản trị', 'Giới hạn băng thông và kiểm soát truy cập'], recommended: ['AP WiFi 6/6E', 'Controller/cloud management', 'Switch PoE', 'Firewall cân bằng tải'] },
]

export const projectTypes = [
  'Triển khai mạng văn phòng, WiFi roaming, chia VLAN và quản lý truy cập.',
  'Lắp đặt firewall, VPN site-to-site, bảo mật truy cập từ xa cho chi nhánh.',
  'Thi công hệ thống camera IP, lưu trữ tập trung và giám sát đa điểm.',
  'Nâng cấp switch, router, tủ rack, chuẩn hóa dây mạng và tài liệu bàn giao.',
]

export const processSteps = [
  { title: 'Khảo sát hiện trạng', desc: 'Ghi nhận mặt bằng, tuyến cáp, số người dùng, thiết bị sẵn có, điểm nghẽn và yêu cầu vận hành.' },
  { title: 'Thiết kế phương án', desc: 'Đề xuất sơ đồ mạng, VLAN, WiFi, firewall, camera, lưu trữ và danh mục thiết bị theo ngân sách.' },
  { title: 'Thi công & cấu hình', desc: 'Kéo cáp, lắp tủ rack, đánh nhãn, cấu hình switch/router/firewall/AP và kiểm thử từng hạng mục.' },
  { title: 'Nghiệm thu & bàn giao', desc: 'Bàn giao sơ đồ, IP plan, tài khoản quản trị, backup cấu hình, biên bản test và khuyến nghị bảo trì.' },
]

export const handoverItems = [
  'Sơ đồ mạng tổng thể và sơ đồ tủ rack theo vị trí thực tế.',
  'Danh sách IP, VLAN, SSID, policy firewall, VPN và tài khoản quản trị cần bàn giao.',
  'File backup cấu hình switch/router/firewall/controller WiFi nếu thiết bị hỗ trợ.',
  'Biên bản test line, test WiFi, test Internet/VPN/camera và checklist nghiệm thu.',
  'Khuyến nghị bảo trì, lịch kiểm tra định kỳ và phương án mở rộng sau này.',
]

export const commonFaqs = [
  { question: 'Bao lâu có thể có phương án sơ bộ?', answer: 'Với nhu cầu rõ ràng, Intech có thể đưa phương án sơ bộ sau khi nhận thông tin hiện trạng. Dự án phức tạp nên khảo sát trực tiếp để báo giá sát hơn.' },
  { question: 'Có bắt buộc dùng một hãng thiết bị không?', answer: 'Không bắt buộc. Intech ưu tiên cấu hình phù hợp mục tiêu vận hành, ngân sách và khả năng hỗ trợ sau này; có thể phối hợp nhiều hãng nếu hợp lý.' },
  { question: 'Sau thi công có bàn giao tài liệu không?', answer: 'Có. Mục tiêu là khách hàng không bị phụ thuộc vào trí nhớ người thi công: sơ đồ, IP/VLAN, backup cấu hình và checklist nghiệm thu cần được bàn giao rõ.' },
  { question: 'Có hỗ trợ bảo trì hệ thống đã có sẵn không?', answer: 'Có. Intech có thể rà soát hiện trạng, backup cấu hình, chuẩn hóa tài liệu, tối ưu WiFi/firewall/switch và đề xuất nâng cấp theo mức ưu tiên.' },
]

export const warrantyRecords = [
  { code: 'INTECH-2026-0001', serial: 'FGT60F3G26ABC001', customer: 'Công ty TNHH Minh Phát', product: 'Fortinet FortiGate 60F', purchaseDate: '2026-01-12', warrantyUntil: '2027-01-12', status: 'Còn bảo hành', note: 'Bảo hành phần cứng theo chính sách hãng; hỗ trợ kiểm tra cấu hình từ xa.' },
  { code: 'INTECH-2025-0148', serial: 'CBS35024PXYZ148', customer: 'Phòng khám An Bình', product: 'Cisco CBS350-24P-4G', purchaseDate: '2025-08-20', warrantyUntil: '2028-08-20', status: 'Còn bảo hành', note: 'Switch PoE đã bàn giao kèm cấu hình VLAN và file backup.' },
  { code: 'INTECH-2024-0095', serial: 'AP515VN0095', customer: 'Khách sạn Lam River', product: 'Aruba AP-515', purchaseDate: '2024-03-05', warrantyUntil: '2027-03-05', status: 'Còn bảo hành', note: 'Thiết bị thuộc hệ thống WiFi roaming; cần cung cấp vị trí lắp đặt khi yêu cầu hỗ trợ.' },
]

export const posts = [
  {
    slug: 'checklist-trien-khai-mang-lan-van-phong',
    title: 'Checklist thi công mạng LAN cho văn phòng doanh nghiệp',
    description: 'Các hạng mục cần chuẩn bị trước khi thi công mạng LAN văn phòng: khảo sát, thiết kế VLAN, thiết bị, tủ rack và nghiệm thu.'
  },
  {
    slug: 'khi-nao-doanh-nghiep-nen-dung-firewall-chuyen-dung',
    title: 'Khi nào doanh nghiệp nên dùng firewall chuyên dụng?',
    description: 'Dấu hiệu doanh nghiệp nên nâng cấp firewall chuyên dụng để bảo mật, quản lý truy cập, VPN và giám sát lưu lượng mạng.',
  },
  {
    slug: 'wifi-doanh-nghiep-khac-gi-wifi-gia-dinh',
    title: 'WiFi doanh nghiệp khác gì WiFi gia đình?',
    description: 'So sánh WiFi doanh nghiệp với WiFi gia đình qua roaming, controller, VLAN, bảo mật và khả năng chịu tải người dùng.',
  },
  {
    slug: 'thi-cong-mang-benh-vien-phong-kham-can-luu-y-gi',
    title: 'Thi công mạng bệnh viện/phòng khám cần lưu ý gì?',
    description: 'Các điểm quan trọng khi thiết kế hạ tầng mạng cho bệnh viện, phòng khám: bảo mật dữ liệu, WiFi khách, camera, VLAN và khả năng vận hành liên tục.',
  },
  {
    slug: 'bao-tri-he-thong-mang-doanh-nghiep-dinh-ky',
    title: 'Checklist bảo trì hệ thống mạng doanh nghiệp định kỳ',
    description: 'Những việc nên kiểm tra định kỳ để hệ thống mạng ổn định: backup cấu hình, kiểm tra firewall, switch, WiFi, camera, log và tài liệu vận hành.',
  },
]
