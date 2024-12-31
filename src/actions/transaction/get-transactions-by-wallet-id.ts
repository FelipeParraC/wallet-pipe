'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'

export const getTransactionsByWalletId = async ( id: string ) => {

    try {
        
        const transactions = await prisma.transaction.findMany({
            where: {
                OR: [
                    { walletId: id },
                    { toWalletId: id },
                ]
            },
            orderBy: {
                date: 'desc'
            }
        })

        if ( !transactions ) return null

        return transactions.map( t => mapToTransaction( t ))

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las transacciones por id de billetera')
    }

}