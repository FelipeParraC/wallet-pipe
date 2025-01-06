'use server'

import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'

export const getTransactionsByWalletId = async ( id: string ) => {

    const session = await auth()
        
    if ( !session ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario',
            transactions: null
        }
    }

    try {
        
        const prismaTransactions = await prisma.transaction.findMany({
            where: {
                userId: session.user.id,
                OR: [
                    { walletId: id },
                    { toWalletId: id },
                ]
            },
            orderBy: {
                date: 'desc'
            }
        })

        if ( !prismaTransactions ) return { ok: false, message: 'No se encontraron transacciones', transactions: null }

        const transactions = prismaTransactions.map( t => mapToTransaction({ ...t, date: Number( t.date ) }))

        return {
            ok: true,
            message: '',
            transactions
        }

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las transacciones por id de billetera')
    }

}