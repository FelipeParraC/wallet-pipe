'use server'

import prisma from "@/lib/prisma"
import { mapToCategory } from "@/utils"


export const getCategories = async () => {

    try {
        
        const categories = await prisma.category.findMany()

        if ( !categories ) return null

        return categories.map( c => mapToCategory( c ))

    } catch ( error ) {
        console.log( error )
        throw new Error('Error al obtener las categorias')
    }

}