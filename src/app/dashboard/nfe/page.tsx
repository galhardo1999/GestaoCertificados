import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NFeConsultationForm } from '@/components/nfe-consultation-form'

export default async function NFePage() {
    const session = await getServerSession(authOptions)
    const userId = session!.user.masterUserId || session!.user.id

    // Fetch clients that have certificates
    const clients = await prisma.client.findMany({
        where: {
            userId,
            certificates: {
                some: { status: 'ACTIVE' }
            }
        },
        select: {
            id: true,
            companyName: true,
            cnpj: true
        },
        orderBy: { companyName: 'asc' }
    })

    return (
        <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            <div className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    Consultar NFe
                </h1>
                <p className="text-gray-600">
                    Consulte Notas Fiscais Eletrônicas diretamente na SEFAZ
                </p>
            </div>

            <NFeConsultationForm clients={clients} />
        </div>
    )
}
