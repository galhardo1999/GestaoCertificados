import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { CompanyHeader } from '@/components/admin/company-header'

export default async function CompanyInfoPage({ params }: { params: { id: string } }) {
    const company = await prisma.user.findUnique({
        where: { id: params.id }
    })

    if (!company) return null

    return (
        <div className="p-8 space-y-8">
            <CompanyHeader companyId={params.id} activeTab="info" />

            <Card>
                <CardHeader>
                    <CardTitle>Dados da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Nome da Empresa</Label>
                            <Input value={company.name || ''} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>CNPJ</Label>
                            <Input value={company.cnpj || ''} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone 1</Label>
                            <Input value={company.phone1 || ''} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Telefone 2</Label>
                            <Input value={company.phone2 || ''} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Cadastro</Label>
                            <Input value={company.createdAt.toLocaleDateString('pt-BR')} readOnly />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h3 className="text-lg font-medium mb-4">Endereço</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CEP</Label>
                                <Input value={company.zipCode || ''} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Rua</Label>
                                <Input value={company.address || ''} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Número</Label>
                                <Input value={company.number || ''} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Bairro</Label>
                                <Input value={company.neighborhood || ''} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Cidade</Label>
                                <Input value={company.city || ''} readOnly />
                            </div>
                            <div className="space-y-2">
                                <Label>Estado (UF)</Label>
                                <Input value={company.state || ''} readOnly />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
