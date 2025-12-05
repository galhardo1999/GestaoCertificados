import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/features/settings/settings-form'

export default async function ConfiguracoesPage() {
    const session = await getServerSession(authOptions)
    const userId = session!.user.id

    const user = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
            nome: true,
            email: true,
            templateWhatsapp: true,
            urlLogo: true,
            cnpj: true,
            telefone1: true,
            telefone2: true,
            usuarioMestreId: true,
            usuarioMestre: {
                select: {
                    nome: true,
                    templateWhatsapp: true,
                    urlLogo: true,
                    cnpj: true,
                    telefone1: true,
                    telefone2: true,
                }
            }
        },
    })

    if (!user) {
        return <div>Usuário não encontrado</div>
    }

    const displayData = {
        name: user.usuarioMestre?.nome ?? user.nome,
        email: user.email,
        whatsappTemplate: user.usuarioMestre?.templateWhatsapp ?? user.templateWhatsapp,
        logoUrl: user.usuarioMestre?.urlLogo ?? user.urlLogo,
        cnpj: user.usuarioMestre?.cnpj ?? user.cnpj,
        phone1: user.usuarioMestre?.telefone1 ?? user.telefone1,
        phone2: user.usuarioMestre?.telefone2 ?? user.telefone2,
    }

    let logoUrl = displayData.logoUrl
    if (logoUrl) {
        const { getSignedDownloadUrl } = await import('@/lib/s3')
        logoUrl = await getSignedDownloadUrl(logoUrl)
    }

    const isPrincipal = !user.usuarioMestreId

    return (
        <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-8 w-full">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Configurações
                    </h1>
                    <p className="text-gray-600">
                        Gerencie suas informações e preferências
                    </p>
                </div>

                <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <SettingsForm user={{ ...displayData, logoUrl }} readOnly={!isPrincipal} />
                </div>
            </div>
        </div>
    )
}
