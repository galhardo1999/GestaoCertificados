'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateClient, addCertificate, deleteCertificate, getCertificateDownloadUrlAction } from '@/actions/client-actions'
import { Pencil, Loader2, CheckCircle2, AlertCircle, Upload, Plus, Trash2, Download, X } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDropzone } from 'react-dropzone'
import { calculateDaysRemaining } from '@/lib/utils'



interface EditClientModalProps {
    client: any
    userId: string
}

export function EditClientModal({ client, userId }: EditClientModalProps) {
    const [open, setOpen] = useState(false)
    const [companyName, setCompanyName] = useState(client.nomeEmpresa)
    const [cnpj, setCnpj] = useState(client.cnpj)
    const [phone, setPhone] = useState(client.telefone || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Certificate upload state
    const [file, setFile] = useState<File | null>(null)
    const [password, setPassword] = useState('')
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState('')
    const [showUpload, setShowUpload] = useState(false)

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/x-pkcs12': ['.pfx', '.p12'],
        },
        maxFiles: 1,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setFile(acceptedFiles[0])
                setUploadError('')
            }
        },
    })

    const handleUploadCertificate = async () => {
        if (!file) return

        setUploading(true)
        setUploadError('')

        try {
            const formData = new FormData()
            formData.append('file', file)
            if (password) formData.append('password', password)

            const result = await addCertificate(client.id, formData, userId)

            if (result.success) {
                toast.success('Certificado adicionado com sucesso')
                setFile(null)
                setPassword('')
                setShowUpload(false)
            } else {
                setUploadError(result.message)
            }
        } catch (error) {
            setUploadError('Erro ao adicionar certificado')
        } finally {
            setUploading(false)
        }
    }

    const formatCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18)
    }

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '')
        return numbers
            .replace(/^(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await updateClient(client.id, {
                companyName,
                cnpj,
                phone,
            })

            if (result.success) {
                toast.success('Cliente atualizado com sucesso')
                setOpen(false)
            } else {
                setError(result.message)
            }
        } catch (error) {
            setError('Erro ao atualizar cliente')
        } finally {
            setLoading(false)
        }
    }

    // Check if latest certificate is expiring soon (<= 15 days)
    const latestCertificate = client.certificados && client.certificados.length > 0
        ? client.certificados[0]
        : null

    const daysRemaining = latestCertificate ? calculateDaysRemaining(latestCertificate.dataVencimento) : null
    const isExpiringSoon = daysRemaining !== null && daysRemaining <= 15

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Editar Cliente</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="general">Informações Gerais</TabsTrigger>
                        <TabsTrigger value="certificates">Certificados</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general">
                        <form onSubmit={handleSubmit} className="space-y-4 py-4">
                            {error && (
                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-800">
                                    <AlertCircle className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nome da Empresa</Label>
                                <Input
                                    id="companyName"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <Input
                                    id="cnpj"
                                    value={cnpj}
                                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                                    required
                                    disabled={loading}
                                    maxLength={18}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                                    disabled={loading}
                                    maxLength={15}
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        'Salvar'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </TabsContent>

                    <TabsContent value="certificates">
                        <div className="py-4 space-y-4">
                            {/* Add Certificate Section */}
                            {(isExpiringSoon || showUpload) && (
                                <div className="border rounded-lg p-4 bg-blue-50/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-sm text-blue-900">
                                            {client.certificados && client.certificados.length > 0 ? 'Renovar Certificado' : 'Adicionar Certificado'}
                                        </h4>
                                        {!showUpload && (
                                            <Button size="sm" onClick={() => setShowUpload(true)} variant="outline" className="h-8 bg-white">
                                                <Plus className="h-3 w-3 mr-1" />
                                                Adicionar Novo
                                            </Button>
                                        )}
                                    </div>

                                    {showUpload && (
                                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                            {uploadError && (
                                                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-800">
                                                    <AlertCircle className="h-4 w-4" />
                                                    {uploadError}
                                                </div>
                                            )}

                                            <div
                                                {...getRootProps()}
                                                className={`
                                                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors bg-white
                                                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                                                    ${file ? 'bg-green-50 border-green-300' : ''}
                                                `}
                                            >
                                                <input {...getInputProps()} disabled={uploading} />
                                                {file ? (
                                                    <div className="space-y-2">
                                                        <CheckCircle2 className="mx-auto h-8 w-8 text-green-600" />
                                                        <p className="text-sm font-medium text-green-700">{file.name}</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                                        <p className="text-sm text-gray-600">Arraste ou clique para selecionar (.pfx)</p>
                                                    </div>
                                                )}
                                            </div>

                                            {file && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="cert-password">Senha do Certificado</Label>
                                                    <Input
                                                        id="cert-password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        placeholder="Digite a senha"
                                                        className="bg-white"
                                                    />
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setShowUpload(false)
                                                        setFile(null)
                                                        setPassword('')
                                                    }}
                                                    className="flex-1"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    onClick={handleUploadCertificate}
                                                    disabled={!file || uploading}
                                                    className="flex-1"
                                                >
                                                    {uploading ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Enviando...
                                                        </>
                                                    ) : (
                                                        'Adicionar Certificado'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {client.certificados && client.certificados.length > 0 ? (
                                <div className="space-y-6">
                                    {(() => {
                                        // Sort certificates by expiration date descending
                                        const sortedCertificates = [...client.certificados].sort((a, b) =>
                                            new Date(b.dataVencimento).getTime() - new Date(a.dataVencimento).getTime()
                                        )

                                        // The first one is the "Active" one (longest validity)
                                        const activeCertificateId = sortedCertificates[0]?.id

                                        // Group by year
                                        const groupedCertificates = sortedCertificates.reduce((acc, cert) => {
                                            const year = new Date(cert.dataVencimento).getFullYear()
                                            if (!acc[year]) acc[year] = []
                                            acc[year].push(cert)
                                            return acc
                                        }, {} as Record<number, any[]>)

                                        // Sort years descending
                                        const years = Object.keys(groupedCertificates).map(Number).sort((a, b) => b - a)

                                        return years.map(year => (
                                            <div key={year} className="space-y-3">
                                                <h5 className="text-sm font-semibold text-gray-500 border-b pb-1">{year}</h5>
                                                <div className="space-y-3">
                                                    {groupedCertificates[year].map((cert: any) => {
                                                        const isActive = cert.id === activeCertificateId
                                                        const isExpired = new Date(cert.dataVencimento) < new Date()

                                                        return (
                                                            <div key={cert.id} className={`flex items-center justify-between p-3 border rounded-lg ${isExpired
                                                                ? 'bg-red-50 border-red-200'
                                                                : isActive
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : 'bg-gray-50'
                                                                }`}>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-2 h-2 rounded-full ${isExpired
                                                                            ? 'bg-red-500'
                                                                            : isActive
                                                                                ? 'bg-green-500'
                                                                                : 'bg-gray-400'
                                                                            }`} />
                                                                        <span className={`font-medium text-sm ${isExpired
                                                                            ? 'text-red-900'
                                                                            : isActive
                                                                                ? 'text-green-900'
                                                                                : 'text-gray-700'
                                                                            }`}>
                                                                            {cert.nomeTitular}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-500'}`}>
                                                                        Vence em: {new Date(cert.dataVencimento).toLocaleDateString('pt-BR')}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`text-xs font-medium px-2 py-1 rounded-full border ${isExpired
                                                                        ? 'bg-white text-red-700 border-red-200'
                                                                        : isActive
                                                                            ? 'bg-white text-green-700 border-green-200'
                                                                            : 'bg-white text-gray-500'
                                                                        }`}>
                                                                        {isExpired ? 'Expirado' : (isActive ? 'Vigente' : 'Histórico')}
                                                                    </div>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                                                        onClick={async () => {
                                                                            try {
                                                                                const result = await getCertificateDownloadUrlAction(cert.chaveArquivo)
                                                                                if (result.success && result.url) {
                                                                                    window.open(result.url, '_blank')
                                                                                } else {
                                                                                    toast.error(result.message || 'Erro ao baixar certificado')
                                                                                }
                                                                            } catch (error) {
                                                                                toast.error('Erro ao baixar certificado')
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Download className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className={`h-8 w-8 ${isExpired ? 'text-red-400 hover:text-red-700 hover:bg-red-100' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                                        onClick={async () => {
                                                                            if (confirm('Tem certeza que deseja excluir este certificado?')) {
                                                                                try {
                                                                                    const result = await deleteCertificate(cert.id)
                                                                                    if (result.success) {
                                                                                        toast.success('Certificado excluído')
                                                                                    } else {
                                                                                        toast.error(result.message)
                                                                                    }
                                                                                } catch (error) {
                                                                                    toast.error('Erro ao excluir certificado')
                                                                                }
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))
                                    })()}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                    <p className="mb-4">Nenhum certificado vinculado</p>
                                    {!showUpload && (
                                        <Button variant="outline" onClick={() => setShowUpload(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Adicionar Certificado
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
