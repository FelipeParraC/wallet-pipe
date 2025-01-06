'use server'

import { UpdateWalletInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { mapToUpdatePrismaWallet } from '@/utils'

export const updateWalletById = async (data: UpdateWalletInput, id: string) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if ( !userId ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    await prisma.$transaction( async(tx) => {

        const walletToUpdate = await tx.wallet.findFirst({ where: { id } })

        if ( !walletToUpdate ) {
            throw new Error(`No se encontró la billetera con ID ${ id }`)
        }

        const wallet = mapToUpdatePrismaWallet( data )

        await tx.wallet.update({
            where: { id: id },
            data: wallet,
        })

        return {
            wallet
        }
    })
}