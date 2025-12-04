'use server'

import { prisma } from '@/lib/prisma'
import { uploadFileToS3 } from '@/lib/s3'
import { parseCertificate, isPfxFile } from '@/lib/certificate-parser'
import { revalidatePath } from 'next/cache'

export interface UploadCertificateResult {
    success: boolean
    message: string
    certificate?: {
        id: string
        holderName: string
        expirationDate: Date
    }
    error?: string
}

/**
 * Upload and process a certificate file
 */
export async function uploadCertificate(
    formData: FormData,
    userId: string
): Promise<UploadCertificateResult> {
    try {
        // Extract file and password from form data
        const file = formData.get('file') as File
        const password = formData.get('password') as string | null

        if (!file) {
            return {
                success: false,
                message: 'Nenhum arquivo foi enviado',
                error: 'NO_FILE',
            }
        }

        // Validate file type
        if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
            return {
                success: false,
                message: 'Arquivo deve ser do tipo .pfx ou .p12',
                error: 'INVALID_FILE_TYPE',
            }
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // Validate it's a valid PFX file
        if (!isPfxFile(fileBuffer)) {
            return {
                success: false,
                message: 'Arquivo .pfx inválido ou corrompido',
                error: 'INVALID_PFX',
            }
        }

        // Parse certificate to extract metadata
        const metadata = await parseCertificate(fileBuffer, password || undefined)

        // Upload file to S3
        const fileKey = await uploadFileToS3({
            fileBuffer,
            fileName: file.name,
            contentType: 'application/x-pkcs12',
            userId,
        })

        // Save certificate to database
        const certificate = await prisma.certificate.create({
            data: {
                userId,
                fileKey,
                holderName: metadata.holderName,
                expirationDate: metadata.expirationDate,
                status: 'ACTIVE',
                metadata: {
                    issuer: metadata.issuer,
                    serialNumber: metadata.serialNumber,
                    subject: metadata.subject,
                },
            },
        })

        // Revalidate the dashboard page
        revalidatePath('/dashboard')

        return {
            success: true,
            message: 'Certificado enviado com sucesso!',
            certificate: {
                id: certificate.id,
                holderName: certificate.holderName,
                expirationDate: certificate.expirationDate,
            },
        }
    } catch (error) {
        console.error('Error uploading certificate:', error)

        if (error instanceof Error) {
            return {
                success: false,
                message: error.message,
                error: 'PROCESSING_ERROR',
            }
        }

        return {
            success: false,
            message: 'Erro ao processar certificado. Tente novamente.',
            error: 'UNKNOWN_ERROR',
        }
    }
}
