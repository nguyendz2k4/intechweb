import Link from 'next/link'
import { CTA, FAQSection, Hero, ProcessSection } from '@/app/components'
import { products, projectTypes, solutionPages } from '@/app/data'
import { productList } from '@/app/products-data'

const trustItems = [
  { title: 'Khảo sát trước khi chốt cấu hình', desc: 'Không chọn thiết bị theo cảm tính. Intech dựa trên mặt bằng, số user, băng thông, vùng phủ WiFi, bảo mật và kế hoạch mở rộng.' },
  { title: 'Bàn giao tài liệu rõ ràng', desc: 'Sau triển khai cần có sơ đồ mạng, sơ đồ tủ rack, IP plan, VLAN, tài khoản quản trị và bản backup cấu hình.' },
  { title: 'Tối ưu cho vận hành lâu dài', desc: 'Hạ tầng mạng tốt không chỉ chạy được ngày đầu, mà còn dễ kiểm tra, dễ thay thế, dễ mở rộng và giảm downtime.' },
]

export default function HomePage() {
  return (
    <main>
      <Hero />
      
      {/* Asymmetric Stats Bar */}
      <section className="section asym-grid-16-10 reveal" aria-label="Năng lực tổng quan" style={{ borderBottom: '1px solid var(--line)', background: 'var(--soft)' }}>
        <div>
          <p className="eyebrow">Thống kê</p>
          <h2 style={{ maxWidth: '480px', margin: 0 }}>Năng lực hạ tầng số đã được chuẩn hóa</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%' }}>
          <div className="liquid-glass" style={{ padding: '24px', borderRadius: '20px' }}>
            <strong className="font-mono" style={{ display: 'block', fontSize: '36px', color: 'var(--blue)', fontWeight: '800' }}>04+</strong>
            <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>Nhóm giải pháp chính</span>
          </div>
          <div className="liquid-glass" style={{ padding: '24px', borderRadius: '20px' }}>
            <strong className="font-mono" style={{ display: 'block', fontSize: '36px', color: 'var(--blue)', fontWeight: '800' }}>24/7</strong>
            <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>Hỗ trợ vận hành hệ thống</span>
          </div>
          <div className="liquid-glass bento-double" style={{ padding: '24px', borderRadius: '20px' }}>
            <strong className="font-mono" style={{ display: 'block', fontSize: '36px', color: 'var(--blue)', fontWeight: '800' }}>100%</strong>
            <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: '600' }}>Tài liệu hóa cấu hình &amp; Thiết kế tối ưu</span>
          </div>
        </div>
      </section>

      {/* About Section: Asymmetric Overlap Layout */}
      <section className="section reveal" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="grid-bg" style={{ opacity: 0.08, transform: 'scale(1.1) rotate(-3deg)', pointerEvents: 'none' }} />
        <div className="asym-grid-2-1" style={{ position: 'relative', zIndex: 1, alignItems: 'center' }}>
          <div style={{ background: 'var(--white)', padding: '48px', borderRadius: '28px', border: '1px solid var(--blue-mid)', boxShadow: 'var(--shadow-lg)', marginTop: '-24px' }}>
            <p className="eyebrow">Về Intech</p>
            <h2 style={{ margin: 0, fontSize: 'clamp(28px, 3vw, 42px)' }}>Năng lực triển khai thực tế, tập trung vào độ ổn định hệ thống</h2>
          </div>
          <div style={{ padding: '20px' }}>
            <p className="lead" style={{ fontSize: '17px', color: 'var(--muted)', lineHeight: '1.8', margin: 0 }}>
              Intech đồng hành cùng khách hàng từ khảo sát, tư vấn, thiết kế, cung cấp thiết bị, thi công đến bảo trì và vận hành. Mục tiêu là tạo ra hệ thống CNTT rõ ràng, dễ quản lý, tối ưu chi phí và sẵn sàng mở rộng.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us: Asymmetric Bento Grid */}
      <section className="section surface reveal">
        <div className="heading">
          <p className="eyebrow">Vì sao chọn Intech</p>
          <h2>Làm hạ tầng mạng theo hướng chắc, rõ và dễ bảo trì</h2>
        </div>
        <div className="bento-grid">
          <article className="card bento-double liquid-glass" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <span className="font-mono" style={{ display: 'block', fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Tiêu chuẩn 01</span>
                <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{trustItems[0].title}</h3>
                <p style={{ fontSize: '16px', color: 'var(--muted)', margin: 0 }}>{trustItems[0].desc}</p>
              </div>
              <div style={{ background: 'var(--blue-light)', border: '1px solid var(--blue-mid)', borderRadius: '16px', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                <strong className="font-mono" style={{ fontSize: '32px', color: 'var(--blue-dark)', fontWeight: '800', lineHeight: 1 }}>100%</strong>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: '600' }}>Khảo sát mặt bằng</span>
              </div>
            </div>
          </article>
          <article className="card liquid-glass" style={{ padding: '32px' }}>
            <span className="font-mono" style={{ display: 'block', fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Tiêu chuẩn 02</span>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{trustItems[1].title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>{trustItems[1].desc}</p>
          </article>
          <article className="card liquid-glass" style={{ padding: '32px' }}>
            <span className="font-mono" style={{ display: 'block', fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '8px' }}>Tiêu chuẩn 03</span>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{trustItems[2].title}</h3>
            <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>{trustItems[2].desc}</p>
          </article>
        </div>
      </section>

      {/* Products Section: Asymmetric Row-List Layout */}
      <section className="section reveal">
        <div className="asym-grid-16-10" style={{ alignItems: 'center' }}>
          <div>
            <p className="eyebrow">Sản phẩm</p>
            <h2 style={{ marginBottom: '20px' }}>Thiết bị mạng, server, camera và phụ kiện hạ tầng</h2>
            <p className="lead" style={{ marginBottom: '32px' }}>
              Catalog hiện có {productList.length} model tham khảo từ các hãng phổ biến, dùng để tư vấn cấu hình và báo giá theo dự án.
            </p>
            <div className="actions" style={{ display: 'flex', gap: '16px' }}>
              <Link className="btn primary" href="/san-pham/catalog">Xem catalog sản phẩm</Link>
              <Link className="btn secondary" href="/lien-he">Liên hệ tư vấn</Link>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            {products.slice(0, 4).map((p) => (
              <div 
                key={p.title} 
                style={{ 
                  padding: '24px 0', 
                  borderTop: '1px solid var(--line)', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px'
                }}
              >
                <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{p.title}</span>
                  <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enterprise</span>
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', margin: 0 }}>{p.desc}</p>
                {'models' in p && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                    {p.models.map((m) => (
                      <span 
                        key={m} 
                        className="font-mono"
                        style={{ 
                          fontSize: '11px', 
                          padding: '3px 8px', 
                          background: 'var(--blue-light)', 
                          color: 'var(--blue-dark)', 
                          borderRadius: '6px', 
                          fontWeight: '600' 
                        }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section: Asymmetric Bento Grid */}
      <section className="section surface reveal">
        <div className="heading">
          <p className="eyebrow">Giải pháp theo ngành</p>
          <h2>Thi công mạng LAN, WiFi và hạ tầng CNTT theo từng mô hình vận hành</h2>
          <p className="lead">Intech định hướng nội dung SEO theo nhu cầu thực tế: văn phòng, nhà xưởng, bệnh viện/phòng khám và hệ thống WiFi doanh nghiệp cần độ ổn định cao.</p>
        </div>
        <div className="bento-grid">
          {/* Featured Solution: Double Width */}
          <article className="card bento-double liquid-glass" style={{ padding: '40px' }}>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Giải pháp trọng tâm</span>
            <h3 style={{ fontSize: '24px', marginBottom: '16px' }}>{solutionPages[0].title}</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '15px' }}>{solutionPages[0].description}</p>
            <div style={{ borderTop: '1px dashed var(--line)', paddingTop: '20px' }}>
              <strong style={{ fontSize: '13px', color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>Thiết bị khuyến nghị:</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {solutionPages[0].recommended.map((rec) => (
                  <span key={rec} style={{ fontSize: '12px', padding: '5px 12px', background: 'var(--white)', border: '1px solid var(--blue-mid)', color: 'var(--blue-dark)', borderRadius: '999px', fontWeight: '600' }}>{rec}</span>
                ))}
              </div>
            </div>
            <Link href={`/giai-phap/${solutionPages[0].slug}`} style={{ display: 'inline-flex', marginTop: '24px', fontWeight: '700', color: 'var(--blue-dark)' }}>
              Xem chi tiết giải pháp →
            </Link>
          </article>

          {/* Regular Solutions */}
          {solutionPages.slice(1, 3).map((item) => (
            <article className="card liquid-glass" key={item.slug} style={{ padding: '32px' }}>
              <span className="font-mono" style={{ fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Mô hình</span>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>{item.title}</h3>
              <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '20px', lineHeight: '1.6' }}>{item.description}</p>
              <Link href={`/giai-phap/${item.slug}`} style={{ fontWeight: '700', color: 'var(--blue-dark)', fontSize: '14px' }}>
                Xem chi tiết →
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Projects Section: Asymmetric Row Layout */}
      <section className="section asym-grid-16-10 reveal" style={{ alignItems: 'center' }}>
        <div>
          <p className="eyebrow">Dự án</p>
          <h2 style={{ margin: 0 }}>Các nhóm dự án Intech có thể triển khai</h2>
        </div>
        <ul className="list" style={{ width: '100%' }}>
          {projectTypes.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>

      <ProcessSection />
      <FAQSection />
      <CTA />
    </main>
  )
}
