'use server'

import { UpdateTransactionInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { mapToUpdatePrismaTransaction } from '@/utils'

export const setTransactionById = async (data: UpdateTransactionInput, id: string) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if ( !userId ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    await prisma.$transaction( async(tx) => {

        // 1. Actualizar el saldo de la billetera

        if ( Math.abs(data.amount) !== Math.abs(data.newAmount) ) {

            if ( data.type !== 'TRANSFERENCIA' ) {
                const walletDB = await tx.wallet.findFirst({ where: { id: data.walletId } })

                if ( !walletDB ) {
                    throw new Error('No se encontró la billetera')
                }

                const walletModified = { ...walletDB, balance: walletDB.balance + data.newAmount - data.amount }

                await tx.wallet.update({ where: { id: walletModified.id }, data: walletModified })
            } else {
                const fromWalletDB = await tx.wallet.findFirst({ where: { id: data.fromWalletId } })
                const toWalletDB = await tx.wallet.findFirst({ where: { id: data.toWalletId } })

                if ( !fromWalletDB || !toWalletDB ) {
                    throw new Error('No se encontraron las billeteras')
                }

                const fromWalletModified = { ...fromWalletDB, balance: fromWalletDB.balance + data.amount - data.newAmount }
                const toWalletModified = { ...toWalletDB, balance: toWalletDB.balance + data.newAmount - data.amount }

                console.log({ fromWalletModified, toWalletModified })

                if ( fromWalletModified.balance < 0 ) {
                    throw new Error('La billetera de origen no tiene dinero suficiente')
                }

                await tx.wallet.update({ where: { id: fromWalletModified.id }, data: fromWalletModified })
                await tx.wallet.update({ where: { id: toWalletModified.id }, data: toWalletModified })
            }
    
        }


        // 2. Editar la transacción

        const transaction = mapToUpdatePrismaTransaction( data )
        await tx.transaction.update({ where: { id: id }, data: transaction })

        return {
            transaction
        }
    })
}