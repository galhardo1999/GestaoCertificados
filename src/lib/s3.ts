import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET!

export interface UploadFileParams {
    fileBuffer: Buffer
    fileName: string
    contentType: string
    userId: string
    folder?: string
}

/**
 * Fazer upload de um arquivo para o S3 e retornar a chave do arquivo
 */
export async function uploadFileToS3({
    fileBuffer,
    fileName,
    contentType,
    userId,
    folder = 'certificates',
}: UploadFileParams): Promise<string> {
    // Gerar uma chave de arquivo única com prefixo de usuário
    const timestamp = Date.now()
    const fileKey = `${folder}/${userId}/${timestamp}-${fileName}`

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
        // Garantir que o arquivo seja privado
        ACL: 'private',
    })

    await s3Client.send(command)

    return fileKey
}

/**
 * Gerar uma URL assinada para acesso temporário a um arquivo
 * @param fileKey - A chave do objeto S3
 * @param expiresIn - Tempo de expiração da URL em segundos (padrão: 1 hora)
 */
export async function getSignedDownloadUrl(
    fileKey: string,
    expiresIn: number = 3600
): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    return signedUrl
}

/**
 * Excluir um arquivo do S3
 * @param fileKey - A chave do objeto S3 para excluir
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    })

    await s3Client.send(command)
}
