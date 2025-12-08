import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateBR(date: Date | string): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

export function calculateDaysRemaining(date: Date | string): number {
  if (!date) return 0
  const targetDate = new Date(date)
  const today = new Date()

  // Redefinir horas para comparar apenas datas
  targetDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

export function getCertificateStatus(expirationDate: Date | string): 'valid' | 'warning' | 'expired' {
  const days = calculateDaysRemaining(expirationDate)

  if (days < 0) return 'expired'
  if (days <= 30) return 'warning'
  return 'valid'
}

export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return ''
  const numbers = cnpj.replace(/\D/g, '')
  if (numbers.length !== 14) return cnpj
  return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatPhone(phone: string): string {
  if (!phone) return ''
  const numbers = phone.replace(/\D/g, '')

  if (numbers.length === 11) {
    return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')
  }

  if (numbers.length === 10) {
    return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3')
  }

  return phone
}

export function formatCEP(cep: string): string {
  if (!cep) return ''
  const numbers = cep.replace(/\D/g, '')
  if (numbers.length === 8) {
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2')
  }
  return cep
}
