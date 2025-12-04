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
import { createClient } from '@/actions/client-actions'
import { UserPlus, CheckCircle2, AlertCircle, Loader2, Upload } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { extractCertificateMetadata } from '@/actions/parse-certificate'

interface CreateClientModalProps {
    userId: string
    onSuccess?: () => void
}

export function CreateClientModal({ userId, onSuccess }: CreateClientModalProps) {
    const [open, setOpen] = useState(false)
    const [companyName, setCompanyName] = useState('')
    const [cnpj, setCnpj] = useState('')
    const [phone, setPhone] = useState('')
    const [address, setAddress] = useState('')
    const [number, setNumber] = useState('')
    const [neighborhood, setNeighborhood] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')
    const [password, setPassword] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [parsing, setParsing] = useState(false) // New state for parsing
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    const parseCertificateData = async (file: File, certPassword?: string) => {
        setParsing(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            if (certPassword) formData.append('password', certPassword)

            const result = await extractCertificateMetadata(formData)

            if (result.success && result.data) {
                const { companyName: certCompanyName, cnpj: certCnpj } = result.data

                if (certCompanyName) setCompanyName(certCompanyName)

                if (certCnpj) {
                    const formattedCnpj = formatCNPJ(certCnpj)
                    setCnpj(formattedCnpj)

                    // Fetch address data
                    try {
                        const { fetchCnpjData } = await import('@/actions/cnpj-actions')
                        const addressResult = await fetchCnpjData(certCnpj)

                        if (addressResult.success && addressResult.data) {
                            setAddress(addressResult.data.address.street || '')
                            setNumber(addressResult.data.address.number || '')
                            setNeighborhood(addressResult.data.address.district || '')
                            setCity(addressResult.data.address.city || '')
                            setState(addressResult.data.address.state || '')
                            toast.success('Dados do certificado e endereço carregados!')
                        } else {
                            toast.success('Dados do certificado carregados!')
                        }
                    } catch (err) {
                        console.error('Error fetching address:', err)
                        toast.success('Dados do certificado carregados!')
                    }
                } else {
                    toast.success('Dados do certificado carregados!')
                }
            } else if (result.message) {
                // Only show error if password was provided or if it's not a password error
                if (certPassword || !result.message.includes('Senha')) {
                    toast.error(result.message)
                }
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao processar certificado')
        } finally {
            setParsing(false)
        }
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/x-pkcs12': ['.pfx', '.p12'],
        },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => { // Made onDrop async
            if (acceptedFiles.length > 0) {
                const uploadedFile = acceptedFiles[0]
                setFile(uploadedFile)
                setError('')

                // Try to parse immediately (works for passwordless or cached)
                await parseCertificateData(uploadedFile, password)
            }
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess(false)
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append('companyName', companyName)
            formData.append('cnpj', cnpj)
            if (phone) formData.append('phone', phone)
            if (address) formData.append('address', address)
            if (number) formData.append('number', number)
            if (neighborhood) formData.append('neighborhood', neighborhood)
            if (city) formData.append('city', city)
            if (state) formData.append('state', state)
            if (file) formData.append('file', file)
            if (password) formData.append('password', password)

            const result = await createClient(formData, userId)

            if (result.success) {
                setSuccess(true)
                setTimeout(() => {
                    setOpen(false)
                    resetForm()
                    onSuccess?.()
                }, 1500)
            } else {
                setError(result.message)
            }
        } catch (error) {
            setError('Erro ao criar cliente. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setCompanyName('')
        setCnpj('')
        setPhone('')
        setAddress('')
        setNumber('')
        setNeighborhood('')
        setCity('')
        setState('')
        setPassword('')
        setFile(null)
        setError('')
        setSuccess(false)
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Faça upload do certificado para preencher automaticamente os dados
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-800">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-3 rounded-lg bg-green-50 border border-green-200 flex items-center gap-2 text-sm text-green-800">
                            <CheckCircle2 className="h-4 w-4" />
                            Cliente criado com sucesso!
                        </div>
                    )}

                    {/* Certificate Upload */}
                    <div className="space-y-2">
                        <Label>Certificado Digital (Opcional)</Label>
                        <div
                            {...getRootProps()}
                            className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'}
                ${file ? 'bg-green-50 border-green-300' : ''}
                ${(loading || success) ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            <input {...getInputProps()} disabled={loading || success} />
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
                    </div>

                    {/* Password (conditional) */}
                    {file && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Senha do Certificado</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Digite a senha do certificado"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => {
                                        if (file && password) {
                                            parseCertificateData(file, password)
                                        }
                                    }}
                                    disabled={loading || success}
                                />
                                {parsing && (
                                    <div className="absolute right-3 top-2.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-gray-500">
                                Digite a senha e clique fora para carregar os dados
                            </p>
                        </div>
                    )}

                    {/* CNPJ */}
                    <div className="space-y-2">
                        <Label htmlFor="cnpj">
                            CNPJ <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                            <Input
                                id="cnpj"
                                placeholder="00.000.000/0000-00"
                                value={cnpj}
                                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                                onBlur={async () => {
                                    const cleanCnpj = cnpj.replace(/\D/g, '')
                                    if (cleanCnpj.length === 14) {
                                        setLoading(true)
                                        try {
                                            const { fetchCnpjData } = await import('@/actions/cnpj-actions')
                                            const result = await fetchCnpjData(cleanCnpj)

                                            if (result.success && result.data) {
                                                if (!companyName) setCompanyName(result.data.company.name)
                                                setAddress(result.data.address.street || '')
                                                setNumber(result.data.address.number || '')
                                                setNeighborhood(result.data.address.district || '')
                                                setCity(result.data.address.city || '')
                                                setState(result.data.address.state || '')
                                                toast.success('Dados carregados com sucesso!')
                                            } else if (result.message) {
                                                toast.error(result.message)
                                            }
                                        } catch (error) {
                                            console.error(error)
                                        } finally {
                                            setLoading(false)
                                        }
                                    }
                                }}
                                required
                                disabled={loading || success}
                                maxLength={18}
                            />
                            {loading && cnpj.replace(/\D/g, '').length === 14 && (
                                <div className="absolute right-3 top-2.5">
                                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2">
                        <Label htmlFor="companyName">
                            Nome da Empresa <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="companyName"
                            placeholder="Ex: Empresa LTDA"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            disabled={loading || success}
                        />
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="col-span-3 space-y-2">
                            <Label htmlFor="address">Rua</Label>
                            <Input
                                id="address"
                                placeholder="Rua Exemplo"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={loading || success}
                            />
                        </div>
                        <div className="col-span-1 space-y-2">
                            <Label htmlFor="number">Número</Label>
                            <Input
                                id="number"
                                placeholder="123"
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                disabled={loading || success}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="neighborhood">Bairro</Label>
                            <Input
                                id="neighborhood"
                                placeholder="Centro"
                                value={neighborhood}
                                onChange={(e) => setNeighborhood(e.target.value)}
                                disabled={loading || success}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input
                                    id="city"
                                    placeholder="São Paulo"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    disabled={loading || success}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">UF</Label>
                                <Input
                                    id="state"
                                    placeholder="SP"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    disabled={loading || success}
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone</Label>
                        <Input
                            id="phone"
                            placeholder="(00) 00000-0000"
                            value={phone}
                            onChange={(e) => setPhone(formatPhone(e.target.value))}
                            disabled={loading || success}
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
                            disabled={loading || success}
                            className="flex-1"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando...
                                </>
                            ) : success ? (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Criado!
                                </>
                            ) : (
                                'Criar Cliente'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
