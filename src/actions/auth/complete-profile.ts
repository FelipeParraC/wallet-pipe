'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { actionSuccess } from '@/lib/action-response'
import { asFailure } from '@/lib/server-validation'
import { capitalizar } from '@/utils'

export const completeProfile = async (nickname: string) => {
  try {
    const session = await auth()
    if (!session?.user?.id) throw new Error('Debes iniciar sesión')

    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length < 2) throw new Error('El apodo debe tener al menos 2 caracteres')

    await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname: capitalizar(trimmedNickname) },
    })

    revalidatePath('/')
    revalidatePath('/completar-perfil')

    return actionSuccess({}, 'Perfil completado')
  } catch (error) {
    console.error('completeProfile', error)
    return asFailure(error)
  }
}
