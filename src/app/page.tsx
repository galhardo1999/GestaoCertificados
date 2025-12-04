import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export default async function Home() {
    const session = await getServerSession(authOptions)

    // Redirect to dashboard if logged in, otherwise to login
    if (session) {
        redirect('/dashboard')
    } else {
        redirect('/login')
    }
}
