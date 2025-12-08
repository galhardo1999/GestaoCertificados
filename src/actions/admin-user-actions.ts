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
        // 1. Buscar usuário e todos os membros da equipe para obter logotipos e certificados
        const user = await prisma.usuario.findUnique({
            where: { id: userId },
            include: {
                certificados: {
                    select: { chaveArquivo: true }
                },
                membrosEquipe: {
                    select: {
                        urlLogo: true,
                        certificados: {
                            select: { chaveArquivo: true }
                        }
                    }
                }
            }
        })

        if (!user) {
            return { success: false, message: 'Usuário não encontrado' }
        }

        // 2. Coletar todas as chaves S3 para excluir (Usuário + Membros da Equipe)
        const keysToDelete: string[] = []

        // Logotipo e certificados do usuário
        if (user.urlLogo) keysToDelete.push(user.urlLogo)
        user.certificados.forEach(cert => keysToDelete.push(cert.chaveArquivo))

        // Logotipos e certificados dos membros da equipe
        user.membrosEquipe.forEach(membro => {
            if (membro.urlLogo) keysToDelete.push(membro.urlLogo)
            membro.certificados.forEach(cert => keysToDelete.push(cert.chaveArquivo))
        })

        // 3. Excluir arquivos do S3
        if (keysToDelete.length > 0) {
            await Promise.all(
                keysToDelete.map(key => deleteFileFromS3(key).catch(console.error))
            )
        }

        // 4. Excluir Membros da Equipe primeiro (já que referenciam o usuário como mestre)
        // Nota: A relação é opcional, mas é uma boa prática limpar explicitamente
        await prisma.usuario.deleteMany({
            where: { usuarioMestreId: userId }
        })

        // 5. Excluir Usuário do BD
        await prisma.usuario.delete({
            where: { id: userId }
        })

        revalidatePath('/admin/empresas')
        return { success: true, message: 'Usuário e equipe excluídos com sucesso' }
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
