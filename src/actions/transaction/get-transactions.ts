'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'

export const getTransactions = async () => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    try {
        
        const transactions = await prisma.transaction.findMany({
            where: { userId: userId },
            orderBy: {
                date: 'desc'
            }
        })

        if ( !transactions ) return null

        return transactions.map( t => mapToTransaction( t ))

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las transacciones por id de usuario')
    }

}