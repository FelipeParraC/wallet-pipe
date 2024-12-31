'use server'

import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'


export const getTransactionById = async ( id: string ) => {

    try {
        
        const transaction = await prisma.transaction.findFirst({ where: { id: id } })

        if ( !transaction ) return null

        return mapToTransaction( { ...transaction, date: Number( transaction.date ) } )

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener la transaccion por id')
    }

}