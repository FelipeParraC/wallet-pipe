import assert from 'node:assert/strict'
import { buildExpectedWalletBalances, calculateRealAvailable, getWalletDisplayBalance, reconcileWalletBalances } from '../lib/accounting-reconciliation'
import { calculateCreditCardCycleObligations } from '../lib/credit-card-obligations'
import { combineDateAndTime, getWalletTransferDelta, roundMoney, toSignedAmount, toTransferAmount } from '../lib/finance'
import { getDebtBalanceAfterPaymentDeletion, getInstallmentPurchaseDeletionImpact } from '../lib/linked-transaction-accounting'
import { assertProtectedTransactionAmountIsUnchanged, isAmountProtectedTransaction } from '../lib/linked-transaction-guards'
import { PrismaOperationTimeoutError } from '../lib/prisma-timeout'
import { classifyServerError, getSafeErrorMessage } from '../lib/server-action-logging'
import { isSavingsBoxInternalTransfer } from '../lib/savings-box'
import { isTransferTransaction, isTransportTransaction, type Transaction } from '../interfaces/transaction.interface'

const expense = toSignedAmount('GASTO', 10000)
assert.equal(expense, -10000)

const income = toSignedAmount('INGRESO', 2550.456)
assert.equal(income, 2550.46)

const transfer = toTransferAmount(3300)
assert.equal(transfer, -3300)

const transport: Transaction = {
  id: '1',
  userId: '1',
  type: 'TRANSPORTE',
  walletId: 'wallet-1',
  title: 'Bus',
  description: '',
  date: new Date().toISOString(),
  occurredAt: new Date().toISOString(),
  recordedAt: new Date().toISOString(),
  categoryId: '02',
  amount: -2950,
  isVisible: true,
  fareValue: 2950,
  numberOfTrips: 1,
}

assert.equal(isTransportTransaction(transport), true)

const transferTransaction: Transaction = {
  id: '2',
  userId: '1',
  type: 'TRANSFERENCIA',
  walletId: 'wallet-1',
  title: 'Move',
  description: '',
  date: new Date().toISOString(),
  occurredAt: new Date().toISOString(),
  recordedAt: new Date().toISOString(),
  categoryId: '11',
  amount: -5000,
  isVisible: true,
  fromWalletId: 'wallet-1',
  toWalletId: 'wallet-2',
}

assert.equal(isTransferTransaction(transferTransaction), true)
assert.equal(getWalletTransferDelta(transferTransaction, 'wallet-1'), -5000)
assert.equal(getWalletTransferDelta(transferTransaction, 'wallet-2'), 5000)
assert.equal(roundMoney(12.345), 12.35)

const mergedDate = combineDateAndTime(new Date('2025-01-01T00:00:00.000Z'), '08:45')
const mergedHours = new Date(mergedDate).getHours()
const mergedMinutes = new Date(mergedDate).getMinutes()
assert.equal(mergedHours, 8)
assert.equal(mergedMinutes, 45)

const cardObligations = calculateCreditCardCycleObligations({
  cards: [{
    id: 'card-1',
    name: 'Visa',
    balance: BigInt(5000000),
    type: 'TARJETA_CREDITO',
    statementClosingDay: 23,
    paymentDueDay: 5,
  }],
  transactions: [
    {
      id: 'purchase-1',
      walletId: 'card-1',
      type: 'TARJETA_CONSUMO',
      amount: BigInt(-2000000),
      occurredAt: new Date('2026-04-10T12:00:00.000Z'),
    },
    {
      id: 'payment-1',
      walletId: 'bank-1',
      toWalletId: 'card-1',
      type: 'PAGO_TARJETA',
      amount: BigInt(-500000),
      occurredAt: new Date('2026-05-02T12:00:00.000Z'),
    },
    {
      id: 'refund-1',
      walletId: 'card-1',
      type: 'TARJETA_DEVOLUCION',
      amount: BigInt(300000),
      occurredAt: new Date('2026-05-03T12:00:00.000Z'),
      refundedTransactionId: 'purchase-1',
    },
  ],
  installmentOccurrences: [{
    id: 'installment-1',
    dueAt: new Date('2026-05-05T12:00:00.000Z'),
    expectedAmount: BigInt(300000),
    status: 'PENDIENTE',
    installmentPlan: {
      chargeWalletId: 'card-1',
      title: 'Laptop',
    },
  }],
  cycleStartsAt: new Date('2026-04-23T00:00:00.000Z'),
  cycleEndsAt: new Date('2026-05-22T23:59:59.999Z'),
})

