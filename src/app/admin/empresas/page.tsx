import { getUsers } from '@/actions/admin-actions'
import { CreateUserModal } from '@/components/create-user-modal'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UserActions } from '@/components/admin/user-actions'
import Link from 'next/link'
import { CompanyRow } from '@/components/admin/company-row'

import { SearchInput } from '@/components/search-input'
import { Pagination } from '@/components/pagination'

export default async function UsersPage({
    searchParams,
}: {
    searchParams?: {
        q?: string
        page?: string
    }
}) {
    const query = searchParams?.q || ''
    const page = Number(searchParams?.page) || 1
    const limit = 10

    const { users, total, totalPages } = await getUsers(query, page, limit) as { users: any[], total: number, totalPages: number }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="text-muted-foreground">
                        Gerencie as empresas cadastradas no sistema.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchInput />
                    <CreateUserModal />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Total: {total} empresa{total !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Data de Cadastro</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead className="text-center">Clientes</TableHead>
                            <TableHead className="text-center">Certificados</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <CompanyRow key={user.id} user={user} />
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhuma empresa encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                itemsPerPage={limit}
            />
        </div>
    )
}
