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
import { addTeamMember } from '@/actions/team-actions'
import { toast } from 'sonner'
import { Plus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AddTeamMemberModal({ companyId }: { companyId: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await addTeamMember(companyId, { name, email, password })

            if (result.success) {
                toast.success('Usuário adicionado com sucesso!')
                setOpen(false)
                setName('')
                setEmail('')
                setPassword('')
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Erro ao adicionar usuário')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Usuário
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Adicionar Usuário à Empresa</DialogTitle>
                    <DialogDescription>
                        Crie um login adicional para esta empresa.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tm-name">Nome</Label>
                        <Input
                            id="tm-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tm-email">Email</Label>
                        <Input
                            id="tm-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tm-password">Senha</Label>
                        <Input
                            id="tm-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Adicionando...
                            </>
                        ) : (
                            'Adicionar'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
