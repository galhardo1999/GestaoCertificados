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
 * Fazer upload e processar um arquivo de certificado
 */
export async function uploadCertificate(
    formData: FormData,
    userId: string
): Promise<UploadCertificateResult> {
    try {
        // Extrair arquivo e senha dos dados do formulário
        const file = formData.get('file') as File
        const password = formData.get('password') as string | null

        if (!file) {
            return {
                success: false,
                message: 'Nenhum arquivo foi enviado',
                error: 'NO_FILE',
            }
        }

        // Validar tipo de arquivo
        if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
            return {
                success: false,
                message: 'Arquivo deve ser do tipo .pfx ou .p12',
                error: 'INVALID_FILE_TYPE',
            }
        }

        // Converter arquivo para buffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // Validar se é um arquivo PFX válido
        if (!isPfxFile(fileBuffer)) {
            return {
                success: false,
                message: 'Arquivo .pfx inválido ou corrompido',
                error: 'INVALID_PFX',
            }
        }

        // Analisar certificado para extrair metadados
        const metadata = await parseCertificate(fileBuffer, password || undefined)

        // Fazer upload do arquivo para o S3
        const fileKey = await uploadFileToS3({
            fileBuffer,
            fileName: file.name,
            contentType: 'application/x-pkcs12',
            userId,
        })

        // Salvar certificado no banco de dados
        const certificate = await prisma.certificado.create({
            data: {
                usuarioId: userId,
                chaveArquivo: fileKey,
                nomeTitular: metadata.holderName,
                dataVencimento: metadata.expirationDate,
                status: 'ATIVO',
                metadados: {
                    issuer: metadata.issuer,
                    serialNumber: metadata.serialNumber,
                    subject: metadata.subject,
                },
            },
        })

        // Revalidar a página do dashboard
        revalidatePath('/dashboard')

        return {
            success: true,
            message: 'Certificado enviado com sucesso!',
            certificate: {
                id: certificate.id,
                holderName: certificate.nomeTitular,
                expirationDate: certificate.dataVencimento,
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
