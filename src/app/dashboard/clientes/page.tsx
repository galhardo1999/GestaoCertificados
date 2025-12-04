import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Building2, Shield, Pencil, Trash2 } from 'lucide-react'
import { CreateClientModal } from '@/components/create-client-modal'
import { getClients } from '@/actions/client-actions'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { calculateDaysRemaining, formatDateBR } from '@/lib/utils'

import { SearchInput } from '@/components/search-input'
import { SortableHeader } from '@/components/sortable-header'
import { Pagination } from '@/components/pagination'
import { EditClientModal } from '@/components/edit-client-modal'
import { DeleteClientDialog } from '@/components/delete-client-dialog'
import { ClientsTable } from '@/components/clients-table'

export default async function ClientesPage({
    searchParams,
}: {
    searchParams?: {
        q?: string
        sort?: string
        order?: 'asc' | 'desc'
        page?: string
        limit?: string
    }
}) {
    const session = await getServerSession(authOptions)
    const userId = session!.user.masterUserId || session!.user.id
    const query = searchParams?.q || ''
    const sort = searchParams?.sort || 'expirationDate'
    const order = searchParams?.order || 'asc'
    const page = Number(searchParams?.page) || 1
    const limit = Number(searchParams?.limit) || 25

    const { clients, total, totalPages } = await getClients(userId, query, page, limit)

    // Calculate statistics
    const totalClients = total
    const clientsWithCertificates = clients.filter(c => c._count.certificates > 0).length
    const totalCertificates = clients.reduce((sum, c) => sum + c._count.certificates, 0)

    // Flatten clients with their certificates for table view
    const certificateRows = clients.flatMap(client => {
        if (client.certificates.length === 0) {
            return [{
                clientId: client.id,
                clientName: client.companyName,
                cnpj: client.cnpj,
                phone: client.phone,
                certificateId: `no-cert-${client.id}`,
                holderName: '-',
                expirationDate: null,
                status: 'NO_CERTIFICATE',
                daysRemaining: null,
            }]
        }

        return client.certificates.map(cert => ({
            clientId: client.id,
            clientName: client.companyName,
            cnpj: client.cnpj,
            phone: client.phone,
            certificateId: cert.id,
            holderName: cert.holderName,
            expirationDate: cert.expirationDate,
            status: cert.status,
            daysRemaining: calculateDaysRemaining(cert.expirationDate),
        })) as any[]
    }) as {
        clientId: string
        clientName: string
        cnpj: string
        phone: string | null
        certificateId: string
        holderName: string
        expirationDate: Date | null
        status: string
        daysRemaining: number | null
    }[]

    // Sort rows
    certificateRows.sort((a, b) => {
        const modifier = order === 'asc' ? 1 : -1

        switch (sort) {
            case 'status':
                // Sort by days remaining (nulls last)
                if (a.daysRemaining === null) return 1
                if (b.daysRemaining === null) return -1
                return (a.daysRemaining - b.daysRemaining) * modifier
            case 'expirationDate':
                // Sort by date (nulls last)
                if (!a.expirationDate) return 1
                if (!b.expirationDate) return -1
                return (a.expirationDate.getTime() - b.expirationDate.getTime()) * modifier
            case 'clientName':
                return a.clientName.localeCompare(b.clientName) * modifier
            case 'phone':
                return (a.phone || '').localeCompare(b.phone || '') * modifier
            default:
                return 0
        }
    })

    return (
        <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Gerenciar Clientes
                        </h1>
                        <p className="text-gray-600">
                            Gerencie os clientes e seus certificados digitais
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <CreateClientModal userId={userId} />
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                            <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalClients}</div>
                            <p className="text-xs text-muted-foreground">
                                {totalClients === 0 ? 'Nenhum cliente cadastrado' : 'clientes cadastrados'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Com Certificados</CardTitle>
                            <Building2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{clientsWithCertificates}</div>
                            <p className="text-xs text-muted-foreground">
                                {totalCertificates} certificado{totalCertificates !== 1 ? 's' : ''} no total
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sem Certificados</CardTitle>
                            <Shield className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">
                                {totalClients - clientsWithCertificates}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Aguardando upload
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Certificates Table */}
                {certificateRows.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Users className="h-16 w-16 text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Nenhum certificado cadastrado
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 text-center max-w-md">
                                Comece adicionando clientes e seus certificados digitais
                            </p>
                            <CreateClientModal userId={userId} />
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                            <div className="space-y-1.5">
                                <CardTitle>Clientes</CardTitle>
                                <CardDescription>
                                    Lista de todos os certificados associados aos clientes
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Total: {total} cliente{total !== 1 ? 's' : ''}
                                </div>
                                <SearchInput />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ClientsTable clients={clients} userId={userId} />
                        </CardContent>
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalItems={total}
                            itemsPerPage={limit}
                        />
                    </Card>
                )}
            </div>
        </div>
    )
}
