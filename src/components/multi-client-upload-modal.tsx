'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { Users, Upload, X, FileText, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { processCertificateAndCreateClient } from '@/actions/client-actions'

interface MultiClientUploadModalProps {
    userId: string
    onSuccess?: () => void
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

interface FileStatus {
    file: File
    status: 'pending' | 'processing' | 'success' | 'error'
    message?: string
    clientName?: string
    password?: string
    showPassword?: boolean
}

export function MultiClientUploadModal({ userId, onSuccess, open: externalOpen, onOpenChange }: MultiClientUploadModalProps) {
    const router = useRouter()
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = externalOpen !== undefined
    const open = isControlled ? externalOpen : internalOpen
    const [files, setFiles] = useState<FileStatus[]>([])
    const [processing, setProcessing] = useState(false)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newFiles = acceptedFiles.map(file => ({
            file,
            status: 'pending' as const,
            password: '',
            showPassword: false
        }))
        setFiles(prev => [...prev, ...newFiles])
    }, [])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/x-pkcs12': ['.pfx', '.p12'],
        },
        onDrop,
        disabled: processing
    })

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index))
    }

    const processFiles = async () => {
        if (files.length === 0) return

        setProcessing(true)

        // Process files sequentially to avoid overwhelming the server/API
        const newFiles = [...files]

        for (let i = 0; i < newFiles.length; i++) {
            if (newFiles[i].status === 'success') continue

            newFiles[i] = { ...newFiles[i], status: 'processing' }
            setFiles([...newFiles])

            try {
                const formData = new FormData()
                formData.append('file', newFiles[i].file)
                if (newFiles[i].password) formData.append('password', newFiles[i].password!)

                const result = await processCertificateAndCreateClient(formData, userId)

                if (result.success) {
                    newFiles[i] = {
                        ...newFiles[i],
                        status: 'success',
                        message: result.message,
                        clientName: result.clientName
                    }
                } else {
                    newFiles[i] = {
                        ...newFiles[i],
                        status: 'error',
                        message: result.message
                    }
                }
            } catch (error) {
                newFiles[i] = {
                    ...newFiles[i],
                    status: 'error',
                    message: 'Erro inesperado'
                }
            }

            setFiles([...newFiles])
        }

        setProcessing(false)

        const successCount = newFiles.filter(f => f.status === 'success').length
        if (successCount > 0) {
            toast.success(`${successCount} clientes processados com sucesso!`)
            router.refresh()
            onSuccess?.()
        }
    }

    const resetModal = () => {
        setFiles([])
        setProcessing(false)
    }

    const handleOpenChange = (val: boolean) => {
        if (!processing) {
            if (isControlled) {
                onOpenChange?.(val)
            } else {
                setInternalOpen(val)
            }
            if (!val) resetModal()
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        Múltiplos Clientes
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar Múltiplos Clientes</DialogTitle>
                    <DialogDescription>
                        Faça upload de vários certificados para criar clientes em lote.
                        Informe a senha individualmente para cada arquivo, se necessário.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    {/* Dropzone */}
                    <div
                        {...getRootProps()}
                        className={`
                            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                            ${processing ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        <input {...getInputProps()} />
                        <div className="space-y-2">
                            <Upload className="mx-auto h-10 w-10 text-gray-400" />
                            <p className="text-sm text-gray-600">
                                Arraste arquivos .pfx ou .p12 aqui
                            </p>
                            <p className="text-xs text-gray-500">ou clique para selecionar</p>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                            <Label>Arquivos Selecionados ({files.length})</Label>
                            {files.map((item, index) => (
                                <div
                                    key={index}
                                    className={`
                                        flex items-center justify-between p-3 rounded-lg border
                                        ${item.status === 'error' ? 'bg-red-50 border-red-200' :
                                            item.status === 'success' ? 'bg-green-50 border-green-200' :
                                                'bg-gray-50 border-gray-200'}
                                    `}
                                >
                                    <div className="flex flex-col w-full gap-2">
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3 overflow-hidden flex-1">
                                                <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium truncate">{item.file.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.status === 'success' && item.clientName ? item.clientName :
                                                            item.status === 'error' ? item.message :
                                                                (item.file.size / 1024).toFixed(2) + ' KB'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                {item.status === 'processing' && (
                                                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                )}
                                                {item.status === 'success' && (
                                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                )}
                                                {item.status === 'error' && (
                                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                                )}
                                                {item.status === 'pending' && !processing && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            removeFile(index)
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {item.status === 'pending' && (
                                            <div className="pl-8 relative">
                                                <Input
                                                    type={item.showPassword ? "text" : "password"}
                                                    placeholder="Senha do certificado"
                                                    className="h-8 text-xs w-full pr-8"
                                                    value={item.password || ''}
                                                    onChange={(e) => {
                                                        const newFiles = [...files]
                                                        newFiles[index].password = e.target.value
                                                        setFiles(newFiles)
                                                    }}
                                                    disabled={processing}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-8 w-8 text-gray-400 hover:text-gray-600"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const newFiles = [...files]
                                                        newFiles[index].showPassword = !newFiles[index].showPassword
                                                        setFiles(newFiles)
                                                    }}
                                                    disabled={processing}
                                                >
                                                    {item.showPassword ? (
                                                        <EyeOff className="h-3 w-3" />
                                                    ) : (
                                                        <Eye className="h-3 w-3" />
                                                    )}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={processing}
                            className="flex-1"
                        >
                            Fechar
                        </Button>
                        <Button
                            onClick={processFiles}
                            disabled={processing || files.length === 0 || files.every(f => f.status === 'success')}
                            className="flex-1"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                'Processar Clientes'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
