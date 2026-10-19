import { productPriceLabel } from '@/app/lib/product-fields'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { getCatalogProductBySlug, getRelatedCatalogProducts } from '@/app/catalog-data'
import {
  catalogCategoryName,
  catalogCategoryPath,
  catalogProductPath,
  catalogSlug,
  productImageSource,
} from '@/app/catalog-utils'
import { siteConfig } from '@/app/data'
import { JsonLd } from '@/app/JsonLd'
import { pageMetadata } from '@/app/lib/seo'
import { productSchema } from '@/app/lib/catalog-seo'
import { ProductPlaceholder } from '@/app/ProductPlaceholder'
import { ProductImage } from '../ProductImage'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = await getCatalogProductBySlug(slug)
  if (!product) notFound()
  return pageMetadata({
    title: `${product.name} – ${catalogCategoryName(product.categorySlug, [product])}`,
    description: `${product.summary ?? ''} Liên hệ Intech để tư vấn cấu hình và báo giá ${product.name}.`,
    path: catalogProductPath(product.slug),
    image: productImageSource(product.imageUrl) || undefined,
  })
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await getCatalogProductBySlug(slug)
  if (!product) notFound()
  const categoryName = catalogCategoryName(product.categorySlug, [product])
  const categoryPath = catalogCategoryPath(product.categorySlug, [product])
  const related = await getRelatedCatalogProducts(product.slug, product.categorySlug, product.brand)
  return (
    <main className="catalog-page">
      <JsonLd data={productSchema(product)} />
      <Breadcrumbs
        current={product.name}
        currentPath={catalogProductPath(product.slug)}
        parents={[
          { label: 'Sản phẩm', href: '/san-pham' },
          { label: categoryName, href: categoryPath },
        ]}
      />
      <section className="section catalog-detail-hero">
        <div className="catalog-detail-visual">
          {product.imageUrl ? (
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              width={960}
              height={560}
              sizes="(max-width: 800px) 88vw, 570px"
              priority
              fallback={
                <ProductPlaceholder
                  brand={product.brand}
                  categorySlug={product.categorySlug}
                  name={product.name}
                />
              }
            />
          ) : (
            <ProductPlaceholder
              brand={product.brand}
              categorySlug={product.categorySlug}
              name={product.name}
            />
          )}
          <p>
            {product.imageUrl
              ? product.name
              : 'Minh họa dòng thiết bị. Hình dáng và số cổng thực tế tùy model.'}
          </p>
        </div>
        <div className="catalog-detail-copy">
          <p className="eyebrow">
            <Link href={`/thuong-hieu/${catalogSlug(product.brand)}`}>{product.brand}</Link> /{' '}
            {categoryName}
          </p>
          <h1>{product.name}</h1>
          <div className="catalog-badges">
            {(product.badges ?? []).map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
          <p className="lead">{product.summary}</p>
          <div className="catalog-price-row">
            <div>
              <span>Giá sản phẩm</span>
              <strong>{productPriceLabel(product.priceVnd)}</strong>
            </div>
          </div>
          <div className="actions">
            <Link className="btn primary" href="/lien-he">
              Liên hệ <span aria-hidden="true">↗</span>
            </Link>
            <a className="catalog-text-link" href={`tel:${siteConfig.phone}`}>
              Tư vấn kỹ thuật <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="catalog-detail-download">
            {product.datasheetUrl ? (
              <a
                className="catalog-text-link"
                href={product.datasheetUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tải datasheet PDF <span aria-hidden="true">↓</span>
                <span className="sr-only">, mở tab mới</span>
              </a>
            ) : (
              <p>Liên hệ Intech để xác nhận cấu hình và tài liệu kỹ thuật của model.</p>
            )}
            <Link href={categoryPath} className="catalog-text-link">
              Xem cùng danh mục <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </section>
      <section className="section catalog-spec-section" id="thong-so">
        <div className="catalog-section-heading">
          <div>
            <p className="eyebrow">Hiểu rõ trước khi chọn</p>
            <h2>Thông tin cấu hình.</h2>
          </div>
          <span>Nội dung tham khảo theo model</span>
        </div>
        <div className="catalog-spec-layout">
          <div className="catalog-spec-sheet">
            <h3>Đặc điểm kỹ thuật & triển khai</h3>
            {(product.specs ?? []).length ? (
              <ol>
                {(product.specs ?? []).map((spec, index) => (
                  <li key={spec}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    <p>{spec}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p>
                Thông số model đang được cập nhật. Kỹ sư Intech sẽ xác nhận cấu hình cho yêu cầu của
                bạn.
              </p>
            )}
          </div>
          <div className="catalog-application-sheet">
            <h3>Phù hợp cho nhu cầu</h3>
            <ul>
              {(product.applications ?? []).map((application) => (
                <li key={application}>
                  <span aria-hidden="true">↗</span>
                  {application}
                </li>
              ))}
            </ul>
            <p>
              Cấu hình, khả năng tương thích và phương án triển khai được xác nhận theo hiện trạng
              thực tế.
            </p>
          </div>
        </div>
      </section>
      {related.length > 0 && (
        <section className="section catalog-related">
          <div className="catalog-section-heading">
            <div>
              <p className="eyebrow">Cùng hệ sinh thái</p>
              <h2>Khám phá thêm.</h2>
            </div>
            <Link
              className="catalog-text-link"
              href={`/san-pham/catalog?brand=${catalogSlug(product.brand)}&category=${product.categorySlug}`}
            >
              Xem tất cả <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="catalog-related-grid">
            {related.map((item) => (
              <Link href={catalogProductPath(item.slug)} key={item.slug}>
                <ProductPlaceholder
                  brand={item.brand}
                  categorySlug={item.categorySlug}
                  name={item.name}
                />
                <span>{item.brand}</span>
                <h3>{item.name}</h3>
                <span className="catalog-text-link">
                  Khám phá <span aria-hidden="true">↗</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <CTA />
    </main>
  )
}
