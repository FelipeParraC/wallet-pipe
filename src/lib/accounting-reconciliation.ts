import { absMinorUnits, addMinorUnits, moneyToMinorUnits, moneyToNumber } from './finance'

type MoneyValue = Parameters<typeof moneyToMinorUnits>[0]

export interface ReconciliationWallet {
  id: string
  name?: string
  type: string
  balance: MoneyValue
  includeInTotal?: boolean
  isSavingsBox?: boolean
  parentWalletId?: string | null
}

export interface ReconciliationTransaction {
  id: string
  walletId: string
  type: string
  amount: MoneyValue
  status?: string | null
  fromWalletId?: string | null
  toWalletId?: string | null
}

export interface WalletReconciliationDiff {
  walletId: string
  walletName?: string
  walletType: string
  actualBalance: number
  expectedBalance: number
  difference: number
  actualMinorUnits: bigint
  expectedMinorUnits: bigint
  differenceMinorUnits: bigint
}

const isCreditCardWalletType = (type: string) => type === 'TARJETA_CREDITO' || type === 'Tarjeta de Crédito'

const ensureWalletEntry = (balances: Map<string, bigint>, walletId: string) => {
  if (!balances.has(walletId)) balances.set(walletId, BigInt(0))
}

const addToWalletBalance = (balances: Map<string, bigint>, walletId: string | null | undefined, amount: bigint) => {
  if (!walletId) return
  ensureWalletEntry(balances, walletId)
  balances.set(walletId, addMinorUnits(balances.get(walletId) ?? BigInt(0), amount))
}

export const buildExpectedWalletBalances = (transactions: ReconciliationTransaction[]) => {
  const balances = new Map<string, bigint>()

  transactions
    .filter((transaction) => transaction.status !== 'CANCELADA')
    .forEach((transaction) => {
      const amount = moneyToMinorUnits(transaction.amount)

      if (transaction.type === 'TRANSFERENCIA') {
        addToWalletBalance(balances, transaction.fromWalletId ?? transaction.walletId, amount)
        addToWalletBalance(balances, transaction.toWalletId, absMinorUnits(amount))
        return
      }

      if (transaction.type === 'TARJETA_CONSUMO') {
        addToWalletBalance(balances, transaction.walletId, absMinorUnits(amount))
        return
      }

      if (transaction.type === 'PAGO_TARJETA') {
        addToWalletBalance(balances, transaction.fromWalletId ?? transaction.walletId, amount)
        addToWalletBalance(balances, transaction.toWalletId, -absMinorUnits(amount))
        return
      }

      addToWalletBalance(balances, transaction.walletId, amount)
    })

  return balances
}

export const reconcileWalletBalances = (
  wallets: ReconciliationWallet[],
  transactions: ReconciliationTransaction[],
) => {
  const expectedBalances = buildExpectedWalletBalances(transactions)

  return wallets
    .map((wallet): WalletReconciliationDiff => {
      const actualMinorUnits = moneyToMinorUnits(wallet.balance)
      const expectedMinorUnits = expectedBalances.get(wallet.id) ?? BigInt(0)
      const differenceMinorUnits = actualMinorUnits - expectedMinorUnits

      return {
        walletId: wallet.id,
        walletName: wallet.name,
        walletType: wallet.type,
        actualBalance: moneyToNumber(actualMinorUnits),
        expectedBalance: moneyToNumber(expectedMinorUnits),
        difference: moneyToNumber(differenceMinorUnits),
        actualMinorUnits,
        expectedMinorUnits,
        differenceMinorUnits,
      }
    })
    .filter((diff) => diff.differenceMinorUnits !== BigInt(0))
}

export const getWalletDisplayBalance = (wallet: ReconciliationWallet, wallets: ReconciliationWallet[]) => {
  if (wallet.isSavingsBox) return moneyToNumber(wallet.balance)

  const savingsBoxTotal = wallets
    .filter((item) => item.isSavingsBox && item.parentWalletId === wallet.id)
    .reduce((sum, item) => addMinorUnits(sum, moneyToMinorUnits(item.balance)), BigInt(0))

  return moneyToNumber(addMinorUnits(moneyToMinorUnits(wallet.balance), savingsBoxTotal))
}

export const calculateRealAvailable = (wallets: ReconciliationWallet[]) => (
  moneyToNumber(wallets
    .filter((wallet) => wallet.includeInTotal && !wallet.isSavingsBox && !isCreditCardWalletType(wallet.type))
    .reduce((sum, wallet) => addMinorUnits(sum, moneyToMinorUnits(wallet.balance)), BigInt(0)))
)
