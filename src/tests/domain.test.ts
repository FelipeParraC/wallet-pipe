import assert from 'node:assert/strict'
import { combineDateAndTime, getWalletTransferDelta, roundMoney, toSignedAmount, toTransferAmount } from '../lib/finance'
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

console.log('domain.test.ts passed')
