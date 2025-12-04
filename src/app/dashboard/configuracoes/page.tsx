import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsForm } from '@/components/settings-form'

export default async function ConfiguracoesPage() {
    const session = await getServerSession(authOptions)
    const userId = session!.user.id

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            name: true,
            email: true,
            whatsappTemplate: true,
            logoUrl: true,
            cnpj: true,
            phone1: true,
            phone2: true,
        },
    })

    if (!user) {
        return <div>Usuário não encontrado</div>
    }

    let logoUrl = user.logoUrl
    if (logoUrl) {
        const { getSignedDownloadUrl } = await import('@/lib/s3')
        logoUrl = await getSignedDownloadUrl(logoUrl)
    }

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
                    <SettingsForm user={{ ...user, logoUrl }} />
                </div>
            </div>
        </div>
    )
}
