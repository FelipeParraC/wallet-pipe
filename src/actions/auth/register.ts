'use server'

import { CreateUserInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { logServerActionError } from '@/lib/server-action-logging'
import { mapToCreatePrismaUser } from '@/utils'


export const register = async ( data: CreateUserInput ) => {

    try {
        
        const user = mapToCreatePrismaUser( data )
        const prismaUser = await prisma.user.create({ data: user, select: { id: true, email: true, name: true, nickname: true } })

        return {
            ok: true,
            message: 'Usuario creado',
            user: prismaUser
        }

    } catch (error) {
        logServerActionError('register', error)
        return {
            ok: false,
            message: 'No se pudo crear el usuario'
        }
    }

}
