'use client'

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

interface SortableHeaderProps {
    column: string
    title: string
    className?: string
}

export function SortableHeader({ column, title, className }: SortableHeaderProps) {
    const searchParams = useSearchParams()
    const currentSort = searchParams.get('sort')
    const currentOrder = searchParams.get('order')

    const isSorted = currentSort === column
    const nextOrder = isSorted && currentOrder === 'asc' ? 'desc' : 'asc'

    const params = new URLSearchParams(searchParams)
    params.set('sort', column)
    params.set('order', nextOrder)

    return (
        <Link
            href={`?${params.toString()}`}
            className={cn('flex items-center gap-1 hover:text-gray-900 transition-colors', className)}
        >
            {title}
            {isSorted ? (
                currentOrder === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                ) : (
                    <ArrowDown className="h-4 w-4" />
                )
            ) : (
                <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            )}
        </Link>
    )
}
