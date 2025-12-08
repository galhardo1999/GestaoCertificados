import { prisma } from '@/lib/prisma'
import { AcaoAuditoria, EntidadeAuditoria } from '@prisma/client'

interface CreateAuditLogParams {
    userId: string
    action: AcaoAuditoria
    entity: EntidadeAuditoria
    entityId?: string
    details?: string
}

export async function createAuditLog({
    userId,
    action,
    entity,
    entityId,
    details,
}: CreateAuditLogParams) {
    try {
        await prisma.logAuditoria.create({
            data: {
                usuarioId: userId,
                acao: action,
                entidade: entity,
                entidadeId: entityId,
                detalhes: details,
            },
        })
    } catch (error) {
        console.error('Failed to create audit log:', error)
        // We don't throw here to avoid blocking the main action if logging fails
    }
}
