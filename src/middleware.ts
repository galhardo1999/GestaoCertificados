import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
    function middleware(req) {
        if (
            req.nextUrl.pathname.startsWith('/admin') &&
            req.nextauth.token?.role !== 'ADMIN'
        ) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        if (req.nextUrl.pathname === '/login' && req.nextauth.token) {
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                if (req.nextUrl.pathname === '/login') return true
                return !!token
            },
        },
    }
)

export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*', '/login'],
}
