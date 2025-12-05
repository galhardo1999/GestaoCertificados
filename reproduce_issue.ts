import { PrismaClient } from '@prisma/client'
import { uploadFileToS3, deleteFileFromS3 } from './src/lib/s3'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing client creation and S3...')
    let clientId = ''
    let fileKey = ''

    try {
        // 1. Create/Find User
        const user = await prisma.usuario.upsert({
            where: { email: 'test_creation@example.com' },
            update: {},
            create: {
                email: 'test_creation@example.com',
                nome: 'Test User',
                senha: 'password',
            },
        })
        console.log('User created/found:', user.id)

        // 2. Mock File Upload
        console.log('Testing S3 Upload...')
        const dummyBuffer = Buffer.from('test string', 'utf-8')
        try {
            fileKey = await uploadFileToS3({
                fileBuffer: dummyBuffer,
                fileName: 'test.pfx',
                contentType: 'application/x-pkcs12',
                userId: user.id
            })
            console.log('S3 Upload success:', fileKey)
        } catch (e) {
            console.error('S3 Upload FAILED:', e)
            throw e
        }

        // 3. Create Client
        const client = await prisma.cliente.create({
            data: {
                usuarioId: user.id,
                nomeEmpresa: 'Test Company With S3',
                cnpj: '00.000.000/0002-00',
                telefone: '123456789',
            }
        })
        clientId = client.id
        console.log('Client created successfully:', client.id)

        // 4. Clean up
        if (fileKey) {
            await deleteFileFromS3(fileKey)
            console.log('S3 File deleted')
        }

        await prisma.cliente.delete({ where: { id: clientId } })
        console.log('Client deleted successfully')

    } catch (error) {
        console.error('Error in workflow:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
