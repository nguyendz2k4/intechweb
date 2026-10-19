import Image from 'next/image'
import Link from 'next/link'
import { CTA } from '@/app/components'
import { siteConfig, solutionPages } from '@/app/data'
import { JsonLd } from '@/app/JsonLd'
import { pageMetadata, webPageSchema } from '@/app/lib/seo'
import { HomeMotion } from '@/components/home-motion'
import { WarrantyCheck } from './bao-hanh/WarrantyCheck'
import '@/app/home.css'

const homeTitle = 'Thi công mạng LAN/WAN, Firewall, WiFi tại Nghệ An'

export const metadata = pageMetadata({
  title: homeTitle,
  description: siteConfig.description,
  path: '/',
})

const hardware = [
  {
    category: 'Core switching',
    title: 'Kết nối mọi tầng mạng.',
    detail: 'Switch core & access',
    image: 'core-switch',
    href: '/san-pham/catalog?category=switch',
  },
  {
    category: 'Power over Ethernet',
    title: 'Một cáp. Hai nhiệm vụ.',
    detail: 'Switch PoE cho AP & camera',
    image: 'poe-switch',
    href: '/san-pham/catalog?category=switch&q=PoE',
  },
  {
    category: 'Wireless',
    title: 'Vùng phủ rộng. Kết nối liền.',
    detail: 'WiFi doanh nghiệp',
    image: 'wifi-ap',
    href: '/san-pham/catalog?category=wifi-access-point',
  },
  {
    category: 'Network security',
    title: 'Bảo vệ từ lõi hệ thống.',
    detail: 'Firewall & VPN',
    image: 'firewall',
    href: '/san-pham/catalog?category=firewall',
  },
  {
    category: 'Data storage',
    title: 'Dữ liệu luôn sẵn sàng.',
    detail: 'NAS & backup tập trung',
    image: 'nas',
    href: '/san-pham/catalog?category=nas-luu-tru',
  },
]
const capabilities = [
  {
    number: '01',
    title: 'Bắt đầu từ hiện trạng.',
    text: 'Khảo sát mặt bằng, số người dùng và nhu cầu vận hành trước khi chọn cấu hình.',
    className: 'capability-survey',
  },
  {
    number: '02',
    title: 'Bàn giao rõ ràng.',
    text: 'Sơ đồ mạng, IP plan, VLAN và bản sao cấu hình. Đội IT dễ dàng tiếp quản.',
    className: 'capability-document',
  },
  {
    number: '03',
    title: 'An toàn từ thiết kế.',
    text: 'Tách vùng truy cập, cấu hình firewall và giám sát để phát hiện sớm sự cố.',
    className: 'capability-security',
  },
  {
    number: '04',
    title: 'Đầu tư đúng nhu cầu.',
    text: 'Tận dụng thiết bị hiện có. Chọn năng lực phù hợp và dành chỗ cho mở rộng.',
    className: 'capability-cost',
  },
]
const solutionLabels = [
  'Văn phòng thông minh',
  'Nhà xưởng sản xuất',
  'Y tế & phòng khám',
  'Khách sạn & trường học',
]
const solutionImages = ['router', 'poe-switch', 'firewall', 'wifi-ap']
const statement =
  'Chúng tôi không chỉ bán thiết bị. Chúng tôi xây dựng sự ổn định và an tâm cho toàn bộ hệ thống CNTT của bạn.'

