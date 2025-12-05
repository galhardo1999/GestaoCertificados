'use client'

import { TableCell, TableRow } from '@/components/ui/table'
import { UserActions } from '@/components/admin/user-actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

interface CompanyRowProps {
    user: {
        id: string
        nome: string | null
        email: string
        cnpj: string | null
        criadoEm: Date
        _count: {
            certificados: number
            clientes: number
        }
    }
}

export function CompanyRow({ user }: CompanyRowProps) {
    const router = useRouter()

    const handleRowClick = (e: React.MouseEvent) => {
        // Prevent navigation if clicking on actions or other interactive elements
        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
            return
        }
        router.push(`/admin/empresas/info/${user.id}`)
    }

    return (
        <TableRow
            key={user.id}
            className="cursor-pointer hover:bg-muted/50"
            onClick={handleRowClick}
        >
            <TableCell className="font-mono text-xs">{user.id.slice(-6).toUpperCase()}</TableCell>
            <TableCell>
                {format(new Date(user.criadoEm), "dd/MM/yyyy", {
                    locale: ptBR,
                })}
            </TableCell>
            <TableCell className="font-medium">
                {user.nome}
            </TableCell>
            <TableCell>{user.cnpj || '-'}</TableCell>
            <TableCell className="text-center">{user._count.clientes}</TableCell>
            <TableCell className="text-center">{user._count.certificados}</TableCell>
            <TableCell className="text-right">
                <div onClick={(e) => e.stopPropagation()}>
                    <UserActions user={user} />
                </div>
            </TableCell>
        </TableRow>
    )
}
