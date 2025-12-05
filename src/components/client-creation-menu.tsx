'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, UserPlus, Users } from 'lucide-react'
import { CreateClientModal } from '@/components/create-client-modal'
import { MultiClientUploadModal } from '@/components/multi-client-upload-modal'

interface ClientCreationMenuProps {
    userId: string
}

export function ClientCreationMenu({ userId }: ClientCreationMenuProps) {
    const [showSingle, setShowSingle] = useState(false)
    const [showMulti, setShowMulti] = useState(false)

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Novo Cliente
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowSingle(true)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Adicionar Novo Cliente
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowMulti(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Adicionar Múltiplos Clientes
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <CreateClientModal
                userId={userId}
                open={showSingle}
                onOpenChange={setShowSingle}
            />
            <MultiClientUploadModal
                userId={userId}
                open={showMulti}
                onOpenChange={setShowMulti}
            />
        </>
    )
}
