import { getPlans } from '@/actions/plan-actions'
import { CreatePlanModal } from '@/components/admin/create-plan-modal'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { PlanActions } from '@/components/admin/plan-actions'
import { SearchInput } from '@/components/shared/search-input'
import { Pagination } from '@/components/shared/pagination'
import { Badge } from '@/components/ui/badge'

export default async function PlansPage({
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

    const { plans, total, totalPages } = await getPlans(query, page, limit)

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Planos</h1>
                    <p className="text-muted-foreground">
                        Gerencie os planos disponíveis no sistema.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchInput className="w-[500px]" />
                    <CreatePlanModal />
                </div>
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Total: {total} plano{total !== 1 ? 's' : ''}
                </div>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead>Lim. Usuários</TableHead>
                            <TableHead>Lim. Clientes</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {plans.map((plan: any) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.code}</TableCell>
                                <TableCell>{plan.name}</TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                    }).format(plan.price)}
                                </TableCell>
                                <TableCell>
                                    {plan.limiteUsuarios === 0 ? 'Ilimitado' : plan.limiteUsuarios}
                                </TableCell>
                                <TableCell>
                                    {plan.limiteClientes === 0 ? 'Ilimitado' : plan.limiteClientes}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={plan.active ? 'default' : 'secondary'}>
                                        {plan.active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <PlanActions plan={plan} />
                                </TableCell>
                            </TableRow>
                        ))}
                        {plans.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    Nenhum plano encontrado.
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