assert.equal(cardObligations.length, 1)
assert.equal(cardObligations[0].totalDue, 20000)
assert.equal(cardObligations[0].paymentsApplied, 5000)
assert.equal(cardObligations[0].pendingAmount, 15000)

const cardDebtFallback = calculateCreditCardCycleObligations({
  cards: [{
    id: 'card-2',
    name: 'Nu Credito',
    balance: BigInt(33326666),
    type: 'TARJETA_CREDITO',
    statementClosingDay: 25,
    paymentDueDay: 14,
  }],
  transactions: [],
  installmentOccurrences: [],
  cycleStartsAt: new Date('2026-04-25T00:00:00.000Z'),
  cycleEndsAt: new Date('2026-05-24T23:59:59.999Z'),
})

assert.equal(cardDebtFallback.length, 1)
assert.equal(cardDebtFallback[0].totalDue, 333266.66)
assert.equal(cardDebtFallback[0].pendingAmount, 333266.66)

assert.equal(isSavingsBoxInternalTransfer({
  ...transferTransaction,
  fromWalletId: 'wallet-parent',
  toWalletId: 'wallet-box',
}, [
  {
    id: 'wallet-parent',
    userId: '1',
    name: 'Davivienda',
    balance: 2450000,
    type: 'Cuenta Bancaria',
    color: '#ef4444',
    includeInTotal: true,
    isSavingsBox: false,
    isActive: true,
  },
  {
    id: 'wallet-box',
    userId: '1',
    parentWalletId: 'wallet-parent',
    name: 'Viaje',
    balance: 50000,
    type: 'Ahorros',
    color: '#38bdf8',
    includeInTotal: false,
    isSavingsBox: true,
    isActive: true,
  },
]), true)

const reconciliationTransactions = [
  { id: 'initial-parent', walletId: 'wallet-parent', type: 'INGRESO', amount: 2500000 },
  { id: 'open-box', walletId: 'wallet-parent', type: 'TRANSFERENCIA', amount: -50000, fromWalletId: 'wallet-parent', toWalletId: 'wallet-box' },
  { id: 'card-buy', walletId: 'card-1', type: 'TARJETA_CONSUMO', amount: -333266.66 },
  { id: 'card-refund', walletId: 'card-1', type: 'TARJETA_DEVOLUCION', amount: 100000 },
  { id: 'card-pay', walletId: 'wallet-parent', type: 'PAGO_TARJETA', amount: -100000, fromWalletId: 'wallet-parent', toWalletId: 'card-1' },
]
const expectedBalances = buildExpectedWalletBalances(reconciliationTransactions)
assert.equal(expectedBalances.get('wallet-parent'), BigInt(235000000))
assert.equal(expectedBalances.get('wallet-box'), BigInt(5000000))
assert.equal(expectedBalances.get('card-1'), BigInt(13326666))

const reconciledWallets = [
  {
    id: 'wallet-parent',
    userId: '1',
    name: 'Davivienda',
    balance: 2350000,
    type: 'Cuenta Bancaria' as const,
    color: '#ef4444',
    includeInTotal: true,
    isSavingsBox: false,
    isActive: true,
  },
  {
    id: 'wallet-box',
    userId: '1',
    parentWalletId: 'wallet-parent',
    name: 'Viaje',
    balance: 50000,
    type: 'Ahorros' as const,
    color: '#38bdf8',
    includeInTotal: false,
    isSavingsBox: true,
    isActive: true,
  },
  {
    id: 'card-1',
    userId: '1',
    name: 'Nu Crédito',
    balance: 133266.66,
    type: 'Tarjeta de Crédito' as const,
    color: '#8b5cf6',
    includeInTotal: false,
    isSavingsBox: false,
    isActive: true,
  },
]

