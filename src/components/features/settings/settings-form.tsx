'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateSettings } from '@/actions/settings-actions'
import { Loader2, Save, CheckCircle2, AlertCircle, Plus, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SettingsFormProps {
    user: {
        name: string | null
        email: string
        whatsappTemplate: string | null
        logoUrl?: string | null
        cnpj?: string | null
        phone1?: string | null
        phone2?: string | null
    }
    readOnly?: boolean
}

export function SettingsForm({ user, readOnly = false }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(user.name || '')
    const [cnpj, setCnpj] = useState(user.cnpj || '')
    const [phone1, setPhone1] = useState(user.phone1 || '')
    const [phone2, setPhone2] = useState(user.phone2 || '')
    const [whatsappTemplate, setWhatsappTemplate] = useState(
        user.whatsappTemplate ||
        'Olá {clientName}, seu certificado digital vence em {expirationDate}. Entre em contato para renovar!'
    )

    const [logoPreview, setLogoPreview] = useState(user.logoUrl || null)
    const [logoFile, setLogoFile] = useState<File | null>(null)

    const formatPhone = (value: string) => {
        // Remove non-digits
        const numbers = value.replace(/\D/g, '')

        // Limit to 11 digits
        const truncated = numbers.slice(0, 11)

        // Apply mask (XX) XXXXX-XXXX
        if (truncated.length <= 2) return truncated
        if (truncated.length <= 7) return `(${truncated.slice(0, 2)}) ${truncated.slice(2)}`
        return `(${truncated.slice(0, 2)}) ${truncated.slice(2, 7)}-${truncated.slice(7)}`
    }

    const handlePhoneChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhone(e.target.value)
        setter(formatted)
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const objectUrl = URL.createObjectURL(file)
            setLogoPreview(objectUrl)
            setLogoFile(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (readOnly) return
        setLoading(true)

        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('whatsappTemplate', whatsappTemplate)
            formData.append('cnpj', cnpj)
            formData.append('phone1', phone1)
            formData.append('phone2', phone2)
            if (logoFile) {
                formData.append('logo', logoFile)
            }

            const result = await updateSettings(formData)

            if (result.success) {
                toast.success('Configurações salvas com sucesso!')
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Erro ao salvar configurações')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {readOnly && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Você está visualizando as configurações da empresa. Apenas o usuário principal pode fazer alterações.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Inputs */}
                <div className="md:col-span-2 space-y-6">


                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Empresa</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da Empresa"
                            disabled={readOnly}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cnpj">CNPJ</Label>
                        <Input
                            id="cnpj"
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            placeholder="00.000.000/0000-00"
                            disabled={true}
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500">
                            O CNPJ não pode ser alterado
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone1">Telefone 1</Label>
                            <Input
                                id="phone1"
                                value={phone1}
                                onChange={handlePhoneChange(setPhone1)}
                                placeholder="(00) 00000-0000"
                                maxLength={15} // (XX) XXXXX-XXXX is 15 chars
                                disabled={readOnly}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone2">Telefone 2</Label>
                            <Input
                                id="phone2"
                                value={phone2}
                                onChange={handlePhoneChange(setPhone2)}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            value={user.email}
                            disabled
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500">
                            O email não pode ser alterado
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="whatsappTemplate">Modelo de Mensagem WhatsApp</Label>
                        <Textarea
                            id="whatsappTemplate"
                            value={whatsappTemplate}
                            onChange={(e) => setWhatsappTemplate(e.target.value)}
                            placeholder="Digite a mensagem padrão..."
                            rows={6}
                            disabled={readOnly}
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                            <p>Variáveis disponíveis:</p>
                            <ul className="list-disc list-inside">
                                <li><code>{'{clientName}'}</code> - Nome da empresa/cliente</li>
                                <li><code>{'{expirationDate}'}</code> - Data de vencimento</li>
                                <li><code>{'{days}'}</code> - Dias restantes</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Right Column: Logo Upload */}
                <div className="md:col-span-1 space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="logo">Logo</Label>
                        <div className="relative">
                            <label
                                htmlFor="logo"
                                className={`flex flex-col items-center justify-center w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 ${!readOnly ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-not-allowed opacity-60'} transition-colors overflow-hidden`}
                            >
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Logo da empresa"
                                        className="w-full h-full object-contain p-4"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        <Plus className="w-12 h-12 text-gray-400 mb-2" />
                                        <p className="text-sm text-gray-500">Adicionar Logo</p>
                                    </div>
                                )}
                                <input
                                    id="logo"
                                    name="logo"
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg, image/avif"
                                    className="hidden"
                                    onChange={handleLogoChange}
                                    disabled={readOnly}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                            Formatos: PNG, JPG, JPEG, AVIF
                        </p>
                    </div>

                    <div className="pt-4 border-t">
                        <Link
                            href="/dashboard/logs"
                            className="flex items-center justify-center gap-2 w-full p-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium text-sm border border-slate-200"
                        >
                            <ClipboardList className="h-4 w-4" />
                            Visualizar Logs do Sistema
                        </Link>
                        <p className="text-xs text-gray-500 text-center mt-2">
                            Histórico de ações e alterações
                        </p>
                    </div>
                </div>

            </div>

            {!readOnly && (
                <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={loading} size="lg">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            )}
        </form >
    )
}
