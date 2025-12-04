import { Badge } from '@/components/ui/badge'


interface StatusBadgeProps {
    daysRemaining: number | null | undefined
}

export function StatusBadge({ daysRemaining }: StatusBadgeProps) {
    if (daysRemaining === null || daysRemaining === undefined) {
        return (
            <Badge className="bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100">
                <span className="mr-1">⚪</span> Sem Certificado
            </Badge>
        )
    }

    let status = 'safe'
    if (daysRemaining <= 30) status = 'warning'
    if (daysRemaining < 0) status = 'expired'

    if (status === 'safe') {
        return (
            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                <span className="mr-1">🟢</span> {daysRemaining} dias
            </Badge>
        )
    }

    if (status === 'warning') {
        return (
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                <span className="mr-1">🟡</span> {daysRemaining} dias
            </Badge>
        )
    }

    return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
            <span className="mr-1">🔴</span> {daysRemaining <= 0 ? 'Expirado' : `${daysRemaining} dias`}
        </Badge>
    )
}