export default function HomePage() {
  return (
    <main className="home-page">
      <JsonLd
        data={webPageSchema({ name: homeTitle, description: siteConfig.description, path: '/' })}
      />
      <HomeMotion />
      <section className="home-hero">
        <div className="home-container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">INTECH · NETWORK & INFRASTRUCTURE</p>
            <h1>
              Hạ tầng mạng
              <br />
              chuẩn mực.
              <br />
              <span>Cho doanh nghiệp.</span>
            </h1>
            <p className="hero-lead">
              Từ thiết bị đúng đến một hệ thống vững. Intech đồng hành cùng bạn trong từng kết nối.
            </p>
            <div className="actions">
              <Link className="btn primary" href="/san-pham/catalog">
                Khám phá thiết bị <span aria-hidden="true">↗</span>
              </Link>
              <Link className="text-link" href="/bao-gia">
                Yêu cầu tư vấn <span aria-hidden="true">›</span>
              </Link>
            </div>
            <p className="hero-note">Khảo sát kỹ. Thiết kế rõ. Vận hành bền.</p>
          </div>
          <figure className="hero-hardware">
            <Image
              src="/images/hardware/infrastructure.webp"
              alt="Render minh họa switch, firewall và WiFi Access Point doanh nghiệp"
              width={1536}
              height={1024}
              priority
              fetchPriority="high"
              sizes="(max-width: 800px) calc(100vw - 44px), 60vw"
            />
            <figcaption>
              <span className="hardware-marker" /> Thiết bị mạng. Một hệ sinh thái.
            </figcaption>
          </figure>
        </div>
        <div className="hero-index home-container">
          <span>01 / HẠ TẦNG KẾT NỐI</span>
          <span>
            Khám phá cùng Intech <span aria-hidden="true">↓</span>
          </span>
        </div>
      </section>

      <section className="topology-section" aria-labelledby="topology-heading">
        <div className="home-container">
          <div className="section-heading">
            <p className="eyebrow">Từ lõi mạng đến từng điểm chạm</p>
            <h2 id="topology-heading">
              Mọi kết nối.
              <br />
              <span>Một thiết kế nhất quán.</span>
            </h2>
            <p>
              Internet, bảo mật, mạng nội bộ và WiFi hoạt động trong cùng một kiến trúc rõ ràng, dễ
              mở rộng.
            </p>
          </div>
          <div className="topology">
            <svg
              className="topology-cables"
              viewBox="0 0 1100 170"
              fill="none"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <path className="cable-base" d="M140 85 H360 M360 85 H550 M550 85 H950" />
              <path
                className="cable-flow"
                d="M140 85 H360 M360 85 H550 M550 85 H950"
                pathLength="1"
              />
            </svg>
            {[
              ['WAN', 'Internet', null],
              ['SECURITY', 'Firewall', 'firewall'],
              ['CORE', 'Switch', 'core-switch'],
              ['ACCESS', 'WiFi & thiết bị', 'wifi-ap'],
            ].map(([label, title, image]) => (
              <div className="topology-node" key={label}>
                {image ? (
                  <Image
                    src={`/images/hardware/${image}.webp`}
                    width={320}
                    height={213}
                    alt={`Minh họa ${title}`}
                    sizes="(max-width: 640px) 140px, 220px"
                  />
                ) : (
                  <div className="internet-node" aria-hidden="true">
                    <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="1">
                      <circle cx="40" cy="40" r="28" />
                      <ellipse cx="40" cy="40" rx="12" ry="28" />
                      <path d="M12 40h56M17 24h46M17 56h46" />
                    </svg>
                  </div>
                )}
                <small>{label}</small>
                <h3>{title}</h3>
              </div>
            ))}
          </div>
          <p className="topology-caption">
            Sơ đồ kiến trúc minh họa. Cấu hình thực tế được thiết kế theo từng dự án.
          </p>
        </div>
      </section>

      <section className="capabilities-section">
        <div className="home-container">
          <div className="section-heading">
            <p className="eyebrow">Cách Intech triển khai</p>
            <h2>
              Chắc từ thiết kế.
              <br />
              <span>Rõ đến bàn giao.</span>
            </h2>
          </div>
          <div className="capabilities-grid">
            {capabilities.map((item) => (
              <article key={item.number} className={`capability ${item.className}`} data-spotlight>
                <div className="capability-top">
                  <span className="technical-label">TIÊU CHUẨN {item.number}</span>
                  <span aria-hidden="true">↗</span>
                </div>
                <div className="capability-art" aria-hidden="true">
                  {item.number === '01' ? (
                    <>
                      <span className="plan-line" />
                      <span className="plan-line" />
                      <span className="plan-point" />
                      <span className="plan-point" />
                      <span className="plan-point" />
                    </>
                  ) : item.number === '02' ? (
                    <div className="document-art">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  ) : item.number === '03' ? (
                    <div className="security-art">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <div className="cost-art">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  )}
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="hardware-showcase" aria-labelledby="showcase-heading">
        <div className="home-container">
          <div className="showcase-heading">
            <div>
              <p className="eyebrow">Dải thiết bị chọn lọc</p>
              <h2 id="showcase-heading">
                Công nghệ đúng.
                <br />
                <span>Khả năng rộng mở.</span>
              </h2>
            </div>
            <Link className="text-link" href="/san-pham/catalog">
              Toàn bộ catalog <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div
          className="showcase-viewport"
          tabIndex={0}
          role="region"
          aria-label="Các dòng thiết bị, có thể cuộn ngang"
        >
          <div className="showcase-track">
            {hardware.map((item, index) => (
              <article className="showcase-card" key={item.image}>
                <div className="showcase-card-top">
                  <p>{item.category}</p>
                  <span>0{index + 1}</span>
                </div>
                <h3>{item.title}</h3>
                <Image
                  src={`/images/hardware/${item.image}.webp`}
                  width={640}
                  height={427}
                  alt={`Render minh họa ${item.detail}`}
                  sizes="(max-width: 640px) 85vw, 380px"
                />
                <div className="showcase-card-bottom">
                  <p>{item.detail}</p>
                  <Link href={item.href}>
                    Khám phá <span aria-hidden="true">↗</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
        <div className="home-container showcase-footer">
          <p>
            Vuốt hoặc cuộn để khám phá <span aria-hidden="true">→</span>
          </p>
          <div className="showcase-progress" aria-hidden="true">
            <span />
          </div>
          <small>Hình ảnh minh họa dòng thiết bị</small>
        </div>
      </section>

      <section className="solutions-section">
        <div className="home-container">
          <div className="section-heading">
            <p className="eyebrow">Giải pháp theo ngành</p>
            <h2>
              Mỗi doanh nghiệp.
              <br />
              <span>Một hạ tầng phù hợp.</span>
            </h2>
          </div>
          <div className="solution-stack">
            {solutionPages.map((solution, index) => (
              <article className="solution-card" key={solution.slug}>
                <div className="solution-copy">
                  <p className="technical-label">GIẢI PHÁP / 0{index + 1}</p>
                  <h3>{solutionLabels[index]}</h3>
                  <p>{solution.description}</p>
                  <ul>
                    {solution.needs.slice(0, 3).map((need) => (
                      <li key={need}>{need}</li>
                    ))}
                  </ul>
                  <Link className="text-link" href={`/giai-phap/${solution.slug}`}>
                    Khám phá giải pháp <span aria-hidden="true">↗</span>
                  </Link>
                </div>
                <div className="solution-visual">
                  <Image
                    src={`/images/hardware/${solutionImages[index]}.webp`}
                    width={640}
                    height={427}
                    alt={`Thiết bị minh họa cho ${solutionLabels[index]}`}
                    sizes="(max-width: 800px) 90vw, 520px"
                  />
                  <span className="solution-visual-label">THIẾT KẾ THEO NHU CẦU THỰC TẾ</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="statement-section">
        <div className="home-container">
          <p className="eyebrow">Cam kết của Intech</p>
          <h2 className="scrub-text" aria-label={statement}>
            {statement.split(' ').map((word, index) => (
              <span aria-hidden="true" key={index}>
                {word}{' '}
              </span>
            ))}
          </h2>
          <Link className="text-link" href="/gioi-thieu">
            Tìm hiểu về Intech <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="quick-warranty">
        <div className="home-container">
          <p className="eyebrow">Luôn đồng hành sau bàn giao</p>
          <h2>
            Thiết bị của bạn.
            <br />
            <span>Bảo hành rõ ràng.</span>
          </h2>
          <p>Tra cứu bằng mã phiếu hoặc serial. Nhanh chóng và riêng tư.</p>
          <WarrantyCheck />
          <Link className="text-link" href="/bao-hanh">
            Đến trang bảo hành <span aria-hidden="true">›</span>
          </Link>
        </div>
      </section>
      <CTA />
    </main>
  )
}
