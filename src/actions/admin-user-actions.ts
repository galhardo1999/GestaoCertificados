'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

export async function deleteUser(userId: string) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.user.delete({
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
        if (data.name) updateData.name = data.name
        if (data.email) updateData.email = data.email
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10)
        }

        await prisma.user.update({
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
