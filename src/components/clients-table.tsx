'use client'

import { useState } from 'react'
import { ViewClientModal } from './view-client-modal'
import { EditClientModal } from './edit-client-modal'
import { DeleteClientDialog } from './delete-client-dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from './status-badge'
import { calculateDaysRemaining, formatDateBR } from '@/lib/utils'
import { Pencil } from 'lucide-react'
import { Button } from './ui/button'

interface ClientsTableProps {
    clients: any[]
    userId: string
}

export function ClientsTable({ clients, userId }: ClientsTableProps) {
    const [viewClientId, setViewClientId] = useState<string | null>(null)
    const viewClient = clients.find(c => c.id === viewClientId)

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            Status
                        </TableHead>
                        <TableHead>
                            Data de Vencimento
                        </TableHead>
                        <TableHead>
                            Cliente
                        </TableHead>
                        <TableHead>
                            Telefone
                        </TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clients.map((client) => {
                        const certificate = client.certificates[0]
                        const daysRemaining = certificate
                            ? calculateDaysRemaining(certificate.expirationDate)
                            : null

                        return (
                            <TableRow
                                key={client.id}
                                className="cursor-pointer hover:bg-gray-50"
                                onClick={() => setViewClientId(client.id)}
                            >
                                <TableCell>
                                    <StatusBadge daysRemaining={daysRemaining} />
                                </TableCell>
                                <TableCell>
                                    {certificate
                                        ? formatDateBR(certificate.expirationDate)
                                        : '-'}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-gray-900">{client.companyName}</div>
                                        <div className="text-xs text-gray-500">{client.cnpj}</div>
                                    </div>
                                </TableCell>
                                <TableCell>{client.phone || '-'}</TableCell>
                                <TableCell className="text-right">
                                    <div
                                        className="flex items-center justify-end gap-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <EditClientModal client={client} userId={userId} />
                                        <DeleteClientDialog
                                            clientId={client.id}
                                            clientName={client.companyName}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>

            {viewClient && (
                <ViewClientModal
                    client={viewClient}
                    open={!!viewClientId}
                    onOpenChange={(open) => !open && setViewClientId(null)}
                />
            )}
        </>
    )
}
