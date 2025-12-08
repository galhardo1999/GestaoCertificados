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
            orderBy: { codigo: 'asc' },
            skip,
            take: limit
        }),
        prisma.plano.count({ where })
    ])

    const mappedPlans = plans.map(plan => ({
        id: plan.id,
        name: plan.nome,
        code: plan.codigo,
        price: plan.preco,
        description: plan.descricao,
        active: plan.ativo,
        limiteUsuarios: plan.limiteUsuarios,
        limiteClientes: plan.limiteClientes,
        createdAt: plan.criadoEm,
        updatedAt: plan.atualizadoEm
    }))

    return {
        plans: mappedPlans,
        total,
        totalPages: Math.ceil(total / limit)
    }
}

export async function createPlan(data: {
    name: string
    price: number
    description?: string
    active?: boolean
    limiteUsuarios?: number
    limiteClientes?: number
}) {
    const session = await getServerSession(authOptions)

    if (session?.user?.role !== 'ADMIN') {
        return { success: false, message: 'Unauthorized' }
    }

    try {
        // Encontrar o último plano criado para determinar o próximo código
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
                // Se o último código não for um número, tentar encontrar o maior número ou usar fallback
                // Por enquanto, vamos apenas usar um incremento seguro se possível ou '01' se estiver totalmente quebrado
                // Mas como controlamos isso agora, deve ficar tudo bem.
                // Se o usuário editou manualmente para "ABC", podemos ter um problema.
                // Vamos assumir que queremos continuar a sequência a partir da contagem ou similar?
                // Melhor: tentar analisar, se falhar, talvez contagem + 1?
                // Vamos continuar analisando o último. Se falhar, talvez procuremos outros?
                // Abordagem simples:
                nextCode = '01' // Fallback
                // Se quisermos ser robustos contra a existência de códigos não numéricos:
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

        // Garantir unicidade apenas por precaução (embora improvável com a lógica max)
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
                ativo: data.active ?? true,
                limiteUsuarios: data.limiteUsuarios ?? 0,
                limiteClientes: data.limiteClientes ?? 0
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
    limiteUsuarios?: number
    limiteClientes?: number
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
                ativo: data.active,
                limiteUsuarios: data.limiteUsuarios,
                limiteClientes: data.limiteClientes
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
