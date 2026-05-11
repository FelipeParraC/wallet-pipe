'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { capitalizar } from '@/utils'

interface UpdateProfileInput {
  name: string
  nickname: string
}

export const updateProfile = async (data: UpdateProfileInput) => {
  try {
    const user = await requireSessionUser()
    const name = data.name.trim()
    const nickname = data.nickname.trim()

    if (name.length < 2) throw new Error('El nombre debe tener al menos 2 caracteres')
    if (nickname.length < 2) throw new Error('El apodo debe tener al menos 2 caracteres')

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: capitalizar(name),
        nickname: capitalizar(nickname),
      },
    })

    revalidatePath('/')
    revalidatePath('/configuracion')

    return actionSuccess(undefined, 'Perfil actualizado')
  } catch (error) {
    console.error('updateProfile', error)
    return asFailure(error)
  }
}
