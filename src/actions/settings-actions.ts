'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return { success: false, message: 'Não autorizado' }
    }

    const userId = session.user.id
    const name = formData.get('name') as string
    const whatsappTemplate = formData.get('whatsappTemplate') as string
    const cnpj = formData.get('cnpj') as string
    const phone1 = formData.get('phone1') as string
    const phone2 = formData.get('phone2') as string
    const logoFile = formData.get('logo') as File | null

    try {
        let logoUrl = undefined

        if (logoFile && logoFile.size > 0) {
            const arrayBuffer = await logoFile.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const { uploadFileToS3 } = await import('@/lib/s3')

            const fileKey = await uploadFileToS3({
                fileBuffer: buffer,
                fileName: logoFile.name,
                contentType: logoFile.type,
                userId,
                folder: 'logos'
            })

            logoUrl = fileKey
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                whatsappTemplate,
                cnpj,
                phone1,
                phone2,
                ...(logoUrl && { logoUrl }),
            },
        })

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/configuracoes')
        return { success: true, message: 'Configurações atualizadas com sucesso' }
    } catch (error) {
        console.error('Error updating settings:', error)
        return { success: false, message: 'Erro ao atualizar configurações' }
    }
}
