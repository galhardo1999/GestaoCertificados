'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, FileCode, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

interface Client {
    id: string
    nomeEmpresa: string
    cnpj: string
}

interface NFeConsultationFormProps {
    clients: Client[]
}

export function NFeConsultationForm({ clients }: NFeConsultationFormProps) {
    const [selectedClientId, setSelectedClientId] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
    const [accessKey, setAccessKey] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleConsult = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedClientId || !accessKey || !password) {
            toast.error('Preencha todos os campos')
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const response = await fetch('/api/nfe/consultar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: selectedClientId,
                    accessKey,
                    password
                })
            })

            const data = await response.json()

            if (response.ok && data.success) {
                setResult(data.docs)
                toast.success('Consulta realizada com sucesso!')
            } else {
                toast.error(data.message || data.error || 'Erro ao consultar')
            }
        } catch (error) {
            toast.error('Erro ao conectar com o servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Dados da Consulta</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleConsult} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 flex flex-col">
                                <Label>Cliente</Label>
                                {selectedClientId ? (
                                    <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-background h-10">
                                        <span className="text-sm">{clients.find(c => c.id === selectedClientId)?.nomeEmpresa}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                setSelectedClientId('')
                                                setSearchTerm('')
                                            }}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="border rounded-md relative">
                                        <Command shouldFilter={false} className="overflow-visible">
                                            <CommandInput
                                                placeholder="Buscar cliente..."
                                                value={searchTerm}
                                                onValueChange={setSearchTerm}
                                                className="h-10"
                                            />
                                            {searchTerm.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 bg-white border rounded-b-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
                                                    <CommandList>
                                                        <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                                                        <CommandGroup>
                                                            {clients
                                                                .filter(client => client.nomeEmpresa.toLowerCase().includes(searchTerm.toLowerCase()))
                                                                .map((client) => (
                                                                    <div
                                                                        key={client.id}
                                                                        onPointerDown={(e) => {
                                                                            e.preventDefault()
                                                                            e.stopPropagation()
                                                                            setSelectedClientId(client.id)
                                                                            setSearchTerm('')
                                                                        }}
                                                                    >
                                                                        <CommandItem
                                                                            value={client.nomeEmpresa}
                                                                            className="cursor-pointer"
                                                                        >
                                                                            <Check
                                                                                className={cn(
                                                                                    "mr-2 h-4 w-4",
                                                                                    selectedClientId === client.id ? "opacity-100" : "opacity-0"
                                                                                )}
                                                                            />
                                                                            <span>{client.nomeEmpresa}</span>
                                                                        </CommandItem>
                                                                    </div>
                                                                ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </div>
                                            )}
                                        </Command>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Senha do Certificado</Label>
                                <Input
                                    type="password"
                                    placeholder="Senha do arquivo .pfx"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Necessária para descriptografar o certificado
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Chave de Acesso da NFe</Label>
                            <Input
                                placeholder="Digite a chave de acesso (44 dígitos)"
                                value={accessKey}
                                onChange={e => setAccessKey(e.target.value.replace(/\D/g, ''))}
                                maxLength={44}
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full md:w-auto">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Consultando SEFAZ...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Consultar NFe
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {result && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resultados da Consulta</h3>
                    {result.map((doc: any, index: number) => (
                        <Card key={index}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <FileCode className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium text-sm text-gray-500">
                                                NSU: {doc.nsu}
                                            </span>
                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                Schema: {doc.schema}
                                            </span>
                                        </div>
                                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                                            {doc.xml}
                                        </pre>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
