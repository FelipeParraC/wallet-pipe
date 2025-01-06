'use server'

import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { mapToWallet } from '@/utils'

export const getWallets = async () => {

    const session = await auth()
            
    if ( !session ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario',
            wallets: null
        }
    }

    try {
        
        const prismaWallets = await prisma.wallet.findMany({
            where: { userId: session.user.id },
            orderBy: {
                createdAt: 'asc'
            }
        })

        if ( !prismaWallets ) return { ok: false, message: 'No se encontraron billeteras', wallets: null }

        const wallets = prismaWallets.map( w => mapToWallet( w ))

        return {
            ok: true,
            message: '',
            wallets
        }

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las billeteras por id de usuario')
    }

}