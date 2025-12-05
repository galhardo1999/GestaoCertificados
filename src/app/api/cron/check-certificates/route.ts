import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { calculateDaysRemaining, formatDateBR } from '@/lib/utils'
import {
    sendEmail,
    get45DayAlertTemplate,
    get15DayAlertTemplate,
    get0DayAlertTemplate,
    sendAdminNotification,
} from '@/lib/email'

/**
 * Cron job to check certificate expiration and send notifications
 * Runs daily at 8:00 AM via Vercel Cron
 */
export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[CRON] Starting certificate expiration check...')

        // Get all active certificates
        const certificates = await prisma.certificado.findMany({
            where: {
                status: 'ATIVO',
            },
            include: {
                usuario: true,
            },
        })

        console.log(`[CRON] Found ${certificates.length} active certificates`)

        let notificationsSent = 0
        let certificatesExpired = 0

        for (const certificate of certificates) {
            const daysRemaining = calculateDaysRemaining(certificate.dataVencimento)
            const formattedDate = formatDateBR(certificate.dataVencimento)

            console.log(
                `[CRON] Certificate ${certificate.id} (${certificate.nomeTitular}): ${daysRemaining} days remaining`
            )

            // Mark as expired if past expiration
            if (daysRemaining < 0) {
                await prisma.certificado.update({
                    where: { id: certificate.id },
                    data: { status: 'EXPIRADO' },
                })
                certificatesExpired++
                console.log(`[CRON] Marked certificate ${certificate.id} as EXPIRED`)
                continue
            }

            // Check notification thresholds
            let shouldNotify = false
            let notificationType: 'PLANEJAMENTO_45_DIAS' | 'URGENCIA_15_DIAS' | 'CRITICO_0_DIAS' | null = null
            let emailTemplate = ''

            if (daysRemaining === 45) {
                notificationType = 'PLANEJAMENTO_45_DIAS'
                emailTemplate = get45DayAlertTemplate(certificate.nomeTitular, formattedDate)
                shouldNotify = true
            } else if (daysRemaining === 15) {
                notificationType = 'URGENCIA_15_DIAS'
                emailTemplate = get15DayAlertTemplate(certificate.nomeTitular, formattedDate)
                shouldNotify = true
            } else if (daysRemaining === 0) {
                notificationType = 'CRITICO_0_DIAS'
                emailTemplate = get0DayAlertTemplate(certificate.nomeTitular, formattedDate)
                shouldNotify = true
            }

            if (shouldNotify && notificationType) {
                // Check if notification was already sent today
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const existingLog = await prisma.logNotificacao.findFirst({
                    where: {
                        certificadoId: certificate.id,
                        tipoNotificacao: notificationType,
                        enviadoEm: {
                            gte: today,
                        },
                    },
                })

                if (existingLog) {
                    console.log(
                        `[CRON] Notification already sent for certificate ${certificate.id} (${notificationType})`
                    )
                    continue
                }

                // Send email notification
                try {
                    await sendEmail({
                        to: certificate.usuario.email,
                        subject: `⚠️ Alerta: Certificado Digital - ${certificate.nomeTitular}`,
                        html: emailTemplate,
                    })

                    // Log the notification
                    await prisma.logNotificacao.create({
                        data: {
                            certificadoId: certificate.id,
                            tipoNotificacao: notificationType,
                        },
                    })

                    notificationsSent++
                    console.log(
                        `[CRON] Sent ${notificationType} notification for certificate ${certificate.id}`
                    )

                    // Send admin notification for critical certificates
                    if (daysRemaining === 0) {
                        await sendAdminNotification(
                            certificate.nomeTitular,
                            certificate.usuario.email,
                            formattedDate
                        )
                        console.log(`[CRON] Sent admin notification for certificate ${certificate.id}`)
                    }
                } catch (error) {
                    console.error(`[CRON] Error sending notification for certificate ${certificate.id}:`, error)
                }
            }
        }

        const summary = {
            totalCertificates: certificates.length,
            notificationsSent,
            certificatesExpired,
            timestamp: new Date().toISOString(),
        }

        console.log('[CRON] Summary:', summary)

        return NextResponse.json({
            success: true,
            ...summary,
        })
    } catch (error) {
        console.error('[CRON] Error in certificate check:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
