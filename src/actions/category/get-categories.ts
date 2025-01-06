'use server'

import { auth } from '@/auth.config'
import prisma from '@/lib/prisma'
import { categories } from '@/seed'
import { mapToCategory } from '@/utils'


export const getCategories = async () => {

    const session = await auth()
                    
    if ( !session ) {
        return {
            ok: false,
            message: 'No hay sesión de usuario',
            categories: null
        }
    }

    try {
        
        const prismaCategories = await prisma.category.findMany()

        if ( !prismaCategories ) return { ok: false, message: 'No se encontraron categorías', categories: null }

        const categories = prismaCategories.map( c => mapToCategory( c ))

        return {
            ok: true,
            message: '',
            categories
        }

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las categorias')
    }

}