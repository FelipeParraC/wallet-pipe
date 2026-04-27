'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'
import type { PrismaTransaction } from '@/interfaces'


export const getTransactionById = async ( id: string ) => {
    try {
        const user = await requireSessionUser()
        
        const prismaTransaction = await prisma.transaction.findFirst({ where: { id: id } }) as PrismaTransaction | null

        if ( !prismaTransaction ) {
            return {
                ...asFailure(new Error(`No se encontró la transacción con ID ${ id }`)),
                transaction: null
            }
        }

        if ( prismaTransaction.userId !== user.id ) {
            return {
                ...asFailure(new Error('El usuario no es propietario de la transacción')),
                transaction: null
            }
        }

        const transaction = mapToTransaction(prismaTransaction)

        return { ...actionSuccess({ transaction }), transaction }

    } catch ( error ) {
        console.error('getTransactionById', error)
        return {
            ...asFailure(error),
            transaction: null
        }
    }

}
