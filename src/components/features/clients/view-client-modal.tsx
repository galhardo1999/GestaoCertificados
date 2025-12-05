'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { getCertificateDownloadUrlAction } from '@/actions/client-actions'
import { useState } from 'react'
import { calculateDaysRemaining, formatCNPJ, formatPhone } from '@/lib/utils'

interface ViewClientModalProps {
    client: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ViewClientModal({ client, open, onOpenChange }: ViewClientModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Detalhes do Cliente</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Informações Gerais</TabsTrigger>
                        <TabsTrigger value="certificates">Certificados</TabsTrigger>
                    </TabsList>

                    {/* General Info Tab */}
                    <TabsContent value="general" className="space-y-4 mt-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700">Nome da Empresa</label>
                                <p className="mt-1 text-sm text-gray-900">{client.nomeEmpresa}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">CNPJ</label>
                                <p className="mt-1 text-sm text-gray-900">{formatCNPJ(client.cnpj)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Email</label>
                                <p className="mt-1 text-sm text-gray-900">{client.email || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700">Telefone</label>
                                <p className="mt-1 text-sm text-gray-900">{formatPhone(client.telefone) || '-'}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Endereço</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-700">Logradouro</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {client.endereco ? `${client.endereco}, ${client.numero || 'S/N'}` : '-'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Bairro</label>
                                    <p className="mt-1 text-sm text-gray-900">{client.bairro || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Cidade/UF</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {client.cidade ? `${client.cidade}/${client.estado || ''}` : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {client.descricao && (
                            <div className="pt-4 border-t">
                                <label className="text-sm font-medium text-gray-700">Descrição</label>
                                <p className="mt-1 text-sm text-gray-900">{client.descricao}</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* Certificates Tab */}
                    <TabsContent value="certificates" className="space-y-4 mt-6">
                        {client.certificados && client.certificados.length > 0 ? (
                            <div className="space-y-6">
                                {(() => {
                                    // Sort certificates by expiration date descending
                                    const sortedCertificates = [...client.certificados].sort((a, b) =>
                                        new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime()
                                    )

                                    // The first one is the "Active" one (longest validity)
                                    const activeCertificateId = sortedCertificates[0]?.id

                                    // Group by year
                                    const groupedCertificates = sortedCertificates.reduce((acc, cert) => {
                                        const year = new Date(cert.dataVencimento).getFullYear()
                                        if (!acc[year]) acc[year] = []
                                        acc[year].push(cert)
                                        return acc
                                    }, {} as Record<number, any[]>)

                                    // Sort years descending
                                    const years = Object.keys(groupedCertificates).map(Number).sort((a, b) => b - a)

                                    return years.map(year => (
                                        <div key={year} className="space-y-3">
                                            <h5 className="text-sm font-semibold text-gray-500 border-b pb-1">{year}</h5>
                                            <div className="space-y-3">
                                                {groupedCertificates[year].map((cert: any) => {
                                                    const isActive = cert.id === activeCertificateId
                                                    const isExpired = new Date(cert.dataVencimento) < new Date()

                                                    return (
                                                        <div key={cert.id} className={`flex items-center justify-between p-3 border rounded-lg ${isExpired
                                                            ? 'bg-red-50 border-red-200'
                                                            : isActive
                                                                ? 'bg-green-50 border-green-200'
                                                                : 'bg-gray-50'
                                                            }`}>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-2 h-2 rounded-full ${isExpired
                                                                        ? 'bg-red-500'
                                                                        : isActive
                                                                            ? 'bg-green-500'
                                                                            : 'bg-gray-400'
                                                                        }`} />
                                                                    <span className={`font-medium text-sm ${isExpired
                                                                        ? 'text-red-900'
                                                                        : isActive
                                                                            ? 'text-green-900'
                                                                            : 'text-gray-700'
                                                                        }`}>
                                                                        {cert.nomeTitular}
                                                                    </span>
                                                                </div>
                                                                <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                                                                    Vence em: {new Date(cert.dataVencimento).toLocaleDateString('pt-BR')}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className={`text-xs font-medium px-2 py-1 rounded-full border ${isExpired
                                                                    ? 'bg-white text-red-700 border-red-200'
                                                                    : isActive
                                                                        ? 'bg-white text-green-700 border-green-200'
                                                                        : 'bg-white text-gray-500'
                                                                    }`}>
                                                                    {isExpired ? 'Expirado' : (isActive ? 'Vigente' : 'Histórico')}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                                    onClick={async () => {
                                                                        try {
                                                                            const result = await getCertificateDownloadUrlAction(cert.chaveArquivo)
                                                                            if (result.success && result.url) {
                                                                                window.open(result.url, '_blank')
                                                                            } else {
                                                                                toast.error(result.message || 'Erro ao baixar certificado')
                                                                            }
                                                                        } catch (error) {
                                                                            toast.error('Erro ao baixar certificado')
                                                                        }
                                                                    }}
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Nenhum certificado vinculado</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
