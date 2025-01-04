'use server'

import type { UpdateWalletInput } from '@/interfaces'


export const setWalletById = async (data: UpdateWalletInput, id: string) => {

    //TODO: Cambiarlo a NextAuth
    const userId = '1'

    if ( !userId ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario'
        }
    }

    console.log({ data, id })

}