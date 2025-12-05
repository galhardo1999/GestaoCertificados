'use server'

import { prisma } from '@/lib/prisma'
import { calculateDaysRemaining } from '@/lib/utils'

export interface CertificateWithDays {
    id: string
    userId: string
    fileKey: string
    holderName: string
    expirationDate: Date
    status: string
    createdAt: Date
    daysRemaining: number
    client?: {
        companyName: string
        cnpj: string
        phone: string | null
    } | null
}

/**
 * Get all certificates for a user with calculated days remaining
 */
export async function getCertificates(userId: string): Promise<CertificateWithDays[]> {
    try {
        const certificates = await prisma.certificado.findMany({
            where: {
                usuarioId: userId,
            },
            include: {
                cliente: {
                    select: {
                        nomeEmpresa: true,
                        cnpj: true,
                        telefone: true,
                    },
                },
            },
            orderBy: {
                dataVencimento: 'asc',
            },
        })

        // Add days remaining to each certificate
        return certificates.map(cert => ({
            id: cert.id,
            userId: cert.usuarioId,
            fileKey: cert.chaveArquivo,
            holderName: cert.nomeTitular,
            expirationDate: cert.dataVencimento,
            status: cert.status,
            createdAt: cert.criadoEm,
            daysRemaining: calculateDaysRemaining(cert.dataVencimento),
            client: cert.cliente ? {
                companyName: cert.cliente.nomeEmpresa,
                cnpj: cert.cliente.cnpj,
                phone: cert.cliente.telefone,
            } : null
        }))
    } catch (error) {
        console.error('Error fetching certificates:', error)
        throw new Error('Erro ao buscar certificados')
    }
}

/**
 * Delete a certificate
 */
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { deleteFileFromS3 } from '@/lib/s3'

/**
 * Delete a certificate
 */
export async function deleteCertificate(certificateId: string): Promise<boolean> {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        throw new Error('Não autorizado')
    }
    const userId = session.user.id

    try {
        // Verify ownership and get file key before deleting
        const certificate = await prisma.certificado.findFirst({
            where: {
                id: certificateId,
                usuarioId: userId,
            },
            select: {
                id: true,
                chaveArquivo: true
            }
        })

        if (!certificate) {
            throw new Error('Certificado não encontrado')
        }

        // Delete file from S3
        await deleteFileFromS3(certificate.chaveArquivo).catch(console.error)

        await prisma.certificado.delete({
            where: {
                id: certificateId,
            },
        })

        return true
    } catch (error) {
        console.error('Error deleting certificate:', error)
        throw error
    }
}
