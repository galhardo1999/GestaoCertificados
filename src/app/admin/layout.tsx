import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check authentication and role
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/login')
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <AdminSidebar />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
