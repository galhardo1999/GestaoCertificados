'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AuditLog {
    id: string
    acao: string
    entidade: string
    detalhes: string | null
    criadoEm: Date
    usuario: {
        nome: string | null
        email: string
    }
}

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
    const getActionColor = (action: string) => {
        switch (action) {
            case 'CRIAR': return 'default'
            case 'ATUALIZAR': return 'secondary'
            case 'EXCLUIR': return 'destructive'
            default: return 'outline'
        }
    }

    return (
        <div className="rounded-md border bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-xs">Data/Hora</TableHead>
                        <TableHead className="text-xs">Usuário</TableHead>
                        <TableHead className="text-xs">Ação</TableHead>
                        <TableHead className="text-xs">Entidade</TableHead>
                        <TableHead className="text-xs">Detalhes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="font-medium text-xs">
                                {format(new Date(log.criadoEm), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell className="text-xs">
                                <span className="font-medium">{log.usuario.email}</span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={getActionColor(log.acao)}>
                                    {log.acao}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{log.entidade}</TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                                {log.detalhes || '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                    {logs.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                Nenhum registro encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
