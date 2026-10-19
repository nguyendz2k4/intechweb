import { posts } from '@/app/data'
import { ContentAdminClient } from './ContentAdminClient'
import { requireAdminPage } from '@/app/lib/admin-auth-page'

export default async function AdminContentPage() {
  await requireAdminPage('posts:read')
  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Nội dung website</p>
        <h1>Bài viết</h1>
        <p>
          Soạn thảo, lưu bản nháp và xuất bản bài viết. Tiêu đề và mô tả tìm kiếm dùng cùng dữ liệu
          đang hiển thị cho khách hàng.
        </p>
      </section>
      <ContentAdminClient posts={posts} />
    </>
  )
}
