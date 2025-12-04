'use server'

import { parseCertificate, isPfxFile } from '@/lib/certificate-parser'

export async function extractCertificateMetadata(formData: FormData) {
    try {
        const file = formData.get('file') as File
        const password = formData.get('password') as string | null

        if (!file) {
            return { success: false, message: 'Nenhum arquivo enviado' }
        }

        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        if (!isPfxFile(fileBuffer)) {
            return { success: false, message: 'Arquivo inválido' }
        }

        const metadata = await parseCertificate(fileBuffer, password || undefined)

        return {
            success: true,
            data: metadata
        }
    } catch (error) {
        console.error('Error parsing certificate:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro ao processar certificado'
        }
    }
}
