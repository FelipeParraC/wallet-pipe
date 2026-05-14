'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'

interface SaveCyclePeriodOverrideInput {
  startsAt: string
  endsAt: string
  note?: string
}

const parseDate = (value: string, fieldName: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error(`${fieldName} no es válida`)
  return date
}

export const saveCyclePeriodOverride = async (data: SaveCyclePeriodOverrideInput) => {
  try {
    const user = await requireSessionUser()
    const startsAt = parseDate(data.startsAt, 'La fecha de inicio')
    const endsAt = parseDate(data.endsAt, 'La fecha de fin')

    if (startsAt >= endsAt) throw new Error('La fecha de inicio debe ser anterior a la fecha de fin')

    const override = await prisma.$transaction(async (tx) => {
      await tx.cyclePeriodOverride.deleteMany({
        where: {
          userId: user.id,
          startsAt: { lte: endsAt },
          endsAt: { gte: startsAt },
        },
      })

      return tx.cyclePeriodOverride.create({
        data: {
          userId: user.id,
          startsAt,
          endsAt,
          note: data.note?.trim() || null,
        },
      })
    })

    revalidatePath('/')
    revalidatePath('/planeacion')
    revalidatePath('/reportes')
    revalidatePath('/configuracion/ciclo')

    return actionSuccess({ override }, 'Periodo manual guardado')
  } catch (error) {
    logServerActionError('saveCyclePeriodOverride', error)
    return asFailure(error)
  }
}
