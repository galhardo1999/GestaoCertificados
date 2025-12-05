'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getUsers(
    search?: string,
    page: number = 1,
    limit: number = 10
) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const where: any = { role: 'USER', masterUserId: null }

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { cnpj: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ]
    }

    const skip = (page - 1) * limit

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                cnpj: true,
                createdAt: true,
                _count: {
                    select: {
                        certificates: true,
                        clients: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.user.count({ where })
    ])

    return {
        users,
        total,
        totalPages: Math.ceil(total / limit)
    }
}
