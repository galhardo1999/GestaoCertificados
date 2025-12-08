'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'

export function SearchInput({ className }: { className?: string }) {
    const searchParams = useSearchParams()
    const { replace } = useRouter()

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams)
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        replace(`?${params.toString()}`)
    }, 300)

    return (
        <div className={cn("relative w-full max-w-xl", className)}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
                type="search"
                placeholder="Buscar por nome ou CNPJ..."
                className="pl-9 bg-white"
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get('q')?.toString()}
            />
        </div>
    )
}
