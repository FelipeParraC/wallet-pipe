import { Prisma } from '@prisma/client'
import { auth } from '@/auth.config'
import { ActionResponse, actionFailure } from './action-response'

export const requireSessionUser = async () => {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error('No hay sesión de usuario')
  }

  return session.user
}

export const ensureOwnedWallet = async (
  tx: Prisma.TransactionClient,
  walletId: string,
  userId: string,
  options?: { allowInactive?: boolean },
) => {
  const wallet = await tx.wallet.findUnique({ where: { id: walletId } })

  if (!wallet || wallet.userId !== userId) {
    throw new Error('La billetera no existe o no pertenece al usuario')
  }

  if (!options?.allowInactive && !wallet.isActive) {
    throw new Error('La billetera seleccionada está inactiva')
  }

  return wallet
}

export const ensureCategoryExists = async (tx: Prisma.TransactionClient, categoryId: string) => {
  const category = await tx.category.findUnique({ where: { id: categoryId } })

  if (!category) {
    throw new Error('La categoría seleccionada no existe')
  }

  return category
}

export const asFailure = (error: unknown): ActionResponse => {
  if (error instanceof Error) {
    return actionFailure(error.message)
  }

  return actionFailure('Ocurrió un error inesperado')
}
