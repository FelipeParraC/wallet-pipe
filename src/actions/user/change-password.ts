'use server'

import bcryptjs from 'bcryptjs'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

export const changePassword = async (data: ChangePasswordInput) => {
  try {
    const sessionUser = await requireSessionUser()
    const currentPassword = data.currentPassword.trim()
    const newPassword = data.newPassword.trim()

    if (newPassword.length < 6) throw new Error('La nueva contraseña debe tener al menos 6 caracteres')

    const user = await prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: { password: true },
    })

    if (!user?.password) throw new Error('Esta cuenta no tiene contraseña configurada')
    if (!bcryptjs.compareSync(currentPassword, user.password)) {
      throw new Error('La contraseña actual no es correcta')
    }

    await prisma.user.update({
      where: { id: sessionUser.id },
      data: { password: bcryptjs.hashSync(newPassword) },
    })

    return actionSuccess(undefined, 'Contraseña actualizada')
  } catch (error) {
    console.error('changePassword', error)
    return asFailure(error)
  }
}
