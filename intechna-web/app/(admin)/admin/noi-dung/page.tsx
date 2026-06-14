import { posts } from '@/app/data'
import { ContentAdminClient } from './ContentAdminClient'

export default function AdminContentPage() {
  return (
    <>
      <section className="admin-title"><h1>Quản lý nội dung</h1><p>Thêm bài viết SEO, chỉnh tiêu đề, slug, mô tả và nội dung chính.</p></section>
      <ContentAdminClient posts={posts} />
    </>
  )
}
