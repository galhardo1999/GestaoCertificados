'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { uploadCertificate } from '@/actions/upload-certificate'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { formatDateBR } from '@/lib/utils'

interface UploadModalProps {
    userId: string
    onUploadSuccess?: () => void
}

export function UploadModal({ userId, onUploadSuccess }: UploadModalProps) {
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [password, setPassword] = useState('')
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState<{
        success: boolean
        message: string
        certificate?: {
            holderName: string
            expirationDate: Date
        }
    } | null>(null)

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/x-pkcs12': ['.pfx', '.p12'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0])
                setResult(null)
            }
        },
    })

    const handleUpload = async () => {
        if (!file) return

        setUploading(true)
        setResult(null)

        try {
            const formData = new FormData()
            formData.append('file', file)
            if (password) {
                formData.append('password', password)
            }

            const response = await uploadCertificate(formData, userId)
            setResult(response)

            if (response.success) {
                // Clear form after success
                setTimeout(() => {
                    setFile(null)
                    setPassword('')
                    setOpen(false)
                    setResult(null)
                    onUploadSuccess?.()
                }, 2000)
            }
        } catch (error) {
            setResult({
                success: false,
                message: 'Erro ao enviar certificado. Tente novamente.',
            })
        } finally {
            setUploading(false)
        }
    }

    const handleClose = () => {
        if (!uploading) {
            setOpen(false)
            setFile(null)
            setPassword('')
            setResult(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Novo Certificado
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Fazer Upload de Certificado</DialogTitle>
                    <DialogDescription>
                        Envie seu certificado digital (.pfx ou .p12) para gerenciamento automatizado
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
              ${file ? 'bg-green-50 border-green-300' : ''}
            `}
                    >
                        <input {...getInputProps()} />
                        {file ? (
                            <div className="space-y-2">
                                <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                                <p className="text-sm font-medium text-green-700">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                    {(file.size / 1024).toFixed(2)} KB
                                </p>
                            </div>
                        ) : isDragActive ? (
                            <div className="space-y-2">
                                <Upload className="mx-auto h-8 w-8 text-primary" />
                                <p className="text-sm text-gray-600">Solte o arquivo aqui...</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <p className="text-sm text-gray-600">
                                    Arraste um arquivo .pfx ou .p12 aqui
                                </p>
                                <p className="text-xs text-gray-500">ou clique para selecionar</p>
                            </div>
                        )}
                    </div>

                    {/* Password Input (Optional) */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha do Certificado (Opcional)</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Digite a senha se o certificado for protegido"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={uploading}
                        />
                        <p className="text-xs text-gray-500">
                            A senha não será armazenada por segurança
                        </p>
                    </div>

                    {/* Result Display */}
                    {result && (
                        <div
                            className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                }`}
                        >
                            {result.success ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <p className="font-medium text-green-800">{result.message}</p>
                                    </div>
                                    {result.certificate && (
                                        <div className="text-sm text-green-700 space-y-1 mt-2">
                                            <p>
                                                <strong>Titular:</strong> {result.certificate.holderName}
                                            </p>
                                            <p>
                                                <strong>Vencimento:</strong>{' '}
                                                {formatDateBR(new Date(result.certificate.expirationDate))}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <p className="text-sm text-red-800">{result.message}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Upload Button */}
                    <Button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            'Enviar Certificado'
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
