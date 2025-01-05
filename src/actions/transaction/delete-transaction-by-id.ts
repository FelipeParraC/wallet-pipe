'use server'

import prisma from '@/lib/prisma'

export const deleteTransactionById = async (id: string) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if ( !userId ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    await prisma.$transaction( async(tx) => {

        // 1. Comprobar que la transacción exista
        const transactionToDelete = await tx.transaction.findFirst({ where: { id } })

        if ( !transactionToDelete ) {
            throw new Error(`No se encontró la transacción con el ID ${ id }`)
        }

        // 2. Actualizar el saldo de la billetera
        if ( transactionToDelete.type !== 'TRANSFERENCIA' ) {
            const walletDB = await tx.wallet.findFirst({ where: { id: transactionToDelete.walletId } })

            if ( !walletDB ) {
                throw new Error('No se encontró la billetera')
            }

            const walletModified = { ...walletDB, balance: walletDB.balance - transactionToDelete.amount }

            await tx.wallet.update({ where: { id: walletModified.id }, data: walletModified })
        } else if ( transactionToDelete.fromWalletId && transactionToDelete.toWalletId ) {
            const fromWalletDB = await tx.wallet.findFirst({ where: { id: transactionToDelete.fromWalletId } })
            const toWalletDB = await tx.wallet.findFirst({ where: { id: transactionToDelete.toWalletId } })

            if ( !fromWalletDB || !toWalletDB ) {
                throw new Error('No se encontraron las billeteras')
            }

            const fromWalletModified = { ...fromWalletDB, balance: fromWalletDB.balance - transactionToDelete.amount }
            const toWalletModified = { ...toWalletDB, balance: toWalletDB.balance + transactionToDelete.amount }

            if ( fromWalletModified.balance < 0 ) {
                throw new Error('La billetera de origen no tiene dinero suficiente')
            }

            await tx.wallet.update({ where: { id: fromWalletModified.id }, data: fromWalletModified })
            await tx.wallet.update({ where: { id: toWalletModified.id }, data: toWalletModified })
        }


        // 3. Eliminar la transacción
        await tx.transaction.delete({ where: { id } })
        
    })
}