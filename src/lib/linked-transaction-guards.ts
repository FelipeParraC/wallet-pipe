import { absMinorUnits, moneyInputToMinorUnits, moneyToMinorUnits } from './finance'

type LinkedTransactionGuardInput = {
  amount: bigint | number | { toNumber(): number }
  type: string
  scheduledPlanId?: string | null
  scheduledOccurrenceId?: string | null
  installmentPlanId?: string | null
  installmentOccurrenceId?: string | null
  debtId?: string | null
}

export const isAmountProtectedTransaction = (transaction: LinkedTransactionGuardInput) => (
  transaction.type === 'PAGO_TARJETA'
  || Boolean(transaction.scheduledPlanId)
  || Boolean(transaction.scheduledOccurrenceId)
  || Boolean(transaction.installmentPlanId)
  || Boolean(transaction.installmentOccurrenceId)
  || Boolean(transaction.debtId)
)

export const assertProtectedTransactionAmountIsUnchanged = (
  transaction: LinkedTransactionGuardInput,
  nextAmount: number,
) => {
  if (!isAmountProtectedTransaction(transaction)) return

  const currentAmount = absMinorUnits(moneyToMinorUnits(transaction.amount))
  const requestedAmount = absMinorUnits(moneyInputToMinorUnits(nextAmount))

  if (currentAmount !== requestedAmount) {
    throw new Error('No puedes cambiar el monto de un movimiento vinculado. Borra o reabre el pago desde su origen para mantener la contabilidad.')
  }
}
