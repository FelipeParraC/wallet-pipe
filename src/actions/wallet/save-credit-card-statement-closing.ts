'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, ensureOwnedWallet, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

interface SaveCreditCardStatementClosingInput {
  walletId: string
  statementMonth: string
  closingAt: string
  note?: string
}

const parseDate = (value: string, fieldName: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`${fieldName} no es válida`)
  return date
}

const normalizeStatementMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)

export const saveCreditCardStatementClosing = async (data: SaveCreditCardStatementClosingInput) => {
  try {
    const user = await requireSessionUser()
    const statementMonth = normalizeStatementMonth(parseDate(data.statementMonth, 'El mes del corte'))
    const closingAt = parseDate(data.closingAt, 'La fecha de corte')

    const closing = await prisma.$transaction(async (tx) => {
      const wallet = await ensureOwnedWallet(tx, data.walletId, user.id)
      if (wallet.type !== 'TARJETA_CREDITO') throw new Error('Solo puedes guardar cortes en tarjetas de crédito')

      return tx.creditCardStatementClosing.upsert({
        where: {
          walletId_statementMonth: {
            walletId: wallet.id,
            statementMonth,
          },
        },
        update: {
          closingAt,
          note: data.note?.trim() || null,
        },
        create: {
          userId: user.id,
          walletId: wallet.id,
          statementMonth,
          closingAt,
          note: data.note?.trim() || null,
        },
      })
    })

    revalidatePath('/')
    revalidatePath('/billeteras')
    revalidatePath(`/billeteras/${data.walletId}`)
    revalidatePath('/configuracion/tarjetas')
    revalidatePath('/planeacion')

    return actionSuccess({ closing }, 'Corte real guardado')
  } catch (error) {
    logServerActionError('saveCreditCardStatementClosing', error)
    return asFailure(error)
  }
}
