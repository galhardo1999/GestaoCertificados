'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function getPlans(
    search?: string,
    page: number = 1,
    limit: number = 10
) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        throw new Error('Unauthorized')
    }

    const where: any = {}

    if (search) {
        where.OR = [
            { nome: { contains: search, mode: 'insensitive' } },
            { descricao: { contains: search, mode: 'insensitive' } }
        ]
    }

    const skip = (page - 1) * limit

    const [plans, total] = await Promise.all([
        prisma.plano.findMany({
            where,
            orderBy: { codigo: 'desc' },
            skip,
            take: limit
        }),
        prisma.plano.count({ where })
    ])

    return {
        plans,
        total,
        totalPages: Math.ceil(total / limit)
    }
}

export async function createPlan(data: {
    name: string
    price: number
    description?: string
    active?: boolean
}) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        // Find the last created plan to determine the next code
        const lastPlan = await prisma.plano.findFirst({
            orderBy: {
                criadoEm: 'desc'
            }
        })

        let nextCode = '01'
        if (lastPlan) {
            const lastCodeInt = parseInt(lastPlan.codigo)
            if (!isNaN(lastCodeInt)) {
                nextCode = (lastCodeInt + 1).toString().padStart(2, '0')
            } else {
                // If the last code is not a number, try to find the highest number or fallback
                // For now, let's just fallback to a safe increment if possible or '01' if completely broken
                // But since we control it now, it should be fine.
                // If the user manually edited to "ABC", we might have an issue.
                // Let's assume we want to continue the sequence from the count or similar?
                // Better: try to parse, if fail, maybe count + 1?
                // Let's stick to parsing the last one. If it fails, maybe we look for others?
                // Simple approach:
                nextCode = '01' // Fallback
                // If we want to be robust against non-numeric codes existing:
                const allPlans = await prisma.plano.findMany({
                    select: { codigo: true }
                })
                let maxCode = 0
                for (const p of allPlans) {
                    const c = parseInt(p.codigo)
                    if (!isNaN(c) && c > maxCode) {
                        maxCode = c
                    }
                }
                nextCode = (maxCode + 1).toString().padStart(2, '0')
            }
        }

        // Ensure uniqueness just in case (though unlikely with the max logic)
        let isUnique = false
        while (!isUnique) {
            const existing = await prisma.plano.findUnique({ where: { codigo: nextCode } })
            if (existing) {
                const c = parseInt(nextCode)
                nextCode = (c + 1).toString().padStart(2, '0')
            } else {
                isUnique = true
            }
        }

        await prisma.plano.create({
            data: {
                nome: data.name,
                codigo: nextCode,
                preco: data.price,
                descricao: data.description,
                ativo: data.active ?? true
            }
        })
        revalidatePath('/admin/planos')
        return { success: true, message: 'Plano criado com sucesso' }
    } catch (error) {
        console.error('Error creating plan:', error)
        return { success: false, message: 'Erro ao criar plano' }
    }
}

export async function updatePlan(id: string, data: {
    name?: string
    code?: string
    price?: number
    description?: string
    active?: boolean
}) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        if (data.code) {
            const existingPlan = await prisma.plano.findUnique({
                where: { codigo: data.code }
            })

            if (existingPlan && existingPlan.id !== id) {
                return { success: false, message: 'Já existe um plano com este código.' }
            }
        }

        await prisma.plano.update({
            where: { id },
            data: {
                nome: data.name,
                codigo: data.code,
                preco: data.price,
                descricao: data.description,
                ativo: data.active
            }
        })
        revalidatePath('/admin/planos')
        return { success: true, message: 'Plano atualizado com sucesso' }
    } catch (error) {
        console.error('Error updating plan:', error)
        return { success: false, message: 'Erro ao atualizar plano' }
    }
}

export async function deletePlan(id: string) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        await prisma.plano.delete({
            where: { id }
        })
        revalidatePath('/admin/planos')
        return { success: true, message: 'Plano excluído com sucesso' }
    } catch (error) {
        console.error('Error deleting plan:', error)
        return { success: false, message: 'Erro ao excluir plano' }
    }
}
