'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import { actionSuccess } from '@/lib/action-response'
import { absMinorUnits, moneyInputToMinorUnits, moneyToMinorUnits, moneyToNumber } from '@/lib/finance'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { createTransactionInTx } from '@/lib/transaction-service'
import type { CreateTransactionInput, TransactionType } from '@/interfaces'

type BaseMovementInput = {
  title: string
  description?: string
  occurredAt: string
  categoryId?: string
}

type StandardMovementInput = BaseMovementInput & {
  kind: 'STANDARD'
  type: Extract<TransactionType, 'INGRESO' | 'GASTO'>
  walletId: string
  amount: number
}

type TransportMovementInput = BaseMovementInput & {
  kind: 'TRANSPORT'
  walletId: string
  numberOfTrips: number
}

type TransferMovementInput = BaseMovementInput & {
  kind: 'TRANSFER'
  fromWalletId: string
  toWalletId: string
  amount: number
}

export type CreateCardPurchaseInput = BaseMovementInput & {
  kind: 'CARD_PURCHASE'
  cardWalletId: string
  amount: number
  installmentMode: 'SINGLE' | 'INSTALLMENTS'
  totalInstallments?: number
  firstDueAt?: string
  merchant?: string
}

export type CreateCardPaymentInput = BaseMovementInput & {
  kind: 'CARD_PAYMENT'
  paymentMode: 'PARCIAL' | 'TOTAL'
  fromWalletId: string
  cardWalletId: string
  amount?: number
}

export type CreateMovementFromFormInput =
  | StandardMovementInput
  | TransportMovementInput
  | TransferMovementInput
  | CreateCardPurchaseInput
  | CreateCardPaymentInput

