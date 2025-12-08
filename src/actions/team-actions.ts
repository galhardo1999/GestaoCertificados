'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

export async function addTeamMember(companyId: string, data: { name: string; email: string; password: string }) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        // Verificar se o email existe
        const existingUser = await prisma.usuario.findUnique({
            where: { email: data.email }
        })

        if (existingUser) {
            return { success: false, message: 'Email já cadastrado' }
        }

        const hashedPassword = await bcrypt.hash(data.password, 10)

        // Criar usuário vinculado à empresa
        await prisma.usuario.create({
            data: {
                nome: data.name,
                email: data.email,
                senha: hashedPassword,
                funcao: 'USUARIO',
                usuarioMestreId: companyId
            }
        })

        revalidatePath(`/admin/empresas/usuarios/${companyId}`)
        return { success: true, message: 'Usuário adicionado com sucesso' }
    } catch (error) {
        console.error('Error adding team member:', error)
        return { success: false, message: 'Erro ao adicionar usuário' }
    }
}

export async function getTeamMembers(companyId: string) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    return await prisma.usuario.findMany({
        where: {
            OR: [
                { usuarioMestreId: companyId },
                { id: companyId }
            ]
        },
        orderBy: { criadoEm: 'desc' }
    })
}
