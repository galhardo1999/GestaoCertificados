import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar */}
            <Sidebar user={session.user} />

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}
