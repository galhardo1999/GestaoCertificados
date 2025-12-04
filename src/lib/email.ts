import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com'

export interface SendEmailParams {
    to: string
    subject: string
    html: string
}

/**
 * Send an email using Resend
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
    try {
        const result = await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        })
        return result
    } catch (error) {
        console.error('Error sending email:', error)
        throw error
    }
}

/**
 * Email template for 45-day planning alert
 */
export function get45DayAlertTemplate(holderName: string, expirationDate: string) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #fbbf24; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⏰ Alerta de Planejamento</h2>
          </div>
          <div class="content">
            <p>Olá,</p>
            <p>Seu certificado digital <strong>${holderName}</strong> está com vencimento programado para <strong>${expirationDate}</strong>.</p>
            <p>Faltam aproximadamente <strong>45 dias</strong> para o vencimento.</p>
            <p>💡 <strong>Sugestão:</strong> Vamos agendar a renovação para evitar correria de última hora e garantir que seu CNPJ continue emitindo notas fiscais sem interrupções.</p>
            <p>Entre em contato conosco para agendar a renovação.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Email template for 15-day urgency alert
 */
export function get15DayAlertTemplate(holderName: string, expirationDate: string) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f97316; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #fff7ed; padding: 30px; border-radius: 0 0 8px 8px; border: 2px solid #f97316; }
          .button { background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
          .warning { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>⚠️ URGENTE: Certificado Vencendo em Breve</h2>
          </div>
          <div class="content">
            <p>Olá,</p>
            <div class="warning">
              <strong>⚠️ ATENÇÃO:</strong> Faltam apenas <strong>15 dias</strong> para o vencimento do seu certificado digital!
            </div>
            <p>Certificado: <strong>${holderName}</strong></p>
            <p>Data de vencimento: <strong>${expirationDate}</strong></p>
            <p><strong>Se não renovar a tempo, o CNPJ para de emitir notas fiscais!</strong></p>
            <p>Entre em contato <strong>IMEDIATAMENTE</strong> para providenciar a renovação e evitar problemas com seu negócio.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Email template for 0-day critical alert (expiring today)
 */
export function get0DayAlertTemplate(holderName: string, expirationDate: string) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; border: 3px solid #dc2626; }
          .critical { background-color: #fee2e2; padding: 20px; border: 2px solid #dc2626; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🚨 CRÍTICO: Certificado Vencendo HOJE</h2>
          </div>
          <div class="content">
            <p>Olá,</p>
            <div class="critical">
              <h3 style="color: #dc2626; margin: 0;">🚨 CERTIFICADO VENCENDO HOJE!</h3>
            </div>
            <p>Certificado: <strong>${holderName}</strong></p>
            <p>Data de vencimento: <strong>${expirationDate}</strong></p>
            <p><strong style="color: #dc2626;">SEU CERTIFICADO VENCE HOJE! AÇÃO IMEDIATA NECESSÁRIA!</strong></p>
            <p>A partir de amanhã, você não poderá mais emitir notas fiscais com este certificado.</p>
            <p>Nossa equipe entrará em contato por telefone para auxiliar na renovação urgente.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

/**
 * Send admin notification for critical certificates
 */
export async function sendAdminNotification(holderName: string, userEmail: string, expirationDate: string) {
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail) {
        console.warn('ADMIN_EMAIL not configured, skipping admin notification')
        return
    }

    const html = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>🚨 Alerta de Certificado Crítico</h2>
        <p><strong>Cliente:</strong> ${userEmail}</p>
        <p><strong>Certificado:</strong> ${holderName}</p>
        <p><strong>Data de vencimento:</strong> ${expirationDate}</p>
        <p><strong>Ação necessária:</strong> Ligar para o cliente HOJE para auxiliar na renovação.</p>
      </body>
    </html>
  `

    await sendEmail({
        to: adminEmail,
        subject: `🚨 URGENTE: Certificado vencendo HOJE - ${holderName}`,
        html,
    })
}
