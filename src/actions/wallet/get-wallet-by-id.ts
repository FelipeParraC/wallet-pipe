'use server'

import prisma from '@/lib/prisma'
import { mapToWallet } from '@/utils'


export const getWalletById = async ( id: string ) => {

    try {
        
        const wallet = await prisma.wallet.findFirst({ where: { id: id } })

        if ( !wallet ) return null

        return mapToWallet( wallet )

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener la transaccion por id')
    }

}