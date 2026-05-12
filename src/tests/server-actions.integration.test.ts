import assert from 'node:assert/strict'
import { reconcileWalletBalances } from '../lib/accounting-reconciliation'
import { createTransactionInTx, deleteTransactionInTx, updateTransactionInTx, type TransactionServiceTx } from '../lib/transaction-service'
import { createWalletInTx } from '../lib/wallet-service'

type WalletRecord = {
  id: string
  userId: string
  balance: bigint
  isActive: boolean
  type: string
  createdAt: Date
  creditLimit?: bigint
  availableCredit?: bigint
}

type TransactionRecord = {
  id: string
  userId: string
  walletId: string
  type: string
  title: string
  description: string
  categoryId?: string | null
  amount: bigint
  occurredAt: Date
  recordedAt: Date
  isVisible: boolean
  fromWalletId?: string | null
  toWalletId?: string | null
  fareValue?: bigint | null
  numberOfTrips?: number | null
}

const cents = (value: number) => BigInt(Math.round(value * 100))

const createMemoryTx = () => {
  const state = {
    wallets: new Map<string, WalletRecord>([
      ['wallet-1', { id: 'wallet-1', userId: 'user-1', balance: cents(1000), isActive: true, type: 'CUENTA_BANCARIA', createdAt: new Date('2025-01-01T10:00:00.000Z') }],
      ['wallet-2', { id: 'wallet-2', userId: 'user-1', balance: cents(200), isActive: true, type: 'AHORROS', createdAt: new Date('2025-01-01T10:00:00.000Z') }],
      ['wallet-3', { id: 'wallet-3', userId: 'user-2', balance: cents(900), isActive: true, type: 'CUENTA_BANCARIA', createdAt: new Date('2025-01-01T10:00:00.000Z') }],
      ['wallet-credit', { id: 'wallet-credit', userId: 'user-1', balance: cents(0), isActive: true, type: 'TARJETA_CREDITO', creditLimit: cents(1000), availableCredit: cents(1000), createdAt: new Date('2025-01-01T10:00:00.000Z') }],
    ]),
    transactions: new Map<string, TransactionRecord>(),
    categories: new Set(['10', '11', '02']),
    nextTransactionId: 1,
    nextWalletId: 10,
  }

  const tx: TransactionServiceTx & {
    wallet: TransactionServiceTx['wallet'] & { create: (args: { data: Record<string, unknown> }) => Promise<{ id: string, createdAt: Date }> }
    state: typeof state
  } = {
    state,
    wallet: {
      findUnique: async ({ where: { id } }) => state.wallets.get(id) ?? null,
      update: async ({ where: { id }, data }) => {
        const current = state.wallets.get(id)
        if (!current) throw new Error('wallet not found')
        const next = { ...current, ...data } as WalletRecord
        state.wallets.set(id, next)
        return next
      },
      create: async ({ data }) => {
        const id = `wallet-${state.nextWalletId++}`
        const createdAt = new Date('2025-01-01T12:00:00.000Z')
        const wallet = {
          id,
          createdAt,
          isActive: true,
          ...data,
        } as unknown as WalletRecord
        state.wallets.set(id, wallet)
        return { id, createdAt }
      }
    },
    transaction: {
      create: async ({ data }) => {
        const id = `tx-${state.nextTransactionId++}`
        const txRecord = { id, ...data } as unknown as TransactionRecord
        state.transactions.set(id, txRecord)
        return txRecord
      },
      findFirst: async ({ where }) => {
        if ('id' in where && typeof where.id === 'string') {
          return state.transactions.get(where.id) ?? null
        }
        return null
      },
      update: async ({ where: { id }, data }) => {
        const current = state.transactions.get(id)
        if (!current) throw new Error('transaction not found')
        const next = { ...current, ...data } as TransactionRecord
        state.transactions.set(id, next)
        return next
      },
      delete: async ({ where: { id } }) => {
        const current = state.transactions.get(id)
        state.transactions.delete(id)
        return current ?? null
      }
    },
    category: {
      findUnique: async ({ where: { id } }) => state.categories.has(id) ? { id } : null
    }
  }

  return tx
}

const testCreateWalletInTx = async () => {
  const tx = createMemoryTx()
  const wallet = await createWalletInTx(tx, 'user-1', {
    name: 'Ahorros',
    balance: 123.456,
    type: 'Ahorros',
    color: '#000',
    includeInTotal: true,
  })

  const storedWallet = tx.state.wallets.get(wallet.id)
  assert.ok(storedWallet)
  assert.equal(storedWallet?.balance, cents(123.46))
  assert.equal(tx.state.transactions.size, 1)
}

