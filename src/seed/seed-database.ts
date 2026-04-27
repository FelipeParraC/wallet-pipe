import prisma from '../lib/prisma'
import bcryptjs from 'bcryptjs'
import {
    seedCategories,
    seedCycleSettings,
    seedDebts,
    seedInstallmentOccurrences,
    seedInstallmentPlans,
    seedPeople,
    seedScheduledOccurrences,
    seedScheduledPlans,
    seedTags,
    seedTransactions,
    seedUser,
    seedWallets
} from './data';

type SeedWriter = {
    transactionTag: { deleteMany: () => Promise<unknown> }
    transaction: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    installmentOccurrence: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    installmentPlan: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    scheduledOccurrence: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    scheduledPlan: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    debt: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    person: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    tag: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    cycleOverride: { deleteMany: () => Promise<unknown> }
    userCycleSettings: { deleteMany: () => Promise<unknown>; create: (args: unknown) => Promise<unknown> }
    wallet: { deleteMany: () => Promise<unknown>; createMany: (args: unknown) => Promise<unknown> }
    user: { deleteMany: () => Promise<unknown>; create: (args: unknown) => Promise<unknown> }
    category: { createMany: (args: unknown) => Promise<unknown> }
}

async function main() {
    const prismaClient = prisma as unknown as SeedWriter

    // Borrar registros previos
    await prismaClient.transactionTag.deleteMany()
    await prismaClient.transaction.deleteMany()
    await prismaClient.installmentOccurrence.deleteMany()
    await prismaClient.installmentPlan.deleteMany()
    await prismaClient.scheduledOccurrence.deleteMany()
    await prismaClient.scheduledPlan.deleteMany()
    await prismaClient.debt.deleteMany()
    await prismaClient.person.deleteMany()
    await prismaClient.tag.deleteMany()
    await prismaClient.cycleOverride.deleteMany()
    await prismaClient.userCycleSettings.deleteMany()
    await prismaClient.wallet.deleteMany()
    await prismaClient.user.deleteMany()

    // Usuario
    await prismaClient.user.create({
        data: {
            ...seedUser,
            password: bcryptjs.hashSync(seedUser.password)
        } as never
    })

    // Categorias
    await prismaClient.category.createMany({
        data: seedCategories as never
    })

    await prismaClient.userCycleSettings.create({
        data: seedCycleSettings as never
    })

    await prismaClient.tag.createMany({
        data: seedTags as never
    })
    
    // Billeteras
    await prismaClient.wallet.createMany({
        data: seedWallets as never
    })

    await prismaClient.person.createMany({
        data: seedPeople as never
    })

    await prismaClient.debt.createMany({
        data: seedDebts as never
    })

    await prismaClient.scheduledPlan.createMany({
        data: seedScheduledPlans as never
    })

    await prismaClient.scheduledOccurrence.createMany({
        data: seedScheduledOccurrences as never
    })

    await prismaClient.installmentPlan.createMany({
        data: seedInstallmentPlans as never
    })

    await prismaClient.installmentOccurrence.createMany({
        data: seedInstallmentOccurrences as never
    })

    // Transacciones
    await prismaClient.transaction.createMany({
        data: seedTransactions as never
    })

    console.log('Seed ejecutado correctamente')
}



(() => {

    if ( process.env.NODE_ENV === 'production' ) return

    main()
        .catch((error) => {
            console.error('Seed falló', error)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })

})()
