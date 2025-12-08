import { prisma } from '@/lib/prisma'
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { SearchInput } from '@/components/shared/search-input'
import { Pagination } from '@/components/shared/pagination'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function getAuditLogs(user: { id: string, masterUserId: string | null }, search: string, page: number, limit: number) {
    const ownerId = user.masterUserId || user.id

    const where: any = {
        usuario: {
            OR: [
                { id: ownerId },
                { usuarioMestreId: ownerId }
            ]
        }
    }

    if (search) {
        where.AND = [
            {
                OR: [
                    { usuario: { nome: { contains: search, mode: 'insensitive' } } },
                    { usuario: { email: { contains: search, mode: 'insensitive' } } },
                    { detalhes: { contains: search, mode: 'insensitive' } },
                    { acao: { contains: search, mode: 'insensitive' } },
                    { entidade: { contains: search, mode: 'insensitive' } },
                ]
            }
        ]
    }

    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
        prisma.logAuditoria.findMany({
            where,
            include: {
                usuario: {
                    select: { nome: true, email: true }
                }
            },
            orderBy: { criadoEm: 'desc' },
            skip,
            take: limit,
        }),
        prisma.logAuditoria.count({ where }),
    ])

    return {
        logs,
        total,
        totalPages: Math.ceil(total / limit),
    }
}

export default async function AuditPage({
    searchParams,
}: {
    searchParams?: {
        q?: string
        page?: string
    }
}) {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
        redirect('/login')
    }

    const query = searchParams?.q || ''
    const page = Number(searchParams?.page) || 1
    const limit = 20

    const { logs, total, totalPages } = await getAuditLogs({
        id: session.user.id,
        masterUserId: session.user.masterUserId || null
    }, query, page, limit)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Logs de Auditoria</h1>
                    <p className="text-muted-foreground">
                        Histórico detalhado de ações realizadas no sistema.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchInput className="max-w-md" />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Total: {total} registro{total !== 1 ? 's' : ''}
                </div>
            </div>

            <AuditLogTable logs={logs as any} />

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
            />
        </div>
    )
}
