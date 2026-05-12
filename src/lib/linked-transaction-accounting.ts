import { absMinorUnits, addMinorUnits, moneyToMinorUnits } from './finance'

type InstallmentOccurrenceForDeletion = {
  status: string
  linkedTransactionId?: string | null
  expectedAmount: bigint | number | { toNumber(): number }
}

export const getInstallmentPurchaseDeletionImpact = (occurrences: InstallmentOccurrenceForDeletion[]) => {
  const hasRealInstallmentPayments = occurrences.some((occurrence) => (
    occurrence.status === 'EJECUTADA' && Boolean(occurrence.linkedTransactionId)
  ))

  const importedPaidAmount = occurrences
    .filter((occurrence) => occurrence.status === 'EJECUTADA' && !occurrence.linkedTransactionId)
    .reduce((sum, occurrence) => addMinorUnits(sum, moneyToMinorUnits(occurrence.expectedAmount)), BigInt(0))

  return {
    hasRealInstallmentPayments,
    importedPaidAmount,
  }
}

export const getDebtBalanceAfterPaymentDeletion = (
  currentBalance: bigint | number | { toNumber(): number },
  transactionAmount: bigint | number | { toNumber(): number },
) => addMinorUnits(moneyToMinorUnits(currentBalance), absMinorUnits(moneyToMinorUnits(transactionAmount)))
