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
 * Upload a file to S3 and return the file key
 */
export async function uploadFileToS3({
    fileBuffer,
    fileName,
    contentType,
    userId,
    folder = 'certificates',
}: UploadFileParams): Promise<string> {
    // Generate a unique file key with user prefix
    const timestamp = Date.now()
    const fileKey = `${folder}/${userId}/${timestamp}-${fileName}`

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        Body: fileBuffer,
        ContentType: contentType,
        // Ensure the file is private
        ACL: 'private',
    })

    await s3Client.send(command)

    return fileKey
}

/**
 * Generate a signed URL for temporary access to a file
 * @param fileKey - The S3 object key
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
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
 * Delete a file from S3
 * @param fileKey - The S3 object key to delete
 */
export async function deleteFileFromS3(fileKey: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
    })

    await s3Client.send(command)
}
