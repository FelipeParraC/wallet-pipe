import { Prisma, TransactionType, WalletType } from '@prisma/client'
import { MoneyLike } from '@/interfaces'

const MONEY_FACTOR = 100
const ZERO_MINOR_UNITS = BigInt(0)

export const roundMoney = (value: number) => Math.round(value * MONEY_FACTOR) / MONEY_FACTOR

export const moneyInputToMinorUnits = (value: number) => BigInt(Math.round(value * MONEY_FACTOR))

export const moneyToMinorUnits = (value: MoneyLike | null | undefined) => {
  if (value === null || value === undefined) return ZERO_MINOR_UNITS
  if (typeof value === 'bigint') return value
  if (typeof value === 'number') return moneyInputToMinorUnits(value)
  return moneyInputToMinorUnits(value.toNumber())
}

export const moneyToNumber = (value: MoneyLike | null | undefined) => {
  if (value === null || value === undefined) return 0
  const minorUnits = moneyToMinorUnits(value)
  return roundMoney(Number(minorUnits) / MONEY_FACTOR)
}

export const normalizeOptionalMoney = (value: MoneyLike | null | undefined) => {
  if (value === null || value === undefined) return undefined
  return moneyToMinorUnits(value)
}

export const normalizeDateValue = (value: Date | string | number | bigint) => {
  if (value instanceof Date) return value
  if (typeof value === 'bigint') return new Date(Number(value))
  return new Date(value)
}

export const addMoney = (...values: number[]) => roundMoney(values.reduce((sum, value) => sum + value, 0))
export const addMinorUnits = (...values: bigint[]) => values.reduce((sum, value) => sum + value, ZERO_MINOR_UNITS)
export const absMinorUnits = (value: bigint) => (value < ZERO_MINOR_UNITS ? -value : value)
export const subtractMinorUnits = (left: bigint, right: bigint) => left - right

export const combineDateAndTime = (date: Date, time: string) => {
  const [hours, minutes, seconds = 0] = time.split(':').map(Number)
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    seconds,
    0
  ).getTime()
}

export const isTransferType = (type: TransactionType | string) => type === 'TRANSFERENCIA'

export const isTransportType = (type: TransactionType | string) => type === 'TRANSPORTE'

export const isCreditCardType = (type: TransactionType | string) => type === 'TARJETA_CONSUMO' || type === 'PAGO_TARJETA'

export const canUseFareValue = (walletType: WalletType | string) => walletType === 'TRANSPORTE' || walletType === 'Transporte'

export const isCreditCardWallet = (walletType: WalletType | string) => walletType === 'TARJETA_CREDITO' || walletType === 'Tarjeta de Crédito'

export const toSignedAmount = (type: TransactionType | string, amount: number) => {
  const absoluteAmount = roundMoney(Math.abs(amount))

  if (type === 'INGRESO') return absoluteAmount
  return -absoluteAmount
}

export const toTransferAmount = (amount: number) => -roundMoney(Math.abs(amount))

export const ensurePositiveMoney = (amount: number, fieldName: string) => {
  if (!Number.isFinite(amount) || roundMoney(amount) <= 0) {
    throw new Error(`${fieldName} debe ser mayor a 0`)
  }
}

export const ensureValidTimestamp = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error('La fecha de la transacción no es válida')
  }
}

export const getWalletTransferDelta = (
  transaction: { amount: number; fromWalletId?: string | null; toWalletId?: string | null; walletId: string; type: TransactionType | string },
  walletId: string,
) => {
  if (!isTransferType(transaction.type)) return roundMoney(transaction.amount)
  if (transaction.fromWalletId === walletId) return roundMoney(transaction.amount)
  if (transaction.toWalletId === walletId) return roundMoney(Math.abs(transaction.amount))
  return 0
}

export const updateWalletBalance = (wallet: { balance: MoneyLike }, delta: MoneyLike) => {
  const nextBalance = addMinorUnits(moneyToMinorUnits(wallet.balance), moneyToMinorUnits(delta))

  if (nextBalance < ZERO_MINOR_UNITS) {
    throw new Error('La billetera no tiene saldo suficiente para realizar esta operación')
  }

  return nextBalance
}

export const formatMinorUnitsLabel = (value: MoneyLike | null | undefined) => moneyToNumber(value)

export const asTransactionClient = (tx: Prisma.TransactionClient) => tx
