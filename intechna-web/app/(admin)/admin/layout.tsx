import type { Metadata } from 'next'
import { requireAdminPage } from '@/app/lib/admin-auth-page'
import { AdminNavigation } from './AdminNavigation'

export const metadata: Metadata = {
  title: 'Quản trị website',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminPage()
  return <AdminNavigation session={session}>{children}</AdminNavigation>
}
