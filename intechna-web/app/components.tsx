import Link from 'next/link'
import { commonFaqs, processSteps, siteConfig } from '@/app/data'
import { ContactForm } from '@/components/contact-form'
import { JsonLd } from './JsonLd'
import { breadcrumbSchema } from './lib/seo'

export function CTA() {
  return (
    <section className="section consultation" aria-labelledby="consultation-heading">
      <div className="consultation-grid">
        <div className="consultation-copy">
          <p className="eyebrow">Cùng bắt đầu một kết nối tốt hơn</p>
          <h2 id="consultation-heading">
            Một nhu cầu.
            <br />
            Một phương án rõ ràng.
          </h2>
          <p>
            Chia sẻ hiện trạng và mục tiêu của bạn. Intech sẽ tư vấn thiết bị, cấu hình và phương án
            triển khai phù hợp.
          </p>
          <a className="consultation-phone" href={`tel:${siteConfig.phone}`}>
            {siteConfig.phoneDisplay} <span aria-hidden="true">↗</span>
          </a>
          <p>Hoặc gửi yêu cầu để đội ngũ Intech liên hệ lại.</p>
        </div>
        <ContactForm />
      </div>
    </section>
  )
}

export function ProcessSection() {
  return (
    <section className="section surface">
      <div className="heading">
        <p className="eyebrow">Quy trình triển khai</p>
        <h2>
          Rõ từng bước.
          <br />
          Vững cả hệ thống.
        </h2>
      </div>
      <ol className="process-list">
        {processSteps.map((step) => (
          <li key={step.title}>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function FAQSection() {
  return (
    <section className="section">
      <div className="heading">
        <p className="eyebrow">Thông tin trước triển khai</p>
        <h2>Câu hỏi thường gặp</h2>
      </div>
      <div className="faq-list">
        {commonFaqs.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function Breadcrumbs({
  current,
  parents = [],
  currentPath,
}: {
  current: string
  parents?: Array<{ label: string; href: string }>
  currentPath?: string
}) {
  const ancestors = [{ label: 'Trang chủ', href: '/' }, ...parents]
  return (
    <>
      <nav className="breadcrumbs" aria-label="Đường dẫn trang">
        {ancestors.map((item) => (
          <span className="breadcrumb-parent" key={item.href}>
            <Link href={item.href}>{item.label}</Link>
            <span aria-hidden="true">/</span>
          </span>
        ))}
        <span aria-current="page">{current}</span>
      </nav>
      {currentPath && (
        <JsonLd
          data={breadcrumbSchema([
            ...ancestors.map((item) => ({ name: item.label, path: item.href })),
            { name: current, path: currentPath },
          ])}
        />
      )}
    </>
  )
}