const parseRequiredDate = (value: string, fieldName: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} no es válida`)
  }
  return date
}

const requirePositiveNumber = (value: number | undefined, fieldName: string) => {
  if (!Number.isFinite(value) || !value || value <= 0) {
    throw new Error(`${fieldName} debe ser mayor a 0`)
  }
  return value
}

const normalizeText = (value: string | undefined) => value?.trim() ?? ''

const addMonthsPreservingTime = (date: Date, months: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

const buildInstallmentAmounts = (totalAmount: number, totalInstallments: number) => {
  const totalMinor = moneyInputToMinorUnits(totalAmount)
  const installments = BigInt(totalInstallments)
  const baseAmount = totalMinor / installments
  const remainder = totalMinor % installments

  return Array.from({ length: totalInstallments }, (_, index) => {
    const extraCent = BigInt(index) < remainder ? BigInt(1) : BigInt(0)
    return baseAmount + extraCent
  })
}

const ensureWalletKind = async (
  tx: Prisma.TransactionClient,
  walletId: string,
  userId: string,
  expected: 'CREDIT' | 'NORMAL' | 'TRANSPORT',
) => {
  const wallet = await tx.wallet.findFirst({
    where: { id: walletId, userId, isActive: true },
  })

  if (!wallet) {
    throw new Error('La cuenta seleccionada no existe o está inactiva')
  }

  if (expected === 'CREDIT' && wallet.type !== 'TARJETA_CREDITO') {
    throw new Error('Selecciona una tarjeta de crédito válida')
  }

  if (expected === 'NORMAL' && (wallet.type === 'TARJETA_CREDITO' || wallet.type === 'TRANSPORTE')) {
    throw new Error('Selecciona una cuenta normal')
  }

  if (expected === 'TRANSPORT' && wallet.type !== 'TRANSPORTE') {
    throw new Error('Selecciona una billetera de transporte')
  }

  return wallet
}

const createBaseTransaction = (
  data: Omit<CreateTransactionInput, 'date' | 'description'> & {
    occurredAt: Date
    description?: string
  },
): CreateTransactionInput => ({
  ...data,
  description: normalizeText(data.description),
  date: data.occurredAt.getTime(),
  recordedAt: Date.now(),
})

export const createMovementFromForm = async (data: CreateMovementFromFormInput) => {
  try {
    const user = await requireSessionUser()

    const result = await prisma.$transaction(async (tx) => {
      const occurredAt = parseRequiredDate(data.occurredAt, 'La fecha del movimiento')
      const description = normalizeText(data.description)
      const title = data.title.trim()

      if (!title) throw new Error('El título es requerido')

      if (data.kind === 'STANDARD') {
        await ensureWalletKind(tx, data.walletId, user.id, 'NORMAL')

        return createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, createBaseTransaction({
          type: data.type,
          title,
          description,
          occurredAt,
          amount: data.type === 'INGRESO' ? requirePositiveNumber(data.amount, 'El monto') : -requirePositiveNumber(data.amount, 'El monto'),
          walletId: data.walletId,
          categoryId: data.categoryId,
        }))
      }

      if (data.kind === 'TRANSPORT') {
        const wallet = await ensureWalletKind(tx, data.walletId, user.id, 'TRANSPORT')
        const trips = Math.trunc(requirePositiveNumber(data.numberOfTrips, 'El número de viajes'))
        if (trips < 1) throw new Error('El número de viajes debe ser mayor a 0')
        const fareValue = moneyToNumber(wallet.fareValue)
        requirePositiveNumber(fareValue, 'El valor del pasaje')

        return createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, createBaseTransaction({
          type: 'TRANSPORTE',
          title,
          description,
          occurredAt,
          amount: -(fareValue * trips),
          walletId: data.walletId,
          categoryId: data.categoryId,
          fareValue,
          numberOfTrips: trips,
        }))
      }

      if (data.kind === 'TRANSFER') {
        await ensureWalletKind(tx, data.fromWalletId, user.id, 'NORMAL')
        await ensureWalletKind(tx, data.toWalletId, user.id, 'NORMAL')
        if (data.fromWalletId === data.toWalletId) throw new Error('La transferencia debe hacerse entre cuentas diferentes')

        return createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, createBaseTransaction({
          type: 'TRANSFERENCIA',
          title,
          description,
          occurredAt,
          amount: -requirePositiveNumber(data.amount, 'El monto'),
          walletId: data.fromWalletId,
          fromWalletId: data.fromWalletId,
          toWalletId: data.toWalletId,
          categoryId: data.categoryId,
        }))
      }

      if (data.kind === 'CARD_PURCHASE') {
        const creditCard = await ensureWalletKind(tx, data.cardWalletId, user.id, 'CREDIT')
        const totalAmount = requirePositiveNumber(data.amount, 'El monto')

        if (data.installmentMode === 'INSTALLMENTS') {
          const totalInstallments = Math.trunc(data.totalInstallments ?? 0)
          if (totalInstallments < 2) {
            throw new Error('Las compras a cuotas requieren mínimo 2 cuotas')
          }

          if (!data.firstDueAt) {
            throw new Error('El primer corte de la tarjeta es requerido')
          }

          const firstDueAt = parseRequiredDate(data.firstDueAt, 'El primer corte de la tarjeta')
          const installmentAmounts = buildInstallmentAmounts(totalAmount, totalInstallments)
          const firstInstallmentAmount = moneyToNumber(installmentAmounts[0])

          const plan = await tx.installmentPlan.create({
            data: {
              userId: user.id,
              title,
              description: description || null,
              merchant: normalizeText(data.merchant) || null,
              categoryId: data.categoryId || null,
              chargeWalletId: creditCard.id,
              paymentWalletId: null,
              totalAmount: moneyInputToMinorUnits(totalAmount),
              installmentAmount: installmentAmounts[0],
              totalInstallments,
              remainingInstallments: totalInstallments,
              interestRate: 0,
              occurredAt,
              firstDueAt,
              isActive: true,
            },
          })

          const transaction = await createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, createBaseTransaction({
            type: 'TARJETA_CONSUMO',
            title,
            description,
            occurredAt,
            amount: totalAmount,
            walletId: creditCard.id,
            categoryId: data.categoryId,
            installmentPlanId: plan.id,
          }))

          await tx.installmentOccurrence.createMany({
            data: installmentAmounts.map((expectedAmount, index) => ({
              installmentPlanId: plan.id,
              userId: user.id,
              installmentNumber: index + 1,
              dueAt: addMonthsPreservingTime(firstDueAt, index),
              expectedAmount,
              status: 'PENDIENTE' as const,
            })),
            skipDuplicates: true,
          })

          return {
            transaction,
            installmentPlanId: plan.id,
            firstInstallmentAmount,
          }
        }

        return createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, createBaseTransaction({
          type: 'TARJETA_CONSUMO',
          title,
          description,
          occurredAt,
          amount: totalAmount,
          walletId: creditCard.id,
          categoryId: data.categoryId,
        }))
      }

      const sourceWallet = await ensureWalletKind(tx, data.fromWalletId, user.id, 'NORMAL')
      const creditCard = await ensureWalletKind(tx, data.cardWalletId, user.id, 'CREDIT')
      const currentDebt = moneyToMinorUnits(creditCard.balance)

      if (currentDebt <= BigInt(0)) {
        throw new Error('La tarjeta no tiene deuda pendiente')
      }

      const paymentAmount = data.paymentMode === 'TOTAL'
        ? moneyToNumber(currentDebt)
        : requirePositiveNumber(data.amount, 'El monto del pago')

      const paymentAmountMinor = absMinorUnits(moneyInputToMinorUnits(paymentAmount))
      if (paymentAmountMinor > currentDebt) {
        throw new Error('El pago no puede superar la deuda de la tarjeta')
      }

      const transaction = await createTransactionInTx(tx as unknown as import('@/lib/transaction-service').TransactionServiceTx, user.id, createBaseTransaction({
        type: 'PAGO_TARJETA',
        title,
        description,
        occurredAt,
        amount: -paymentAmount,
        walletId: sourceWallet.id,
        fromWalletId: sourceWallet.id,
        toWalletId: creditCard.id,
        categoryId: data.categoryId,
      }))

      if (data.paymentMode === 'TOTAL') {
        const activePlans = await tx.installmentPlan.findMany({
          where: {
            userId: user.id,
            chargeWalletId: creditCard.id,
            isActive: true,
          },
          select: {
            id: true,
            totalInstallments: true,
            firstDueAt: true,
            installmentAmount: true,
            occurrences: {
              select: { installmentNumber: true },
            },
          },
        })
        const activePlanIds = activePlans.map((plan) => plan.id)

        if (activePlanIds.length > 0) {
          for (const plan of activePlans) {
            const existingNumbers = new Set(plan.occurrences.map((occurrence) => occurrence.installmentNumber))
            const missingOccurrences = Array.from({ length: plan.totalInstallments }, (_, index) => index + 1)
              .filter((installmentNumber) => !existingNumbers.has(installmentNumber))

            if (missingOccurrences.length > 0) {
              await tx.installmentOccurrence.createMany({
                data: missingOccurrences.map((installmentNumber) => ({
                  installmentPlanId: plan.id,
                  userId: user.id,
                  installmentNumber,
                  dueAt: addMonthsPreservingTime(plan.firstDueAt, installmentNumber - 1),
                  expectedAmount: plan.installmentAmount,
                  status: 'PENDIENTE' as const,
                })),
                skipDuplicates: true,
              })
            }
          }

          await tx.installmentOccurrence.updateMany({
            where: {
              userId: user.id,
              installmentPlanId: { in: activePlanIds },
              status: { in: ['PENDIENTE', 'OMITIDA'] },
            },
            data: { status: 'EJECUTADA' },
          })

          await tx.installmentPlan.updateMany({
            where: { id: { in: activePlanIds }, userId: user.id },
            data: {
              remainingInstallments: 0,
              isActive: false,
            },
          })
        }
      }

      return transaction
    })

    revalidatePath('/')
    revalidatePath('/transacciones')
    revalidatePath('/billeteras')
    revalidatePath('/planeacion')
    revalidatePath('/reportes')

    return actionSuccess({ result }, 'Movimiento creado')
  } catch (error) {
    console.error('createMovementFromForm', error)
    return asFailure(error)
  }
}
