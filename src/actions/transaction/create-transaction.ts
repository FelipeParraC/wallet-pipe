'use server'

import { CreateTransactionInput } from '@/interfaces'
import prisma from '@/lib/prisma'
import { mapToCreatePrismaTransaction } from '@/utils'

export const createTransaction = async ( data: CreateTransactionInput ) => {

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

        if ( data.type !== 'TRANSFERENCIA' ) {
            const walletDB = await tx.wallet.findFirst({ where: { id: data.walletId } })

            if ( !walletDB ) {
                throw new Error('No se encontró la billetera')
            }

            const walletModified = { ...walletDB, balance: walletDB.balance + data.amount }

            await tx.wallet.update({ where: { id: walletModified.id }, data: walletModified })
        } else {
            const fromWalletDB = await tx.wallet.findFirst({ where: { id: data.fromWalletId } })
            const toWalletDB = await tx.wallet.findFirst({ where: { id: data.toWalletId } })

            if ( !fromWalletDB || !toWalletDB ) {
                throw new Error('No se encontraron las billeteras')
            }

            const fromWalletModified = { ...fromWalletDB, balance: fromWalletDB.balance + data.amount }
            const toWalletModified = { ...toWalletDB, balance: toWalletDB.balance - data.amount }

            if ( fromWalletModified.balance < 0 ) {
                throw new Error('La billetera de origen no tiene dinero suficiente')
            }

            await tx.wallet.updateMany({ where: { id: fromWalletModified.id }, data: fromWalletModified })
            await tx.wallet.updateMany({ where: { id: toWalletModified.id }, data: toWalletModified })
        }

        // 2. Crear la transacción

        const transaction = mapToCreatePrismaTransaction( data, userId )
        await tx.transaction.create({
            data: transaction
        })

        return {
            transaction
        }
    })
}