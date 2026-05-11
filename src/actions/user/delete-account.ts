'use server'

import bcryptjs from 'bcryptjs'
import { signOut } from '@/auth.config'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

interface DeleteAccountInput {
  emailConfirmation: string
  currentPassword?: string
}

export const deleteAccount = async (data: DeleteAccountInput) => {
  try {
    const sessionUser = await requireSessionUser()
    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        email: true,
        password: true,
      },
    })

    if (!user) throw new Error('No encontramos tu cuenta')

    const emailConfirmation = data.emailConfirmation.trim().toLowerCase()
    if (emailConfirmation !== user.email.toLowerCase()) {
      throw new Error('Escribe tu correo exacto para confirmar')
    }

    if (user.password) {
      const currentPassword = data.currentPassword?.trim() ?? ''
      if (!currentPassword || !bcryptjs.compareSync(currentPassword, user.password)) {
        throw new Error('La contraseña actual no es correcta')
      }
    }

    await prisma.user.delete({ where: { id: user.id } })
  } catch (error) {
    console.error('deleteAccount', error)
    return asFailure(error)
  }

  await signOut({ redirectTo: '/auth/register' })

  return actionSuccess(undefined, 'Cuenta eliminada')
}
