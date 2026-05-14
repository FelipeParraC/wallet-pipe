import type { CreditCardPaymentSummary, Wallet } from '@/interfaces'

interface CreditCardObligationLike extends CreditCardPaymentSummary {
  walletId: string
}

const emptyCreditCardPayment = (): CreditCardPaymentSummary => ({
  totalDue: 0,
  pendingAmount: 0,
  purchasesTotal: 0,
  installmentsTotal: 0,
  paymentsApplied: 0,
  installmentCount: 0,
})

export const attachCreditCardPaymentsToWallets = (
  wallets: Wallet[],
  obligations: CreditCardObligationLike[] = [],
) => {
  const obligationByWallet = new Map(obligations.map((obligation) => [obligation.walletId, obligation]))

  return wallets.map((wallet) => {
    if (wallet.type !== 'Tarjeta de Crédito') return wallet
    const obligation = obligationByWallet.get(wallet.id)
    return {
      ...wallet,
      creditCardPayment: obligation
        ? {
            statementStartsAt: obligation.statementStartsAt,
            statementEndsAt: obligation.statementEndsAt,
            paymentDueAt: obligation.paymentDueAt,
            totalDue: obligation.totalDue,
            pendingAmount: obligation.pendingAmount,
            purchasesTotal: obligation.purchasesTotal,
            installmentsTotal: obligation.installmentsTotal,
            paymentsApplied: obligation.paymentsApplied,
            installmentCount: obligation.installmentCount,
          }
        : emptyCreditCardPayment(),
    }
  })
}
