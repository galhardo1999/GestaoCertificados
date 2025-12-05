'use client'

import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
    currentPage: number
    totalPages: number
    totalItems: number
    itemsPerPage: number
}

export function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
}: PaginationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams)
        params.set('page', pageNumber.toString())
        return `?${params.toString()}`
    }

    const handleLimitChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('limit', value)
        params.set('page', '1') // Reset to first page
        router.push(`?${params.toString()}`)
    }

    const handlePageChange = (page: number) => {
        router.push(createPageURL(page))
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Itens por página:</span>
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleLimitChange}
                >
                    <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={itemsPerPage.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500 mr-2">
                    Página {currentPage} de {totalPages}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}
