import { getCertificates } from '@/actions/get-certificates'
import { prisma } from '@/lib/prisma'
import { CertificateTable } from '@/components/certificate-table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Clock, AlertTriangle } from 'lucide-react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LogoutButton } from '@/components/logout-button'

export default async function DashboardPage() {
    // Get authenticated user (auth check is in layout)
    const session = await getServerSession(authOptions)
    const userId = session!.user.masterUserId || session!.user.id

    // Fetch user settings and certificates in parallel
    const [user, certificates] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { whatsappTemplate: true }
        }),
        getCertificates(userId)
    ])

    const whatsappTemplate = user?.whatsappTemplate || 'Olá {clientName}, seu certificado digital ({holderName}) vence em {expirationDate}. Entre em contato para renovar!'

    // Calculate statistics
    const totalCertificates = certificates.length
    const activeCertificates = certificates.filter(c => c.daysRemaining > 0).length
    const criticalCertificates = certificates.filter(c => c.daysRemaining >= 0 && c.daysRemaining < 7).length
    const expiredCertificates = certificates.filter(c => c.daysRemaining < 0).length

    return (
        <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Gestão de Certificados Digitais
                        </h1>
                        <p className="text-gray-600">
                            Olá, {session!.user.name || session!.user.email}!
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* <LogoutButton /> */}
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Shield className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{totalCertificates}</div>
                            <p className="text-xs text-muted-foreground">
                                Certificados cadastrados
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
                            <Clock className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{activeCertificates}</div>
                            <p className="text-xs text-muted-foreground">
                                Certificados válidos
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{criticalCertificates}</div>
                            <p className="text-xs text-muted-foreground">
                                Vencimento em &lt; 7 dias
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-gray-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-600">{expiredCertificates}</div>
                            <p className="text-xs text-muted-foreground">
                                Certificados vencidos
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Clients with Expiring Certificates Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Clientes com certificados perto do vencimento nos próximos 30 dias</CardTitle>
                        <CardDescription>
                            Clientes que possuem certificados expirando ou já expirados
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CertificateTable
                            whatsappTemplate={whatsappTemplate}
                            showAsClients={true}
                            certificates={(() => {
                                // Group all certificates by client first
                                const clientMap = new Map<string, typeof certificates>()

                                certificates.forEach(cert => {
                                    if (cert.client) {
                                        const clientKey = cert.client.cnpj
                                        if (!clientMap.has(clientKey)) {
                                            clientMap.set(clientKey, [])
                                        }
                                        clientMap.get(clientKey)!.push(cert)
                                    }
                                })

                                // Filter clients and get their best certificate
                                const displayCerts: typeof certificates = []

                                clientMap.forEach((clientCerts) => {
                                    // Find the certificate with the most days remaining (the "best" one)
                                    const bestCert = clientCerts.reduce((prev, current) =>
                                        (prev.daysRemaining > current.daysRemaining) ? prev : current
                                    )

                                    // Only show if the BEST certificate is expiring in 30 days or less (or expired)
                                    // This prevents showing clients who have a valid certificate (>30 days) even if they have old expired ones
                                    if (bestCert.daysRemaining <= 30) {
                                        displayCerts.push(bestCert)
                                    }
                                })

                                // Sort by days remaining
                                return displayCerts.sort((a, b) => a.daysRemaining - b.daysRemaining)
                            })()}
                        />
                    </CardContent>
                </Card>

                {/* Info Footer */}
                <div className="mt-8 text-center text-sm text-gray-500">
                    <div>
                        © 2025 SaaSCertificado. Todos os direitos reservados.
                    </div>
                </div>
            </div>
        </div>
    )
}
