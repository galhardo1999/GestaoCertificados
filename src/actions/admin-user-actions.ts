'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

import { deleteFileFromS3 } from '@/lib/s3'

export async function deleteUser(userId: string) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        // 1. Fetch user to get logo and certificates
        const user = await prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                certificados: {
                    select: { chaveArquivo: true }
                }
            }
        })

        if (!user) {
            return { success: false, message: 'Usuário não encontrado' }
        }

        // 2. Delete Logo from S3
        if (user.urlLogo) {
            await deleteFileFromS3(user.urlLogo).catch(console.error)
        }

        // 3. Delete Certificates from S3
        if (user.certificados.length > 0) {
            await Promise.all(
                user.certificados.map(cert =>
                    deleteFileFromS3(cert.chaveArquivo).catch(console.error)
                )
            )
        }

        // 4. Delete User from DB
        await prisma.usuario.delete({
            where: { id: userId }
        })

        revalidatePath('/admin/empresas')
        return { success: true, message: 'Usuário excluído com sucesso' }
    } catch (error) {
        console.error('Error deleting user:', error)
        return { success: false, message: 'Erro ao excluir usuário' }
    }
}

export async function updateUser(userId: string, data: { name?: string; email?: string; password?: string }) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        const updateData: any = {}
        if (data.name) updateData.nome = data.name
        if (data.email) updateData.email = data.email
        if (data.password) {
            updateData.senha = await bcrypt.hash(data.password, 10)
        }

        await prisma.usuario.update({
            where: { id: userId },
            data: updateData
        })
        revalidatePath('/admin/empresas')
        return { success: true, message: 'Usuário atualizado com sucesso' }
    } catch (error) {
        console.error('Error updating user:', error)
        return { success: false, message: 'Erro ao atualizar usuário' }
    }
}
