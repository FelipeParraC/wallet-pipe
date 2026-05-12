import type { TransactionType } from '@/interfaces'

const transactionTypeLabels: Record<TransactionType, string> = {
  INGRESO: 'Ingreso',
  GASTO: 'Gasto',
  TRANSPORTE: 'Transporte',
  TRANSFERENCIA: 'Transferencia',
  TARJETA_CONSUMO: 'Compra con tarjeta',
  TARJETA_DEVOLUCION: 'Devolución de tarjeta',
  PAGO_TARJETA: 'Pago de tarjeta',
  DEUDA_PRESTAMO: 'Préstamo o deuda',
  DEUDA_ABONO: 'Abono a deuda',
}

const scheduledPlanKindLabels: Record<string, string> = {
  SUSCRIPCION: 'Suscripción',
  SERVICIO: 'Servicio',
  PAGO_PROGRAMADO: 'Pago programado',
}

const recurrenceFrequencyLabels: Record<string, string> = {
  DIARIA: 'Diaria',
  SEMANAL: 'Semanal',
  MENSUAL: 'Mensual',
  ANUAL: 'Anual',
}

const walletTypeLabels: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  CUENTA_BANCARIA: 'Cuenta bancaria',
  AHORROS: 'Ahorros',
  TRANSPORTE: 'Transporte',
  TARJETA_CREDITO: 'Tarjeta de crédito',
}

const fallbackLabel = (value: string) => (
  value
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
)

export const getTransactionTypeLabel = (type: TransactionType) => transactionTypeLabels[type] ?? fallbackLabel(type)

export const getScheduledPlanKindLabel = (kind: string) => scheduledPlanKindLabels[kind] ?? fallbackLabel(kind)

export const getRecurrenceFrequencyLabel = (frequency: string) => recurrenceFrequencyLabels[frequency] ?? fallbackLabel(frequency)

export const getWalletTypeLabel = (type: string) => walletTypeLabels[type] ?? fallbackLabel(type)