const testCreateTransferInTx = async () => {
  const tx = createMemoryTx()
  const transaction = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'TRANSFERENCIA',
    title: 'Mover dinero',
    description: 'Paso entre billeteras',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '11',
    amount: -300,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-2',
  })

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(700))
  assert.equal(tx.state.wallets.get('wallet-2')?.balance, cents(500))
  assert.equal((transaction as TransactionRecord).amount, cents(-300))
  assert.ok((transaction as TransactionRecord).occurredAt instanceof Date)
}

const testUpdateTransferInTx = async () => {
  const tx = createMemoryTx()
  const created = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'TRANSFERENCIA',
    title: 'Mover dinero',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '11',
    amount: -300,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-2',
  }) as TransactionRecord

  await updateTransactionInTx(tx, 'user-1', created.id, {
    title: 'Mover dinero editado',
    description: 'edit',
    date: Date.parse('2025-01-03T09:30:00.000Z'),
    categoryId: '11',
    newAmount: -450,
    walletId: 'wallet-1',
    type: 'TRANSFERENCIA',
    amount: -300,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-2',
  })

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(550))
  assert.equal(tx.state.wallets.get('wallet-2')?.balance, cents(650))
}

const testDeleteTransferInTx = async () => {
  const tx = createMemoryTx()
  const created = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'TRANSFERENCIA',
    title: 'Mover dinero',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '11',
    amount: -300,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-2',
  }) as TransactionRecord

  await deleteTransactionInTx(tx, 'user-1', created.id)

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(1000))
  assert.equal(tx.state.wallets.get('wallet-2')?.balance, cents(200))
  assert.equal(tx.state.transactions.has(created.id), false)
}

const testDeleteStandardMovementsInTx = async () => {
  const tx = createMemoryTx()
  const expense = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'GASTO',
    title: 'Mercado',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '10',
    amount: -75,
  }) as TransactionRecord

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(925))

  await deleteTransactionInTx(tx, 'user-1', expense.id)

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(1000))
  assert.equal(tx.state.transactions.has(expense.id), false)

  const income = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'INGRESO',
    title: 'Ingreso',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '11',
    amount: 125,
  }) as TransactionRecord

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(1125))

  await deleteTransactionInTx(tx, 'user-1', income.id)

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(1000))
  assert.equal(tx.state.transactions.has(income.id), false)
}

const testUpdateStandardMovementInTx = async () => {
  const tx = createMemoryTx()
  const expense = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'GASTO',
    title: 'Mercado',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '10',
    amount: -75,
  }) as TransactionRecord

  await updateTransactionInTx(tx, 'user-1', expense.id, {
    title: 'Mercado editado',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '10',
    newAmount: -110,
    walletId: 'wallet-1',
    type: 'GASTO',
    amount: -75,
  })

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(890))
  assert.equal(tx.state.transactions.get(expense.id)?.amount, cents(-110))
}

const testOwnershipValidation = async () => {
  const tx = createMemoryTx()
  await assert.rejects(
    () => createTransactionInTx(tx, 'user-1', {
      walletId: 'wallet-3',
      type: 'GASTO',
      title: 'Ajeno',
      description: '',
      date: Date.parse('2025-01-02T08:00:00.000Z'),
      categoryId: '10',
      amount: -50,
    }),
    /no pertenece al usuario/
  )

  await assert.rejects(
    () => createTransactionInTx(tx, 'user-1', {
      walletId: 'wallet-1',
      type: 'TRANSFERENCIA',
      title: 'Transferencia ajena',
      description: '',
      date: Date.parse('2025-01-02T08:00:00.000Z'),
      categoryId: '11',
      amount: -50,
      fromWalletId: 'wallet-1',
      toWalletId: 'wallet-3',
    }),
    /no pertenece al usuario/
  )
}

