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
        const certificates = await prisma.certificate.findMany({
            where: {
                userId,
            },
            include: {
                client: {
                    select: {
                        companyName: true,
                        cnpj: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                expirationDate: 'asc',
            },
        })

        // Add days remaining to each certificate
        return certificates.map(cert => ({
            ...cert,
            daysRemaining: calculateDaysRemaining(cert.expirationDate),
        }))
    } catch (error) {
        console.error('Error fetching certificates:', error)
        throw new Error('Erro ao buscar certificados')
    }
}

/**
 * Delete a certificate
 */
export async function deleteCertificate(certificateId: string, userId: string): Promise<boolean> {
    try {
        // Verify ownership before deleting
        const certificate = await prisma.certificate.findFirst({
            where: {
                id: certificateId,
                userId,
            },
        })

        if (!certificate) {
            throw new Error('Certificado não encontrado')
        }

        await prisma.certificate.delete({
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
