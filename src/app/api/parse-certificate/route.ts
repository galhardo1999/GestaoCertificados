import { NextRequest, NextResponse } from 'next/server'
import { parseCertificate } from '@/lib/certificate-parser'

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const password = formData.get('password') as string | null

        if (!file) {
            return NextResponse.json(
                { error: 'Arquivo não fornecido' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // Parse certificate
        const metadata = await parseCertificate(fileBuffer, password || undefined)

        // Extract CNPJ and Company Name from metadata
        const { cnpj, companyName, holderName, expirationDate } = metadata

        return NextResponse.json({
            success: true,
            data: {
                companyName: companyName || holderName, // Fallback to holderName if companyName is empty
                cnpj: cnpj || '',
                holderName,
                expirationDate,
            },
        })
    } catch (error: any) {
        console.error('Error parsing certificate:', error)
        return NextResponse.json(
            {
                success: false,
                error: error.message || 'Erro ao analisar certificado',
            },
            { status: 400 }
        )
    }
}
