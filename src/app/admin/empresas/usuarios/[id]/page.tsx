import { getTeamMembers } from '@/actions/team-actions'
import { AddTeamMemberModal } from '@/components/add-team-member-modal'
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
import { CompanyHeader } from '@/components/admin/company-header'

export default async function CompanyUsersPage({ params }: { params: { id: string } }) {
    const users = await getTeamMembers(params.id)

    return (
        <div className="p-8 space-y-8">
            <CompanyHeader companyId={params.id} activeTab="users" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Usuários da Empresa</h2>
                    <AddTeamMemberModal companyId={params.id} />
                </div>

                <div className="rounded-md border bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nome</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Data de Cadastro</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell className="font-medium">
                                        {user.name}
                                        {user.id === params.id && (
                                            <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                                                Principal
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        {format(user.createdAt, "d 'de' MMMM 'de' yyyy", {
                                            locale: ptBR,
                                        })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <UserActions
                                            user={user}
                                            label={user.id === params.id ? 'Empresa' : 'Usuário'}
                                            isMainUser={user.id === params.id}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhum usuário adicional cadastrado.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    )
}