assert.equal(reconcileWalletBalances(reconciledWallets, reconciliationTransactions).length, 0)
assert.deepEqual(
  reconcileWalletBalances([{ ...reconciledWallets[0], balance: 2350100 }, ...reconciledWallets.slice(1)], reconciliationTransactions).map((diff) => ({
    walletId: diff.walletId,
    difference: diff.difference,
  })),
  [{ walletId: 'wallet-parent', difference: 100 }],
)
assert.equal(getWalletDisplayBalance(reconciledWallets[0], reconciledWallets), 2400000)
assert.equal(calculateRealAvailable(reconciledWallets), 2350000)

assert.equal(classifyServerError(new PrismaOperationTimeoutError('test', 10)), 'infrastructure')
assert.equal(getSafeErrorMessage(new PrismaOperationTimeoutError('test', 10)), 'No pudimos conectar con la base de datos. Inténtalo de nuevo en un momento.')
assert.equal(classifyServerError(new Error("Can't reach database server at `example:5432`")), 'infrastructure')
assert.equal(getSafeErrorMessage(new Error("Can't reach database server at `example:5432`")), 'No pudimos conectar con la base de datos. Inténtalo de nuevo en un momento.')
assert.equal(classifyServerError(new Error('No hay sesión de usuario')), 'session')
assert.equal(getSafeErrorMessage(new Error('No hay sesión de usuario')), 'Debes iniciar sesión de nuevo.')
assert.equal(classifyServerError(new Error('El monto debe ser mayor a 0')), 'domain')
assert.equal(getSafeErrorMessage(new Error('El monto debe ser mayor a 0')), 'El monto debe ser mayor a 0')
assert.equal(classifyServerError('boom'), 'unknown')
assert.equal(getSafeErrorMessage('boom'), 'Ocurrió un error inesperado')

const linkedPayment = {
  amount: BigInt(-1200000),
  type: 'GASTO',
  scheduledOccurrenceId: 'occurrence-1',
}
assert.equal(isAmountProtectedTransaction(linkedPayment), true)
assert.doesNotThrow(() => assertProtectedTransactionAmountIsUnchanged(linkedPayment, -12000))
assert.throws(
  () => assertProtectedTransactionAmountIsUnchanged(linkedPayment, -13000),
  /No puedes cambiar el monto de un movimiento vinculado/,
)
assert.equal(isAmountProtectedTransaction({ amount: BigInt(-1200000), type: 'PAGO_TARJETA' }), true)
assert.throws(
  () => assertProtectedTransactionAmountIsUnchanged({ amount: BigInt(-1200000), type: 'PAGO_TARJETA' }, -11000),
  /No puedes cambiar el monto de un movimiento vinculado/,
)
assert.equal(isAmountProtectedTransaction({ amount: BigInt(-1200000), type: 'GASTO' }), false)

assert.deepEqual(
  getInstallmentPurchaseDeletionImpact([
    { status: 'EJECUTADA', linkedTransactionId: null, expectedAmount: BigInt(500000) },
    { status: 'PENDIENTE', linkedTransactionId: null, expectedAmount: BigInt(500000) },
  ]),
  { hasRealInstallmentPayments: false, importedPaidAmount: BigInt(500000) },
)
assert.deepEqual(
  getInstallmentPurchaseDeletionImpact([
    { status: 'EJECUTADA', linkedTransactionId: 'tx-1', expectedAmount: BigInt(500000) },
  ]),
  { hasRealInstallmentPayments: true, importedPaidAmount: BigInt(0) },
)
assert.equal(getDebtBalanceAfterPaymentDeletion(BigInt(400000), BigInt(-150000)), BigInt(550000))

console.log('domain.test.ts passed')
