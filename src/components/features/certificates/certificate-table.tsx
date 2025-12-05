'use client'

import { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/status-badge'
import { CertificateWithDays } from '@/actions/get-certificates'
import { deleteCertificate } from '@/actions/get-certificates'
import { formatDateBR } from '@/lib/utils'
import { Trash2, Download, Loader2 } from 'lucide-react'
import { getSignedDownloadUrl } from '@/lib/s3'
import { WhatsAppIcon } from '@/components/shared/whatsapp-icon'

interface CertificateTableProps {
    certificates: CertificateWithDays[]
    onDelete?: () => void
    showAsClients?: boolean
    whatsappTemplate?: string
}

export function CertificateTable({ certificates, onDelete, showAsClients = false, whatsappTemplate }: CertificateTableProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [downloadingId, setDownloadingId] = useState<string | null>(null)

    const handleDelete = async (certificateId: string) => {
        if (!confirm('Tem certeza que deseja excluir este certificado?')) {
            return
        }

        setDeletingId(certificateId)
        try {
            await deleteCertificate(certificateId)
            onDelete?.()
        } catch (error) {
            alert('Erro ao excluir certificado')
        } finally {
            setDeletingId(null)
        }
    }

    const handleDownload = async (fileKey: string, holderName: string, certificateId: string) => {
        setDownloadingId(certificateId)
        try {
            const signedUrl = await getSignedDownloadUrl(fileKey)

            // Create a temporary link and trigger download
            const link = document.createElement('a')
            link.href = signedUrl
            link.download = `${holderName}.pfx`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        } catch (error) {
            alert('Erro ao baixar certificado')
        } finally {
            setDownloadingId(null)
        }
    }

    const handleWhatsApp = (cert: CertificateWithDays) => {
        if (!cert.client?.phone) {
            alert('Cliente sem telefone cadastrado')
            return
        }

        const phone = cert.client.phone.replace(/\D/g, '')
        if (!phone) {
            alert('Telefone inválido')
            return
        }

        let message = whatsappTemplate || 'Olá {clientName}, seu certificado digital ({holderName}) vence em {expirationDate}. Entre em contato para renovar!'

        // Replace variables
        message = message
            .replace(/{clientName}/g, cert.client.companyName)
            .replace(/{holderName}/g, cert.holderName)
            .replace(/{expirationDate}/g, formatDateBR(cert.expirationDate))
            .replace(/{days}/g, cert.daysRemaining.toString())

        const url = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    if (certificates.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
                <p className="text-gray-500">
                    {showAsClients ? 'Nenhum cliente com certificado expirando.' : 'Nenhum certificado cadastrado ainda.'}
                </p>
                <p className="text-sm text-gray-400 mt-2">
                    {showAsClients
                        ? 'Todos os certificados dos seus clientes estão válidos por mais de 30 dias.'
                        : 'Use o botão "Novo Certificado" para adicionar seu primeiro certificado.'
                    }
                </p>
            </div>
        )
    }

    return (
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        {showAsClients ? (
                            <>
                                <TableHead>Cliente</TableHead>
                                <TableHead>CNPJ</TableHead>
                                <TableHead>Status do Certificado</TableHead>
                                <TableHead>Data de Vencimento</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </>
                        ) : (
                            <>
                                <TableHead>Status</TableHead>
                                <TableHead>Data de Vencimento</TableHead>
                                <TableHead>Cliente</TableHead>
                            </>
                        )}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {certificates.map((cert) => (
                        <TableRow key={cert.id}>
                            {showAsClients ? (
                                <>
                                    <TableCell>
                                        <div className="font-medium">
                                            {cert.client?.companyName || cert.holderName}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-gray-600">
                                            {cert.client?.cnpj || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge daysRemaining={cert.daysRemaining} />
                                    </TableCell>
                                    <TableCell>{formatDateBR(cert.expirationDate)}</TableCell>
                                    <TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cert.client?.phone
                                                    ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    : "text-gray-300 hover:text-gray-400 hover:bg-gray-50"
                                                }
                                                onClick={() => handleWhatsApp(cert)}
                                                title={cert.client?.phone ? "Enviar mensagem no WhatsApp" : "Cliente sem telefone cadastrado"}
                                            >
                                                <WhatsAppIcon className="h-5 w-5" />
                                            </Button>
                                        </TableCell>
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>
                                        <StatusBadge daysRemaining={cert.daysRemaining} />
                                    </TableCell>
                                    <TableCell>{formatDateBR(cert.expirationDate)}</TableCell>
                                    <TableCell>
                                        {cert.client ? (
                                            <div>
                                                <div className="font-medium">{cert.client.companyName}</div>
                                                <div className="text-xs text-gray-500">{cert.client.cnpj}</div>
                                            </div>
                                        ) : (
                                            <span className="text-gray-500">{cert.holderName}</span>
                                        )}
                                    </TableCell>
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
