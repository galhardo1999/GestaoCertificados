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
        const certificates = await prisma.certificate.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                user: true,
            },
        })

        console.log(`[CRON] Found ${certificates.length} active certificates`)

        let notificationsSent = 0
        let certificatesExpired = 0

        for (const certificate of certificates) {
            const daysRemaining = calculateDaysRemaining(certificate.expirationDate)
            const formattedDate = formatDateBR(certificate.expirationDate)

            console.log(
                `[CRON] Certificate ${certificate.id} (${certificate.holderName}): ${daysRemaining} days remaining`
            )

            // Mark as expired if past expiration
            if (daysRemaining < 0) {
                await prisma.certificate.update({
                    where: { id: certificate.id },
                    data: { status: 'EXPIRED' },
                })
                certificatesExpired++
                console.log(`[CRON] Marked certificate ${certificate.id} as EXPIRED`)
                continue
            }

            // Check notification thresholds
            let shouldNotify = false
            let notificationType: 'PLANNING_45_DAYS' | 'URGENCY_15_DAYS' | 'CRITICAL_0_DAYS' | null = null
            let emailTemplate = ''

            if (daysRemaining === 45) {
                notificationType = 'PLANNING_45_DAYS'
                emailTemplate = get45DayAlertTemplate(certificate.holderName, formattedDate)
                shouldNotify = true
            } else if (daysRemaining === 15) {
                notificationType = 'URGENCY_15_DAYS'
                emailTemplate = get15DayAlertTemplate(certificate.holderName, formattedDate)
                shouldNotify = true
            } else if (daysRemaining === 0) {
                notificationType = 'CRITICAL_0_DAYS'
                emailTemplate = get0DayAlertTemplate(certificate.holderName, formattedDate)
                shouldNotify = true
            }

            if (shouldNotify && notificationType) {
                // Check if notification was already sent today
                const today = new Date()
                today.setHours(0, 0, 0, 0)

                const existingLog = await prisma.notificationLog.findFirst({
                    where: {
                        certificateId: certificate.id,
                        notificationType,
                        sentAt: {
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
                        to: certificate.user.email,
                        subject: `⚠️ Alerta: Certificado Digital - ${certificate.holderName}`,
                        html: emailTemplate,
                    })

                    // Log the notification
                    await prisma.notificationLog.create({
                        data: {
                            certificateId: certificate.id,
                            notificationType,
                        },
                    })

                    notificationsSent++
                    console.log(
                        `[CRON] Sent ${notificationType} notification for certificate ${certificate.id}`
                    )

                    // Send admin notification for critical certificates
                    if (daysRemaining === 0) {
                        await sendAdminNotification(
                            certificate.holderName,
                            certificate.user.email,
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
