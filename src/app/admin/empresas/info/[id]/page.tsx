import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CompanyHeader } from '@/components/admin/company-header'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AuditLogTable } from '@/components/admin/audit-log-table'
import { getSignedDownloadUrl } from '@/lib/s3'

export default async function CompanyInfoPage({ params }: { params: { id: string } }) {
    const company = await prisma.usuario.findUnique({
        where: { id: params.id }
    })

    if (!company) return null

    const logs = await prisma.logAuditoria.findMany({
        where: { usuarioId: params.id },
        include: {
            usuario: {
                select: {
                    nome: true,
                    email: true
                }
            }
        },
        orderBy: { criadoEm: 'desc' },
        take: 10
    })

    let logoUrl = company.urlLogo
    if (logoUrl) {
        try {
            logoUrl = await getSignedDownloadUrl(logoUrl)
        } catch (error) {
            console.error('Erro ao gerar URL assinada para logo:', error)
            logoUrl = null
        }
    }

    return (
        <div className="p-8 space-y-8">
            <CompanyHeader companyId={params.id} activeTab="info" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Main Form */}
                <div className="lg:col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Dados da Empresa</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2 md:col-span-2">
                                    <Label>Data de Cadastro</Label>
                                    <Input value={company.criadoEm.toLocaleDateString('pt-BR')} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>CNPJ</Label>
                                    <Input value={company.cnpj || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Nome da Empresa</Label>
                                    <Input value={company.nome || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone 1</Label>
                                    <Input value={company.telefone1 || ''} readOnly />
                                </div>
                                <div className="space-y-2">
                                    <Label>Telefone 2</Label>
                                    <Input value={company.telefone2 || ''} readOnly />
                                </div>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="text-lg font-medium mb-4">Endereço</h3>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                                    <div className="space-y-2 md:col-span-6">
                                        <Label>CEP</Label>
                                        <Input value={company.cep || ''} readOnly />
                                    </div>
                                    <div className="space-y-2 md:col-span-3">
                                        <Label>Rua</Label>
                                        <Input value={company.endereco || ''} readOnly />
                                    </div>
                                    <div className="space-y-2 md:col-span-3">
                                        <Label>Número</Label>
                                        <Input value={company.numero || ''} readOnly />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Bairro</Label>
                                        <Input value={company.bairro || ''} readOnly />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Cidade</Label>
                                        <Input value={company.cidade || ''} readOnly />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Estado (UF)</Label>
                                        <Input value={company.estado || ''} readOnly />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Logo and Logs */}
                <div className="space-y-8">
                    {/* Logo Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Logo da Empresa</CardTitle>
                        </CardHeader>
                        <CardContent className="flex justify-center py-6">
                            <Avatar className="h-40 w-40">
                                <AvatarImage src={logoUrl || undefined} alt="Logo" className="object-cover" />
                                <AvatarFallback className="text-4xl">
                                    {company.nome?.substring(0, 2).toUpperCase() || 'EM'}
                                </AvatarFallback>
                            </Avatar>
                        </CardContent>
                    </Card>

                    {/* Logs Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Logs da Empresa</CardTitle>
                            <CardDescription>Últimas 10 atividades</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AuditLogTable logs={logs as any} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
