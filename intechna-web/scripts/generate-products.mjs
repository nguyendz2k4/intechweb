import fs from 'node:fs'

const brandModels = {
  Cisco: {
    categorySlug: 'switch', category: 'Switch / Router / Firewall',
    models: ['CBS110-8T-D', 'CBS110-16T-EU', 'CBS110-24T-EU', 'CBS250-8T-D', 'CBS250-16T-2G', 'CBS250-24T-4G', 'CBS250-24P-4G', 'CBS250-48T-4G', 'CBS350-8T-E-2G', 'CBS350-16T-2G', 'CBS350-24T-4G', 'CBS350-24P-4G', 'CBS350-48T-4G', 'CBS350-48P-4G', 'C1000-8T-2G-L', 'C1000-16T-2G-L', 'C1000-24T-4G-L', 'C1000-24P-4G-L', 'C1000-48T-4G-L', 'C9200L-24T-4G-E', 'C9200L-24P-4G-E', 'C9200L-48T-4G-E', 'C9200L-48P-4G-E', 'C9200-24T-E', 'C9200-24P-E', 'C9300L-24T-4G-A', 'C9300L-24P-4G-E', 'C9300L-48T-4G-A', 'C9300L-48P-4G-E', 'C9300-24T-A', 'C9300-24P-E', 'C9300-48T-A', 'C9300-48P-E', 'C9407R', 'N9K-C93180YC-FX', 'N9K-C9332C', 'ISR1111-4P', 'ISR1111-8P', 'ISR4221/K9', 'ISR4321/K9', 'ISR4331/K9', 'ISR4351/K9', 'ISR4431/K9', 'ISR4451-X/K9', 'ASA5506-K9', 'ASA5516-K9', 'FPR1010-NGFW-K9', 'FPR1120-NGFW-K9', 'FPR2110-NGFW-K9', 'Meraki MX84']
  },
  Aruba: {
    categorySlug: 'wifi-access-point', category: 'WiFi / Switch',
    models: ['AP-303', 'AP-305', 'AP-315', 'AP-325', 'AP-335', 'AP-345', 'AP-365', 'AP-375', 'AP-505', 'AP-505H', 'AP-503H', 'AP-515', 'AP-535', 'AP-555', 'AP-565', 'AP-575', 'AP-577', 'AP-615', 'AP-635', 'AP-655', 'AP-675', 'IAP-305', 'IAP-315', 'IAP-325', 'IAP-335', 'Instant On AP11', 'Instant On AP12', 'Instant On AP15', 'Instant On AP17', 'Instant On AP22', 'Instant On AP25', 'CX 6000 12G', 'CX 6000 24G', 'CX 6000 48G', 'CX 6100 24G', 'CX 6100 48G', 'CX 6200F 24G', 'CX 6200F 48G', 'CX 6300M 24G', 'CX 6300M 48G', 'CX 6405', 'CX 6400', '2530-24G', '2530-48G', '2930F-24G', '2930F-48G', '3810M-24G', '3810M-48G', '5406R zl2', 'J4859D SFP']
  },
  Fortinet: {
    categorySlug: 'firewall', category: 'Firewall',
    models: ['FortiGate 30E', 'FortiGate 40F', 'FortiGate 50E', 'FortiGate 60E', 'FortiGate 60F', 'FortiGate 70F', 'FortiGate 80E', 'FortiGate 80F', 'FortiGate 90G', 'FortiGate 100E', 'FortiGate 100F', 'FortiGate 120G', 'FortiGate 200E', 'FortiGate 200F', 'FortiGate 201F', 'FortiGate 300E', 'FortiGate 400E', 'FortiGate 400F', 'FortiGate 500E', 'FortiGate 600E', 'FortiGate 600F', 'FortiGate 800D', 'FortiGate 900D', 'FortiGate 1000D', 'FortiGate 1000F', 'FortiGate 1500D', 'FortiGate 1800F', 'FortiGate 2000E', 'FortiGate 3000D', 'FortiGate 3000F', 'FortiWiFi 40F', 'FortiWiFi 60F', 'FortiAP 221E', 'FortiAP 231F', 'FortiAP 431F', 'FortiAP 432F', 'FortiSwitch 108E', 'FortiSwitch 124E', 'FortiSwitch 148E', 'FortiSwitch 224E', 'FortiSwitch 248E', 'FortiAnalyzer 100F', 'FortiAnalyzer 200F', 'FortiManager 200F', 'FortiClient EMS', 'FortiToken 200', 'FortiGate VM01', 'FortiGate VM02', 'FortiGate VM04', 'FortiGate VM08']
  },
  MikroTik: {
    categorySlug: 'router', category: 'Router / Switch',
    models: ['hEX RB750Gr3', 'hEX S RB760iGS', 'hAP ac2', 'hAP ac3', 'hAP ax2', 'hAP ax3', 'RB2011UiAS-2HnD-IN', 'RB3011UiAS-RM', 'RB4011iGS+RM', 'RB5009UG+S+IN', 'RB5009UPr+S+IN', 'RB1100AHx4', 'CCR1009-7G-1C-1S+', 'CCR1016-12G', 'CCR1036-8G-2S+', 'CCR1072-1G-8S+', 'CCR2004-1G-12S+2XS', 'CCR2004-16G-2S+', 'CCR2116-12G-4S+', 'CCR2216-1G-12XS-2XQ', 'CRS305-1G-4S+IN', 'CRS309-1G-8S+IN', 'CRS310-8G+2S+IN', 'CRS312-4C+8XG-RM', 'CRS317-1G-16S+RM', 'CRS326-24G-2S+RM', 'CRS328-24P-4S+RM', 'CRS354-48G-4S+2Q+RM', 'CRS510-8XS-2XQ-IN', 'CSS326-24G-2S+RM', 'LHG LTE6 kit', 'SXT LTE6 kit', 'wAP LTE kit', 'cAP ac', 'cAP ax', 'Audience', 'L009UiGS-RM', 'L009UiGS-2HaxD-IN', 'RB260GS', 'RB260GSP', 'NetMetal ac2', 'NetBox 5 ax', 'LtAP LTE6 kit', 'Chateau LTE12', 'Chateau 5G', 'Metal 52 ac', 'mANTBox 52 15s', 'OmniTIK 5 ac', 'Cube 60G ac', 'Wireless Wire']
  },
  Ruijie: {
    categorySlug: 'wifi-access-point', category: 'WiFi / Switch',
    models: ['RG-AP820-L(V2)', 'RG-AP820-L(V3)', 'RG-AP810-L', 'RG-AP850-I', 'RG-AP850-AR', 'RG-AP880-I', 'RG-AP180', 'RG-AP180-L', 'RG-AP130(W2)', 'RG-AP130(L)', 'RG-EW1200G PRO', 'RG-EW1800GX PRO', 'RG-EW3000GX PRO', 'RG-RAP2200(E)', 'RG-RAP2260(G)', 'RG-RAP2260(H)', 'RG-RAP6260(G)', 'RG-RAP6262(G)', 'RG-RAP6260(H)', 'RG-RAP72Pro', 'RG-ES05G', 'RG-ES08G', 'RG-ES108GD', 'RG-ES110GDS-P', 'RG-ES116G', 'RG-ES126GS-P', 'RG-ES209GC-P', 'RG-ES218GC-P', 'RG-ES226GC-P', 'RG-NBS3100-8GT2SFP', 'RG-NBS3100-24GT4SFP', 'RG-NBS3200-24GT4XS', 'RG-NBS5200-24GT4XS', 'RG-NBS5200-48GT4XS', 'RG-S2910-24GT4XS-E', 'RG-S2910-48GT4XS-E', 'RG-S5750C-28GT4XS-H', 'RG-S6120-20XS4VS2QXS', 'RG-EG105G', 'RG-EG105G-P', 'RG-EG209GS', 'RG-EG210G-P', 'RG-EG310GH-P-E', 'RG-EG3250', 'RG-EG3230', 'RG-EG5210-J', 'RG-EG3220', 'RG-EG3230-P', 'RG-MACC', 'Reyee Cloud']
  },
  UniFi: {
    categorySlug: 'wifi-access-point', category: 'WiFi / Switch / Gateway',
    models: ['U6 Lite', 'U6+', 'U6 Long-Range', 'U6 Pro', 'U6 Enterprise', 'U6 Mesh', 'U6 In-Wall', 'U7 Pro', 'U7 Pro Max', 'U7 Outdoor', 'UAP-AC-Lite', 'UAP-AC-LR', 'UAP-AC-Pro', 'UAP-nanoHD', 'UAP-FlexHD', 'UAP-AC-M', 'UAP-AC-M-Pro', 'UniFi Express', 'Dream Router', 'Dream Machine', 'Dream Machine Pro', 'Dream Machine SE', 'Cloud Gateway Ultra', 'Cloud Gateway Max', 'USW-Lite-8-PoE', 'USW-Lite-16-PoE', 'USW-24', 'USW-24-PoE', 'USW-48', 'USW-48-PoE', 'USW-Pro-24', 'USW-Pro-24-PoE', 'USW-Pro-48', 'USW-Pro-48-PoE', 'USW-Aggregation', 'USW-Pro-Aggregation', 'Switch Flex Mini', 'Switch Flex', 'Switch Enterprise 8 PoE', 'Switch Enterprise 24 PoE', 'Switch Enterprise 48 PoE', 'UXG-Lite', 'UXG-Pro', 'UNVR', 'UNVR-Pro', 'G4 Bullet', 'G5 Bullet', 'G5 Dome', 'AI Bullet', 'AI Pro']
  },
  Juniper: {
    categorySlug: 'firewall', category: 'Firewall / Switch',
    models: ['SRX300', 'SRX320', 'SRX340', 'SRX345', 'SRX380', 'SRX550M', 'SRX1500', 'SRX4100', 'SRX4200', 'SRX4600', 'SRX5400', 'SRX5600', 'SRX5800', 'EX2300-24T', 'EX2300-24P', 'EX2300-48T', 'EX2300-48P', 'EX3400-24T', 'EX3400-24P', 'EX3400-48T', 'EX3400-48P', 'EX4100-24T', 'EX4100-24P', 'EX4100-48T', 'EX4100-48P', 'EX4300-24T', 'EX4300-48T', 'EX4400-24T', 'EX4400-48T', 'EX4650-48Y', 'QFX5100-48S', 'QFX5100-48T', 'QFX5110-48S', 'QFX5120-32C', 'QFX5120-48Y', 'QFX5200-32C', 'QFX5210-64C', 'QFX5220-32CD', 'QFX10002', 'QFX10008', 'Mist AP12', 'Mist AP32', 'Mist AP33', 'Mist AP43', 'Mist AP45', 'Mist AP47', 'Mist AP63', 'Mist AP64', 'Mist Edge', 'Session Smart Router']
  },
  Synology: {
    categorySlug: 'nas-luu-tru', category: 'NAS / Storage',
    models: ['DS223j', 'DS223', 'DS224+', 'DS423', 'DS423+', 'DS723+', 'DS923+', 'DS1522+', 'DS1621+', 'DS1821+', 'DS1823xs+', 'DS2422+', 'DS3622xs+', 'RS422+', 'RS822+', 'RS822RP+', 'RS1221+', 'RS1221RP+', 'RS2423+', 'RS2423RP+', 'RS2821RP+', 'RS3621xs+', 'RS3621RPxs', 'RS4021xs+', 'FS2500', 'FS3410', 'FS6400', 'SA3200D', 'SA3400D', 'SA3610', 'SA3621', 'SA6400', 'UC3200', 'DVA1622', 'DVA3221', 'BeeStation', 'BC500', 'TC500', 'RX418', 'DX517', 'RX1222sas', 'RX1217', 'RX1217RP', 'E10G18-T1', 'E10G21-F2', 'M2D20', 'RKS-02', 'SAT5210 SSD', 'HAT3300 HDD', 'HAT5300 HDD']
  },
  QNAP: {
    categorySlug: 'nas-luu-tru', category: 'NAS / Storage',
    models: ['TS-133', 'TS-233', 'TS-262', 'TS-264', 'TS-364', 'TS-431K', 'TS-431X3', 'TS-433', 'TS-462', 'TS-464', 'TS-664-8G', 'TS-832PX', 'TS-932PX', 'TS-1232PXU-RP', 'TS-1655-8G', 'TS-h973AX', 'TS-h987XU-RP', 'TS-h1277XU-RP', 'TS-h1887XU-RP', 'TS-h2287XU-RP', 'TVS-h474', 'TVS-h674', 'TVS-h874', 'TVS-h1288X', 'TVS-h1688X', 'TVS-472XT', 'TVS-672XT', 'TVS-872XT', 'TS-873A', 'TS-1273AU-RP', 'TS-1673AU-RP', 'TS-2483XU-RP', 'TS-431XeU', 'TS-453E', 'TS-653D', 'TS-853DU-RP', 'TR-004', 'TL-D800C', 'TL-D1600S', 'QSW-1105-5T', 'QSW-2104-2T', 'QSW-M2108-2C', 'QSW-M408-4C', 'QSW-M5216-1T', 'QHora-301W', 'QHora-322', 'QMiro-201W', 'QNA-UC5G1T', 'QXG-10G1T']
  },
  Barco: {
    categorySlug: 'module-quang-phu-kien', category: 'Thiết bị phòng họp',
    models: ['ClickShare C-5 Gen 2', 'ClickShare C-10 Gen 2 1 Button', 'ClickShare C-10 Gen 2 2 Buttons', 'ClickShare CX-20 Gen 2', 'ClickShare CX-30 Gen 2', 'ClickShare CX-50 Gen 2', 'ClickShare CX-50 Gen 2 Premium', 'ClickShare Bar Core', 'ClickShare Bar Pro', 'ClickShare Button USB-C', 'ClickShare Tray', 'ClickShare Tray + 2 Buttons', 'ClickShare Conference Button', 'ClickShare USB-C Button Pack', 'ClickShare CSE-200+', 'ClickShare CSE-800', 'ClickShare CS-100', 'ClickShare CX-20 Set', 'ClickShare CX-30 Set', 'ClickShare CX-50 Set', 'ClickShare C-5 Meeting Room Kit', 'ClickShare C-10 Meeting Room Kit', 'ClickShare Bar Core Kit', 'ClickShare Bar Pro Kit', 'ClickShare Button Gen 4', 'ClickShare Tray Gen 4', 'ClickShare USB-C Button Single', 'ClickShare USB-C Button Duo', 'ClickShare HDMI cable kit', 'ClickShare power adapter', 'ClickShare wall mount', 'ClickShare room dock', 'ClickShare collaboration kit', 'ClickShare wireless presentation kit', 'ClickShare small meeting room', 'ClickShare medium meeting room', 'ClickShare large meeting room', 'ClickShare huddle room kit', 'ClickShare training room kit', 'ClickShare boardroom kit', 'ClickShare executive room kit', 'ClickShare BYOD kit', 'ClickShare BYOM kit', 'ClickShare camera integration kit', 'ClickShare speakerphone kit', 'ClickShare display integration', 'ClickShare USB peripheral kit', 'ClickShare dongle replacement', 'ClickShare accessory pack', 'ClickShare service pack']
  },
}

