'use server'

import prisma from '@/lib/prisma'
import { mapToWallet } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import { logServerActionError } from '@/lib/server-action-logging'


export const getWalletById = async ( id: string ) => {
    try {
        const user = await requireSessionUser()
        
        const prismaWallet = await prisma.wallet.findFirst({
            where: { id: id },
            include: { statementClosings: { orderBy: { statementMonth: 'desc' } } },
        })

        if ( !prismaWallet ) {
            return {
                ...asFailure(new Error(`No se encontró la billetera con ID ${ id }`)),
                wallet: null
            }
        }

        if ( prismaWallet.userId !== user.id ) {
            return {
                ...asFailure(new Error('El usuario no es propietario de la billetera')),
                wallet: null
            }
        }

        const wallet = mapToWallet( prismaWallet )

        return { ...actionSuccess({ wallet }), wallet }

    } catch ( error ) {
        logServerActionError('getWalletById', error)
        return {
            ...asFailure(error),
            wallet: null
        }
    }

}
