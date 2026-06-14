import './App.css'

const products = [
  'Switch Layer 2/Layer 3',
  'Router & Firewall',
  'WiFi doanh nghiệp',
  'Server & lưu trữ',
  'Camera giám sát',
  'Phụ kiện mạng'
]

const services = [
  {
    title: 'Thi công LAN/WAN',
    desc: 'Khảo sát, thiết kế, kéo cáp, lắp tủ rack, cấu hình switch/router và nghiệm thu hệ thống.'
  },
  {
    title: 'Bảo trì & vận hành',
    desc: 'Kiểm tra định kỳ, xử lý sự cố, tối ưu hiệu năng và giám sát hoạt động hạ tầng mạng.'
  },
  {
    title: 'Tư vấn hệ thống CNTT',
    desc: 'Đề xuất mô hình phù hợp ngân sách, bảo mật, khả năng mở rộng và nhu cầu vận hành thực tế.'
  }
]

const projects = [
  'Triển khai mạng văn phòng, WiFi roaming và phân quyền VLAN',
  'Lắp đặt firewall, VPN site-to-site và bảo mật truy cập từ xa',
  'Hệ thống camera IP, lưu trữ tập trung và giám sát đa điểm'
]

function App() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Intech home">
          <span className="brand-mark">I</span>
          <span>
            <strong>INTECH</strong>
            <small>Network & Infrastructure</small>
          </span>
        </a>
        <nav>
          <a href="#about">Giới thiệu</a>
          <a href="#products">Sản phẩm</a>
          <a href="#services">Dịch vụ</a>
          <a href="#projects">Dự án</a>
          <a href="#contact">Liên hệ</a>
        </nav>
      </header>

      <section id="home" className="hero-section">
        <div className="hero-content">
          <p className="eyebrow">Công ty Cổ phần Đầu tư và Phát triển Intech</p>
          <h1>Giải pháp hạ tầng mạng chuyên nghiệp cho doanh nghiệp</h1>
          <p className="hero-text">
            Intech tư vấn, cung cấp thiết bị và triển khai hệ thống LAN/WAN, firewall, switch,
            WiFi, server, camera với định hướng ổn định – bảo mật – dễ vận hành.
          </p>
          <div className="hero-actions">
            <a className="btn primary" href="tel:0395337755">Gọi 0395 337 755</a>
            <a className="btn secondary" href="#services">Xem dịch vụ</a>
          </div>
        </div>
        <div className="hero-card">
          <div className="network-orbit">
            <span></span><span></span><span></span><span></span>
          </div>
          <h2>LAN/WAN • Firewall • WiFi • Server</h2>
          <p>Thiết kế đúng nhu cầu, triển khai gọn, tài liệu rõ ràng, hỗ trợ lâu dài.</p>
        </div>
      </section>

      <section className="stats" aria-label="Năng lực tổng quan">
        <div><strong>4+</strong><span>Nhóm giải pháp chính</span></div>
        <div><strong>24/7</strong><span>Định hướng hỗ trợ hệ thống</span></div>
        <div><strong>Gold</strong><span>Phong cách uy tín, hiện đại</span></div>
      </section>

      <section id="about" className="section split">
        <div>
          <p className="eyebrow">Về Intech</p>
          <h2>Năng lực triển khai thực tế, tập trung vào độ ổn định hệ thống</h2>
        </div>
        <p>
          Intech đồng hành cùng khách hàng từ bước khảo sát, tư vấn, thiết kế, cung cấp thiết bị,
          thi công đến bảo trì và vận hành. Mục tiêu là tạo ra hệ thống CNTT rõ ràng, dễ quản lý,
          tối ưu chi phí và sẵn sàng mở rộng khi doanh nghiệp phát triển.
        </p>
      </section>

      <section id="products" className="section">
        <div className="section-heading">
          <p className="eyebrow">Sản phẩm</p>
          <h2>Thiết bị mạng, server, camera và phụ kiện hạ tầng</h2>
        </div>
        <div className="product-grid">
          {products.map((item) => <article key={item}>{item}</article>)}
        </div>
      </section>

      <section id="services" className="section surface">
        <div className="section-heading">
          <p className="eyebrow">Dịch vụ</p>
          <h2>Dịch vụ chính</h2>
        </div>
        <div className="card-grid">
          {services.map((service) => (
            <article className="service-card" key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="projects" className="section split">
        <div>
          <p className="eyebrow">Dự án</p>
          <h2>Một số nhóm dự án đã triển khai</h2>
        </div>
        <ul className="project-list">
          {projects.map((project) => <li key={project}>{project}</li>)}
        </ul>
      </section>

      <section className="section news">
        <div className="section-heading">
          <p className="eyebrow">Tin tức / bài viết</p>
          <h2>Chia sẻ kiến thức hạ tầng mạng</h2>
        </div>
        <div className="card-grid">
          <article><h3>Checklist triển khai mạng văn phòng</h3><p>Các hạng mục nên chuẩn bị trước khi thi công.</p></article>
          <article><h3>Khi nào nên dùng firewall chuyên dụng?</h3><p>Dấu hiệu hệ thống cần nâng cấp bảo mật.</p></article>
          <article><h3>WiFi doanh nghiệp khác gì WiFi gia đình?</h3><p>Roaming, controller, VLAN và quản trị tập trung.</p></article>
        </div>
      </section>

      <section id="contact" className="section contact-section">
        <div>
          <p className="eyebrow">Liên hệ</p>
          <h2>Sẵn sàng tư vấn giải pháp phù hợp cho dự án của bạn</h2>
          <div className="contact-info">
            <p><strong>Điện thoại:</strong> <a href="tel:0395337755">0395 337 755</a></p>
            <p><strong>Email:</strong> <a href="mailto:info@intechna.vn">info@intechna.vn</a></p>
            <p><strong>Địa chỉ:</strong> Số 31, ngõ 20, đường Nguyễn Đức Cảnh, phường Thành Vinh, tỉnh Nghệ An</p>
          </div>
        </div>
        <form className="contact-form">
          <input placeholder="Họ và tên" />
          <input placeholder="Số điện thoại" />
          <input placeholder="Email" />
          <textarea placeholder="Nhu cầu tư vấn / nội dung dự án" rows={5}></textarea>
          <button type="button" className="btn primary">Gửi thông tin</button>
        </form>
      </section>

      <footer>
        <strong>INTECH</strong>
        <span>© 2026 Công ty Cổ phần Đầu tư và Phát triển Intech. All rights reserved.</span>
      </footer>
    </main>
  )
}

export default App
