import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export async function CompanyHeader({ companyId, activeTab }: { companyId: string, activeTab: 'info' | 'users' }) {
    const company = await prisma.usuario.findUnique({
        where: { id: companyId },
        select: { nome: true }
    })

    if (!company) {
        notFound()
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/empresas">
                        <ChevronLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{company.nome}</h1>
                    <p className="text-muted-foreground">
                        Gerencie os detalhes e usuários desta empresa.
                    </p>
                </div>
            </div>

            <div className="border-b">
                <div className="flex h-10 items-center gap-4">
                    <Link
                        href={`/admin/empresas/info/${companyId}`}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/50 ${activeTab === 'info' ? 'bg-background text-foreground shadow-sm' : ''}`}
                    >
                        Informações
                    </Link>
                    <Link
                        href={`/admin/empresas/usuarios/${companyId}`}
                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/50 ${activeTab === 'users' ? 'bg-background text-foreground shadow-sm' : ''}`}
                    >
                        Usuários
                    </Link>
                </div>
            </div>
        </div>
    )
}
