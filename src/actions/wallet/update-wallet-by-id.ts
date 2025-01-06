'use server'

import { auth } from '@/auth.config'
import { UpdateWalletInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { mapToUpdatePrismaWallet } from '@/utils'

export const updateWalletById = async (data: UpdateWalletInput, id: string) => {

    const session = await auth()
            
    if ( !session ) {
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

        if ( walletToUpdate.userId !== session.user.id ) {
            throw new Error('El usuario no es propietario de la billetera')
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