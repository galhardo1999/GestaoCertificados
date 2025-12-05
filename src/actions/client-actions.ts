'use server'

import { prisma } from '@/lib/prisma'
import { uploadFileToS3, getSignedDownloadUrl, deleteFileFromS3 } from '@/lib/s3'
import { parseCertificate, isPfxFile } from '@/lib/certificate-parser'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export interface CreateClientResult {
    success: boolean
    message: string
    clientId?: string
}

export async function createClient(
    formData: FormData,
    userId: string
): Promise<CreateClientResult> {
    try {
        const companyName = formData.get('companyName') as string
        const cnpj = formData.get('cnpj') as string
        const phone = formData.get('phone') as string
        const address = formData.get('address') as string
        const number = formData.get('number') as string
        const neighborhood = formData.get('neighborhood') as string
        const city = formData.get('city') as string
        const state = formData.get('state') as string
        const file = formData.get('file') as File | null
        const password = formData.get('password') as string | null

        // Validate required fields
        if (!companyName || !cnpj) {
            return {
                success: false,
                message: 'Nome da empresa e CNPJ são obrigatórios',
            }
        }

        // Create client
        const client = await prisma.cliente.create({
            data: {
                usuarioId: userId,
                nomeEmpresa: companyName,
                cnpj,
                telefone: phone || null,
                endereco: address || null,
                numero: number || null,
                bairro: neighborhood || null,
                cidade: city || null,
                estado: state || null,
            },
        })

        // If certificate file is provided, upload it
        if (file && file.size > 0) {
            // Validate file type
            if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
                // Delete the client if certificate upload fails
                await prisma.cliente.delete({ where: { id: client.id } })
                return {
                    success: false,
                    message: 'Arquivo deve ser do tipo .pfx ou .p12',
                }
            }

            // Convert file to buffer
            const arrayBuffer = await file.arrayBuffer()
            const fileBuffer = Buffer.from(arrayBuffer)

            // Validate it's a valid PFX file
            if (!isPfxFile(fileBuffer)) {
                await prisma.cliente.delete({ where: { id: client.id } })
                return {
                    success: false,
                    message: 'Arquivo .pfx inválido ou corrompido',
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

            // Create certificate linked to client
            await prisma.certificado.create({
                data: {
                    usuarioId: userId,
                    clienteId: client.id,
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
        }

        revalidatePath('/dashboard/clientes')

        return {
            success: true,
            message: 'Cliente criado com sucesso!',
            clientId: client.id,
        }
    } catch (error) {
        console.error('Error creating client:', error)
        return {
            success: false,
            message: `Erro ao criar cliente. Tente novamente: ${(error as any).message}`,
        }
    }
}

export async function getClients(
    userId: string,
    search?: string,
    page: number = 1,
    limit: number = 25
) {
    try {
        const where: any = { usuarioId: userId }

        if (search) {
            where.OR = [
                { nomeEmpresa: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search, mode: 'insensitive' } },
            ]
        }

        const skip = (page - 1) * limit

        const [clients, total] = await Promise.all([
            prisma.cliente.findMany({
                where,
                include: {
                    certificados: {
                        orderBy: { dataVencimento: 'desc' },
                    },
                    _count: {
                        select: { certificados: true },
                    },
                },
                orderBy: { criadoEm: 'desc' },
                skip,
                take: limit,
            }),
            prisma.cliente.count({ where }),
        ])

        return {
            clients,
            total,
            totalPages: Math.ceil(total / limit),
        }
    } catch (error) {
        console.error('Error fetching clients:', error)
        throw new Error('Erro ao buscar clientes')
    }
}

export async function deleteClient(clientId: string) {
    try {
        // Get all certificates for this client to delete their S3 files
        const certificates = await prisma.certificado.findMany({
            where: { clienteId: clientId },
            select: { chaveArquivo: true }
        })

        // Delete all certificate files from S3
        await Promise.all(
            certificates.map(cert => deleteFileFromS3(cert.chaveArquivo))
        )

        // Delete client (cascade will delete certificates from DB)
        await prisma.cliente.delete({
            where: { id: clientId },
        })

        revalidatePath('/dashboard/clientes')
        return { success: true, message: 'Cliente excluído com sucesso' }
    } catch (error) {
        console.error('Error deleting client:', error)
        return { success: false, message: 'Erro ao excluir cliente' }
    }
}

export async function updateClient(clientId: string, data: {
    companyName: string
    cnpj: string
    phone?: string
    address?: string
    number?: string
    neighborhood?: string
    city?: string
    state?: string
}) {
    try {
        await prisma.cliente.update({
            where: { id: clientId },
            data: {
                nomeEmpresa: data.companyName,
                cnpj: data.cnpj,
                telefone: data.phone || null,
                endereco: data.address || null,
                numero: data.number || null,
                bairro: data.neighborhood || null,
                cidade: data.city || null,
                estado: data.state || null,
            },
        })

        revalidatePath('/dashboard/clientes')
        return { success: true, message: 'Cliente atualizado com sucesso' }
    } catch (error) {
        console.error('Error updating client:', error)
        return { success: false, message: 'Erro ao atualizar cliente' }
    }
}

export async function addCertificate(
    clientId: string,
    formData: FormData,
    userId: string
): Promise<{ success: boolean; message: string }> {
    try {
        const file = formData.get('file') as File | null
        const password = formData.get('password') as string | null

        if (!file || file.size === 0) {
            return { success: false, message: 'Arquivo do certificado é obrigatório' }
        }

        // Validate file type
        if (!file.name.endsWith('.pfx') && !file.name.endsWith('.p12')) {
            return { success: false, message: 'Arquivo deve ser do tipo .pfx ou .p12' }
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        // Validate it's a valid PFX file
        if (!isPfxFile(fileBuffer)) {
            return { success: false, message: 'Arquivo .pfx inválido ou corrompido' }
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

        // Create certificate linked to client
        await prisma.certificado.create({
            data: {
                usuarioId: userId,
                clienteId: clientId,
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

        revalidatePath('/dashboard/clientes')
        return { success: true, message: 'Certificado adicionado com sucesso' }
    } catch (error) {
        console.error('Error adding certificate:', error)
        return { success: false, message: 'Erro ao adicionar certificado' }
    }
}

export async function deleteCertificate(certificateId: string) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return { success: false, message: 'Não autorizado' }
    }
    const userId = session.user.id

    try {
        // Get certificate to retrieve fileKey before deleting
        const certificate = await prisma.certificado.findFirst({
            where: {
                id: certificateId,
                usuarioId: userId // Ensure ownership
            },
            select: { chaveArquivo: true }
        })

        if (!certificate) {
            return { success: false, message: 'Certificado não encontrado' }
        }

        // Delete file from S3
        await deleteFileFromS3(certificate.chaveArquivo).catch(console.error)

        // Delete certificate from DB
        await prisma.certificado.delete({
            where: { id: certificateId },
        })

        revalidatePath('/dashboard/clientes')
        return { success: true, message: 'Certificado excluído com sucesso' }
    } catch (error) {
        console.error('Error deleting certificate:', error)
        return { success: false, message: 'Erro ao excluir certificado' }
    }
}

export async function getCertificateDownloadUrlAction(fileKey: string) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) {
            return { success: false, message: 'Não autorizado' }
        }

        const url = await getSignedDownloadUrl(fileKey)
        return { success: true, url }
    } catch (error) {
        console.error('Error generating download URL:', error)
        return { success: false, message: 'Erro ao gerar link de download' }
    }
}

export async function processCertificateAndCreateClient(
    formData: FormData,
    userId: string
): Promise<{ success: boolean; message: string; clientName?: string }> {
    try {
        const file = formData.get('file') as File
        const password = formData.get('password') as string | null

        if (!file) {
            return { success: false, message: 'Arquivo não fornecido' }
        }

        // 1. Validate and Parse Certificate
        const arrayBuffer = await file.arrayBuffer()
        const fileBuffer = Buffer.from(arrayBuffer)

        if (!isPfxFile(fileBuffer)) {
            return { success: false, message: 'Arquivo inválido (não é .pfx/.p12)' }
        }

        const metadata = await parseCertificate(fileBuffer, password || undefined)

        if (!metadata.cnpj) {
            return { success: false, message: 'CNPJ não encontrado no certificado' }
        }

        // 2. Fetch Address Data
        // We import dynamically to avoid circular deps if any, though here it's fine
        const { fetchCnpjData } = await import('./cnpj-actions')
        const addressData = await fetchCnpjData(metadata.cnpj)

        const companyName = metadata.companyName || (addressData.success && addressData.data?.company.name) || 'Empresa Sem Nome'

        // 3. Create Client
        // Check if client already exists with this CNPJ for this user
        const existingClient = await prisma.cliente.findFirst({
            where: {
                usuarioId: userId,
                cnpj: metadata.cnpj
            }
        })

        let clientId = existingClient?.id

        if (!existingClient) {
            const newClient = await prisma.cliente.create({
                data: {
                    usuarioId: userId,
                    nomeEmpresa: companyName,
                    cnpj: metadata.cnpj,
                    endereco: addressData.success ? addressData.data?.address.street : null,
                    numero: addressData.success ? addressData.data?.address.number : null,
                    bairro: addressData.success ? addressData.data?.address.district : null,
                    cidade: addressData.success ? addressData.data?.address.city : null,
                    estado: addressData.success ? addressData.data?.address.state : null,
                    telefone: addressData.success ? addressData.data?.phone : null,
                }
            })
            clientId = newClient.id
        }

        if (!clientId) {
            return { success: false, message: 'Falha ao criar ou recuperar cliente' }
        }

        // 4. Upload Certificate and Create Record
        const fileKey = await uploadFileToS3({
            fileBuffer,
            fileName: file.name,
            contentType: 'application/x-pkcs12',
            userId,
        })

        await prisma.certificado.create({
            data: {
                usuarioId: userId,
                clienteId: clientId,
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

        revalidatePath('/dashboard/clientes')
        return {
            success: true,
            message: existingClient ? 'Certificado adicionado a cliente existente' : 'Cliente criado com sucesso',
            clientName: companyName
        }

    } catch (error) {
        console.error('Error processing certificate:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : `Erro desconhecido: ${JSON.stringify(error)}`
        }
    }
}
