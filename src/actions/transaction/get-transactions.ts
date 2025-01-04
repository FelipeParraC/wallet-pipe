'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'

export const getTransactions = async () => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    try {
        
        const prismaTransactions = await prisma.transaction.findMany({
            where: { userId: userId },
            orderBy: {
                date: 'desc'
            }
        }) 

        if ( !prismaTransactions ) return null

        const transactions = prismaTransactions.map( t => mapToTransaction({ ...t, date: Number( t.date ) }))
        
        return transactions

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las transacciones por id de usuario')
    }

}