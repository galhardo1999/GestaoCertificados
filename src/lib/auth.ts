import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Email e senha são obrigatórios')
                }

                const user = await prisma.usuario.findUnique({
                    where: {
                        email: credentials.email,
                    },
                })

                if (!user || !user.senha) {
                    throw new Error('Credenciais inválidas')
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.senha
                )

                if (!isPasswordValid) {
                    throw new Error('Credenciais inválidas')
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.nome,
                    role: user.funcao,
                    masterUserId: user.usuarioMestreId,
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.role = user.role
                token.masterUserId = user.masterUserId
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.role = token.role as string
                session.user.masterUserId = token.masterUserId as string | null
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
