'use server'

import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { mapToTransaction } from '@/utils'


export const getTransactionById = async ( id: string ) => {

    const session = await auth()
        
    if ( !session ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario',
            transaction: null
        }
    }

    try {
        
        const prismaTransaction = await prisma.transaction.findFirst({ where: { id: id } })

        if ( !prismaTransaction ) return { ok: false, message: `No se encontró la transacción con ID ${ id }`, transaction: null }

        if ( prismaTransaction.userId !== session.user.id ) return { ok: false, message: `El usuario no es propietario de la transacción`, transaction: null }

        const transaction = mapToTransaction( { ...prismaTransaction, date: Number( prismaTransaction.date ) } )

        return {
            ok: true,
            message: '',
            transaction
        }

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener la transaccion por id')
    }

}