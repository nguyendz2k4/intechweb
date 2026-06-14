import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA, FAQSection } from '@/app/components'
import { productCategories, products } from '@/app/data'

export const metadata: Metadata = {
  title: 'Sản phẩm thiết bị mạng, firewall, WiFi, server, camera',
  description: 'Intech cung cấp switch, router, firewall, WiFi doanh nghiệp, server, lưu trữ, camera và phụ kiện hạ tầng mạng tại Nghệ An.',
  alternates: { canonical: '/san-pham' },
}

export default function ProductsPage() {
  return (
    <main>
      <Breadcrumbs current="Sản phẩm" />
      
      {/* Products Grid Section */}
      <section className="section reveal">
        <div className="asym-grid-16-10" style={{ alignItems: 'flex-start', marginBottom: '56px' }}>
          <div>
            <p className="eyebrow">Sản phẩm</p>
            <h1 style={{ marginBottom: '24px' }}>Thiết bị mạng, WiFi, firewall, lưu trữ và phụ kiện hạ tầng CNTT</h1>
            <p className="lead" style={{ margin: 0 }}>
              Intech xây dựng catalog theo hướng “liên hệ tư vấn/báo giá”, chọn thiết bị dựa trên nhu cầu thực tế, độ ổn định, chi phí, khả năng mở rộng và mức độ hỗ trợ kỹ thuật.
            </p>
          </div>
          <div style={{ alignSelf: 'center', display: 'flex', width: '100%', justifyContent: 'flex-end' }}>
            <Link className="btn primary" href="/san-pham/catalog">Xem catalog model</Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '28px' }}>
          {products.map((p, index) => (
            <article 
              className="card liquid-glass" 
              key={p.title} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                padding: '32px',
                animationDelay: `${index * 100}ms`
              }}
            >
              <div>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Hạ tầng {String(index + 1).padStart(2, '0')}
                </span>
                <h3 style={{ fontSize: '20px', marginBottom: '14px', color: 'var(--ink)' }}>{p.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>{p.desc}</p>
              </div>
              {'models' in p && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', borderTop: '1px dashed var(--line)', paddingTop: '16px', marginTop: 'auto' }}>
                  {p.models.map((model) => (
                    <span 
                      key={model} 
                      className="font-mono"
                      style={{ 
                        fontSize: '11px', 
                        padding: '4px 10px', 
                        background: 'var(--blue-light)', 
                        color: 'var(--blue-dark)', 
                        borderRadius: '6px', 
                        fontWeight: '600' 
                      }}
                    >
                      {model}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      {/* Categories Section */}
      <section className="section surface reveal">
        <div className="heading">
          <p className="eyebrow">Catalog SEO</p>
          <h2>Danh mục thiết bị có thể tách trang để đẩy SEO và chạy quảng cáo</h2>
        </div>
        <div className="bento-grid">
          {productCategories.slice(0, 4).map((item, index) => {
            const isDouble = index === 0 || index === 3
            return (
              <article 
                className={`card liquid-glass ${isDouble ? 'bento-double' : ''}`} 
                key={item.slug} 
                style={{ padding: '36px' }}
              >
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--blue-dark)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>
                  Phân nhóm SEO
                </span>
                <h3 style={{ fontSize: isDouble ? '24px' : '20px', marginBottom: '14px' }}>{item.title}</h3>
                <p style={{ color: 'var(--muted)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>{item.description}</p>
                <Link 
                  href={`/san-pham/${item.slug}`} 
                  style={{ 
                    fontWeight: '700', 
                    color: 'var(--blue-dark)', 
                    fontSize: '14px', 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Xem danh mục</span>
                  <span>→</span>
                </Link>
              </article>
            )
          })}
        </div>
      </section>
      
      <FAQSection />
      <CTA />
    </main>
  )
}
