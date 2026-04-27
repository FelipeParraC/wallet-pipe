'use server'

import prisma from '@/lib/prisma'
import { mapToWallet } from '@/utils'
import { actionSuccess } from '@/lib/action-response'
import { asFailure, requireSessionUser } from '@/lib/server-validation'

export const getWallets = async () => {
    try {
        const user = await requireSessionUser()
        
        const prismaWallets = await prisma.wallet.findMany({
            where: { userId: user.id },
            orderBy: {
                createdAt: 'asc'
            }
        })

        const wallets = prismaWallets.map( w => mapToWallet( w ))

        return {
            ...actionSuccess({ wallets }),
            wallets,
        }
    } catch ( error ) {
        console.error('getWallets', error)
        return {
            ...asFailure(error),
            wallets: null
        }
    }

}
