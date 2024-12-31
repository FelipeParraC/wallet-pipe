'use server'

import prisma from '@/lib/prisma'
import { mapToWallet } from '@/utils'

export const getWallets = async () => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    try {
        
        const wallets = await prisma.wallet.findMany({ where: { userId: userId } })

        if ( !wallets ) return null

        return wallets.map( w => mapToWallet( w ))

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las transacciones por id de usuario')
    }

}