const testCreditCardChargeAndPayment = async () => {
  const tx = createMemoryTx()

  const charge = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-credit',
    type: 'TARJETA_CONSUMO',
    title: 'Audífonos',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '10',
    amount: -250,
  }) as TransactionRecord

  assert.equal(tx.state.wallets.get('wallet-credit')?.balance, cents(250))
  assert.equal(tx.state.wallets.get('wallet-credit')?.availableCredit, cents(750))

  await deleteTransactionInTx(tx, 'user-1', charge.id)
  assert.equal(tx.state.wallets.get('wallet-credit')?.balance, cents(0))
  assert.equal(tx.state.wallets.get('wallet-credit')?.availableCredit, cents(1000))

  await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-credit',
    type: 'TARJETA_CONSUMO',
    title: 'Celular',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '10',
    amount: -300,
  })

  const payment = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'PAGO_TARJETA',
    title: 'Pago TC',
    description: '',
    date: Date.parse('2025-01-03T10:00:00.000Z'),
    categoryId: '11',
    amount: -120,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-credit',
  }) as TransactionRecord

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(880))
  assert.equal(tx.state.wallets.get('wallet-credit')?.balance, cents(180))
  assert.equal(tx.state.wallets.get('wallet-credit')?.availableCredit, cents(820))

  await deleteTransactionInTx(tx, 'user-1', payment.id)

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(1000))
  assert.equal(tx.state.wallets.get('wallet-credit')?.balance, cents(300))
  assert.equal(tx.state.wallets.get('wallet-credit')?.availableCredit, cents(700))
  assert.equal(tx.state.transactions.has(payment.id), false)
}

const testUpdateCreditCardPayment = async () => {
  const tx = createMemoryTx()

  await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-credit',
    type: 'TARJETA_CONSUMO',
    title: 'Celular',
    description: '',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    categoryId: '10',
    amount: -300,
  })

  const payment = await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'PAGO_TARJETA',
    title: 'Pago TC',
    description: '',
    date: Date.parse('2025-01-03T10:00:00.000Z'),
    categoryId: '11',
    amount: -120,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-credit',
  }) as TransactionRecord

  await updateTransactionInTx(tx, 'user-1', payment.id, {
    title: 'Pago TC editado',
    description: '',
    date: Date.parse('2025-01-03T10:00:00.000Z'),
    categoryId: '11',
    newAmount: -180,
    walletId: 'wallet-1',
    type: 'PAGO_TARJETA',
    amount: -120,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-credit',
  })

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(820))
  assert.equal(tx.state.wallets.get('wallet-credit')?.balance, cents(120))
  assert.equal(tx.state.wallets.get('wallet-credit')?.availableCredit, cents(880))
}

const testSavingsBoxTransferReconciliation = async () => {
  const tx = createMemoryTx()
  tx.state.wallets.set('wallet-box', {
    id: 'wallet-box',
    userId: 'user-1',
    balance: cents(0),
    isActive: true,
    type: 'AHORROS',
    createdAt: new Date('2025-01-01T10:00:00.000Z'),
  })

  await createTransactionInTx(tx, 'user-1', {
    walletId: 'wallet-1',
    type: 'TRANSFERENCIA',
    title: 'Agregar a cajita: Viaje',
    description: 'Movimiento interno de cajita',
    date: Date.parse('2025-01-02T08:00:00.000Z'),
    amount: -50,
    fromWalletId: 'wallet-1',
    toWalletId: 'wallet-box',
  })

  assert.equal(tx.state.wallets.get('wallet-1')?.balance, cents(950))
  assert.equal(tx.state.wallets.get('wallet-box')?.balance, cents(50))
  const baselineTransactions: TransactionRecord[] = [
    {
      id: 'baseline-wallet-1',
      userId: 'user-1',
      walletId: 'wallet-1',
      type: 'INGRESO',
      title: 'Saldo inicial',
      description: '',
      amount: cents(1000),
      occurredAt: new Date(),
      recordedAt: new Date(),
      isVisible: false,
    },
    {
      id: 'baseline-wallet-2',
      userId: 'user-1',
      walletId: 'wallet-2',
      type: 'INGRESO',
      title: 'Saldo inicial',
      description: '',
      amount: cents(200),
      occurredAt: new Date(),
      recordedAt: new Date(),
      isVisible: false,
    },
  ]

  assert.equal(reconcileWalletBalances(
    Array.from(tx.state.wallets.values()).filter((wallet) => wallet.userId === 'user-1'),
    [...baselineTransactions, ...Array.from(tx.state.transactions.values()).filter((transaction) => transaction.userId === 'user-1')],
  ).length, 0)
}

;(async () => {
  await testCreateWalletInTx()
  await testCreateTransferInTx()
  await testUpdateTransferInTx()
  await testDeleteTransferInTx()
  await testDeleteStandardMovementsInTx()
  await testUpdateStandardMovementInTx()
  await testOwnershipValidation()
  await testCreditCardChargeAndPayment()
  await testUpdateCreditCardPayment()
  await testSavingsBoxTransferReconciliation()

  console.log('server-actions.integration.test.ts passed')
})()
