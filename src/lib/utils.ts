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

  // Reset hours to compare just dates
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
