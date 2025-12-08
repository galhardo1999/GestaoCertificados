'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRef } from 'react'
import { registerUser } from '@/actions/register'
import { fetchCnpjData } from '@/actions/cnpj-actions'
import { toast } from 'sonner'
import { Plus, Loader2, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function CreateUserModal() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Access Info
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    // Company Info
    const [cnpj, setCnpj] = useState('')
    const [phone1, setPhone1] = useState('')
    const [phone2, setPhone2] = useState('')

    // Address Info
    const [cep, setCep] = useState('')
    const [address, setAddress] = useState('')
    const [number, setNumber] = useState('')
    const [neighborhood, setNeighborhood] = useState('')
    const [city, setCity] = useState('')
    const [state, setState] = useState('')

    const [searchingCnpj, setSearchingCnpj] = useState(false)

    const router = useRouter()

    const handleCnpjSearch = async () => {
        if (!cnpj || cnpj.length < 14) return

        setSearchingCnpj(true)
        try {
            const result = await fetchCnpjData(cnpj)
            if (result.success && result.data) {
                const { company, address, phone } = result.data
                setName(company.name)
                // If address is available
                if (address) {
                    setAddress(address.street || '')
                    setNumber(address.number || '')
                    setNeighborhood(address.district || '')
                    setCity(address.city || '')
                    setState(address.state || '')
                }
                // If phone is available
                if (phone) {
                    setPhone1(phone)
                }
                toast.success('Dados preenchidos automaticamente!')
            } else {
                toast.error(result.message || 'CNPJ não encontrado')
            }
        } catch (error) {
            toast.error('Erro ao buscar CNPJ')
        } finally {
            setSearchingCnpj(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await registerUser(email, password, name, {
                cnpj,
                telefone1: phone1,
                telefone2: phone2,
                cep,
                endereco: address,
                numero: number,
                bairro: neighborhood,
                cidade: city,
                estado: state
            })

            if (result.success) {
                toast.success('Empresa criada com sucesso!')
                setOpen(false)
                // Reset form
                setName('')
                setEmail('')
                setPassword('')
                setCnpj('')
                setPhone1('')
                setPhone2('')
                setCep('')
                setAddress('')
                setNumber('')
                setNeighborhood('')
                setCity('')
                setState('')

                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Erro ao criar empresa')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Empresa
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Adicionar Nova Empresa</DialogTitle>
                    <DialogDescription>
                        Preencha os dados da empresa para criar uma nova conta.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Acesso */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-1">Informações de Acesso</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="cnpj">CNPJ</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="cnpj"
                                        value={cnpj}
                                        onChange={(e) => setCnpj(e.target.value)}
                                        placeholder="00.000.000/0000-00"
                                        onBlur={(e) => {
                                            if (e.target.value.replace(/\D/g, '').length === 14) {
                                                handleCnpjSearch()
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        onClick={handleCnpjSearch}
                                        disabled={searchingCnpj}
                                    >
                                        {searchingCnpj ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Search className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">Nome da Empresa</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ex: Minha Empresa LTDA"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email de Acesso</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="empresa@email.com"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha Provisória</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******"
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contato (CNPJ, Telefones) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-1">Contato</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="space-y-2">
                                <Label htmlFor="phone1">Telefone 1</Label>
                                <Input
                                    id="phone1"
                                    value={phone1}
                                    onChange={(e) => setPhone1(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone2">Telefone 2</Label>
                                <Input
                                    id="phone2"
                                    value={phone2}
                                    onChange={(e) => setPhone2(e.target.value)}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-500 border-b pb-1">Endereço</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="cep">CEP</Label>
                                <Input
                                    id="cep"
                                    value={cep}
                                    onChange={(e) => setCep(e.target.value)}
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-3">
                                <Label htmlFor="address">Logradouro</Label>
                                <Input
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Rua, Avenida..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="number">Número</Label>
                                <Input
                                    id="number"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    placeholder="123"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="neighborhood">Bairro</Label>
                                <Input
                                    id="neighborhood"
                                    value={neighborhood}
                                    onChange={(e) => setNeighborhood(e.target.value)}
                                    placeholder="Centro"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Cidade</Label>
                                <Input
                                    id="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="São Paulo"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state">Estado (UF)</Label>
                                <Input
                                    id="state"
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="SP"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Criando Empresa...
                            </>
                        ) : (
                            'Criar Empresa'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
