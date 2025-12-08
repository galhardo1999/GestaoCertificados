'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { updatePlan } from '@/actions/plan-actions'
import { toast } from 'sonner'
import { Plus, Loader2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface EditPlanModalProps {
    plan: {
        id: string
        name: string
        code: string
        price: number
        description: string | null
        active: boolean
        limiteUsuarios?: number
        limiteClientes?: number
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditPlanModal({ plan, open, onOpenChange }: EditPlanModalProps) {
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState(plan.name)
    const [code, setCode] = useState(plan.code)
    const [price, setPrice] = useState(plan.price.toString())
    const [description, setDescription] = useState(plan.description || '')
    const [active, setActive] = useState(plan.active)
    const [userLimit, setUserLimit] = useState(plan.limiteUsuarios?.toString() || '0')
    const [clientLimit, setClientLimit] = useState(plan.limiteClientes?.toString() || '0')
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await updatePlan(plan.id, {
                name,
                code,
                price: parseFloat(price),
                description,
                active,
                limiteUsuarios: parseInt(userLimit) || 0,
                limiteClientes: parseInt(clientLimit) || 0
            })

            if (result.success) {
                toast.success('Plano atualizado com sucesso!')
                onOpenChange(false)
                router.refresh()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error('Erro ao atualizar plano')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Editar Plano</DialogTitle>
                    <DialogDescription>
                        Atualize as informações do plano.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-code">Código</Label>
                            <Input
                                id="edit-code"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome do Plano</Label>
                            <Input
                                id="edit-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-price">Preço (R$)</Label>
                        <Input
                            id="edit-price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-userLimit">Limite de Usuários</Label>
                            <Input
                                id="edit-userLimit"
                                type="number"
                                min="0"
                                value={userLimit}
                                onChange={(e) => setUserLimit(e.target.value)}
                                placeholder="0 = Ilimitado"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-clientLimit">Limite de Clientes</Label>
                            <Input
                                id="edit-clientLimit"
                                type="number"
                                min="0"
                                value={clientLimit}
                                onChange={(e) => setClientLimit(e.target.value)}
                                placeholder="0 = Ilimitado"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="edit-description">Descrição</Label>
                        <Textarea
                            id="edit-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="edit-active"
                            checked={active}
                            onCheckedChange={setActive}
                        />
                        <Label htmlFor="edit-active">Plano Ativo</Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
