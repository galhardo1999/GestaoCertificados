import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileCheck, AlertTriangle, CheckCircle2 } from 'lucide-react'

async function getStats() {
    const totalUsers = await prisma.user.count({
        where: { role: 'USER' }
    })

    const totalCertificates = await prisma.certificate.count()

    const activeCertificates = await prisma.certificate.count({
        where: { status: 'ACTIVE' }
    })

    const expiredCertificates = await prisma.certificate.count({
        where: { status: 'EXPIRED' }
    })

    return {
        totalUsers,
        totalCertificates,
        activeCertificates,
        expiredCertificates
    }
}

export default async function AdminDashboard() {
    const stats = await getStats()

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
                <p className="text-muted-foreground">
                    Visão geral do sistema e estatísticas.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Empresas
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            Empresas cadastradas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total de Certificados
                        </CardTitle>
                        <FileCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCertificates}</div>
                        <p className="text-xs text-muted-foreground">
                            Certificados no sistema
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Certificados Ativos
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeCertificates}</div>
                        <p className="text-xs text-muted-foreground">
                            Em dia
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Certificados Expirados
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.expiredCertificates}</div>
                        <p className="text-xs text-muted-foreground">
                            Vencidos
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
