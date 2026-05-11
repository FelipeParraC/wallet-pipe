import type { Transaction, Wallet } from '@/interfaces'

export const isSavingsBoxInternalTransfer = (transaction: Transaction, wallets: Wallet[]) => {
  if (transaction.type !== 'TRANSFERENCIA' || !transaction.fromWalletId || !transaction.toWalletId) return false

  const fromWallet = wallets.find((wallet) => wallet.id === transaction.fromWalletId)
  const toWallet = wallets.find((wallet) => wallet.id === transaction.toWalletId)

  return Boolean(
    (fromWallet?.isSavingsBox && fromWallet.parentWalletId === toWallet?.id)
    || (toWallet?.isSavingsBox && toWallet.parentWalletId === fromWallet?.id),
  )
}
