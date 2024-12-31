import { initialData } from './data';
import prisma from '../lib/prisma'
import { mapToPrismaTransactionType, mapToPrismaWalletType } from '../utils/mapper';


async function main() {

    // Borrar registros previos
    await prisma.transaction.deleteMany()
    await prisma.wallet.deleteMany()
    await prisma.category.deleteMany()
    await prisma.user.deleteMany()

    const { categories, transactions, user, wallets } = initialData

    // Categorias
    const categoriesData = categories.map((c) => ({
        id: c.id,
        color: c.color,
        name: c.name,
        updatedAt: new Date()
    }))

    await prisma.category.createMany({
        data: categoriesData
    })

    // Usuario
    const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        nickname: user.nickname,
        password: '123456',
        updatedAt: new Date()
    }

    await prisma.user.create({
        data: userData
    })
    
    // Billeteras
    const walletsData = wallets.map((w) => ({
        id: w.id,
        balance: w.balance,
        color: w.color,
        includeInTotal: w.includeInTotal,
        name: w.name,
        type: mapToPrismaWalletType( w.type ),
        userId: w.userId,
        fareValue: w.fareValue,
        updatedAt: new Date()
    }))

    await prisma.wallet.createMany({
        data: walletsData
    })

    // Transacciones
    const transactionsData = transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        date: Date.parse( t.date ),
        description: t.description,
        title: t.title,
        type: mapToPrismaTransactionType( t.type ),
        categoryId: t.categoryId,
        fareValue: t.fareValue,
        fromWalletId: t.fromWalletId,
        isVisible: t.isVisible,
        numberOfTrips: t.numberOfTrips,
        toWalletId: t.toWalletId,
        userId: t.userId,
        walletId: t.walletId,
        updatedAt: new Date()
    }))

    await prisma.transaction.createMany({
        data: transactionsData
    })

    console.log('Seed ejecutado correctamente')
}



(() => {

    if ( process.env.NODE_ENV === 'production' ) return

    main()

})()