const categoryCopy = {
  switch: {
    badges: ['Switch', 'Network', 'Enterprise'],
    summary: 'Thiết bị chuyển mạch dùng cho hạ tầng mạng doanh nghiệp, hỗ trợ kết nối ổn định, chia VLAN và mở rộng hệ thống.',
    specs: ['Tư vấn theo số lượng port và uplink', 'Phù hợp core/access/distribution', 'Hỗ trợ VLAN, QoS, quản trị tập trung', 'Có thể kết hợp module quang, tủ rack, patch panel'],
    applications: ['Thi công mạng LAN văn phòng', 'Nhà xưởng nhiều khu vực', 'Bệnh viện/trường học/khách sạn']
  },
  'wifi-access-point': {
    badges: ['WiFi', 'Roaming', 'Business'],
    summary: 'Thiết bị WiFi doanh nghiệp dùng để phủ sóng ổn định, quản trị tập trung và tách mạng khách/nội bộ.',
    specs: ['Tư vấn theo diện tích và mật độ user', 'Hỗ trợ nhiều SSID/VLAN', 'Có thể quản trị cloud/controller', 'Tối ưu roaming và vùng phủ sóng'],
    applications: ['WiFi văn phòng', 'WiFi nhà xưởng', 'WiFi bệnh viện/phòng khám']
  },
  router: {
    badges: ['Router', 'VPN', 'WAN'],
    summary: 'Router doanh nghiệp dùng cho định tuyến, cân bằng tải, VPN chi nhánh và kết nối đa nhà mạng.',
    specs: ['Tư vấn theo số đường truyền và tải người dùng', 'Hỗ trợ routing/VPN/firewall cơ bản', 'Phù hợp head office hoặc chi nhánh', 'Có thể cấu hình backup đường truyền'],
    applications: ['Kết nối chi nhánh', 'VPN làm việc từ xa', 'Cân bằng tải Internet']
  },
  firewall: {
    badges: ['Firewall', 'VPN', 'Security'],
    summary: 'Thiết bị bảo mật mạng dùng để kiểm soát truy cập, VPN, lọc web, bảo vệ server và phân tách vùng mạng.',
    specs: ['Tư vấn theo số user và băng thông', 'Hỗ trợ policy, NAT, VPN', 'Có thể triển khai IPS/web filtering', 'Backup cấu hình và bàn giao tài liệu'],
    applications: ['Bảo mật mạng doanh nghiệp', 'VPN chi nhánh', 'Tách VLAN server/user/guest']
  },
  'module-quang-phu-kien': {
    badges: ['Accessory', 'Infrastructure', 'Uplink'],
    summary: 'Thiết bị/phụ kiện hạ tầng dùng để hoàn thiện kết nối mạng, phòng họp, uplink quang hoặc hệ thống phụ trợ.',
    specs: ['Tư vấn theo chuẩn kết nối', 'Phù hợp tủ rack/phòng họp/uplink', 'Có thể kết hợp trong gói thi công', 'Bàn giao rõ model và vị trí lắp đặt'],
    applications: ['Hoàn thiện tủ rack', 'Kết nối uplink quang', 'Phòng họp doanh nghiệp']
  },
  'nas-luu-tru': {
    badges: ['NAS', 'Storage', 'Backup'],
    summary: 'Thiết bị lưu trữ tập trung dùng cho file server, backup dữ liệu, phân quyền truy cập và lưu trữ camera.',
    specs: ['Tư vấn theo dung lượng và số user', 'Hỗ trợ RAID/backup/snapshot tùy model', 'Phân quyền truy cập dữ liệu', 'Có thể kết hợp UPS và mạng 10G'],
    applications: ['File server nội bộ', 'Backup dữ liệu doanh nghiệp', 'Lưu trữ camera']
  },
}

function slugify(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const products = Object.entries(brandModels).flatMap(([brand, info]) =>
  info.models.slice(0, 50).map((model) => {
    const copy = categoryCopy[info.categorySlug]
    return {
      slug: slugify(`${brand}-${model}`),
      name: `${brand} ${model}`,
      brand,
      category: info.category,
      categorySlug: info.categorySlug,
      badges: copy.badges,
      summary: `${copy.summary} Model ${model} được đưa vào catalog tham khảo để Intech tư vấn cấu hình và báo giá theo hiện trạng thực tế.`,
      specs: copy.specs,
      applications: copy.applications,
    }
  })
)

const content = `export type Product = {\n  slug: string\n  name: string\n  brand: string\n  category: string\n  categorySlug: string\n  badges: string[]\n  summary: string\n  specs: string[]\n  applications: string[]\n}\n\nexport const productList: Product[] = ${JSON.stringify(products, null, 2)}\n`

fs.writeFileSync('app/products-data.ts', content)
console.log(`Generated ${products.length} products across ${Object.keys(brandModels).length} brands`)
