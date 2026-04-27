import prisma from '../lib/prisma'
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
  seedWallets,
} from './data'

const suffixFor = (userId: string) => userId.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'current'
const scopedId = (baseId: string, suffix: string) => `${baseId}_${suffix}`

async function clearFinancialDataForUser(userId: string) {
  await prisma.transactionTag.deleteMany({
    where: { transaction: { userId } },
  })
  await prisma.transaction.deleteMany({ where: { userId } })
  await prisma.installmentOccurrence.deleteMany({ where: { userId } })
  await prisma.installmentPlan.deleteMany({ where: { userId } })
  await prisma.scheduledOccurrence.deleteMany({ where: { userId } })
  await prisma.scheduledPlan.deleteMany({ where: { userId } })
  await prisma.debt.deleteMany({ where: { userId } })
  await prisma.person.deleteMany({ where: { userId } })
  await prisma.tag.deleteMany({ where: { userId } })
  await prisma.cycleOverride.deleteMany({
    where: { cycleSettings: { userId } },
  })
  await prisma.userCycleSettings.deleteMany({ where: { userId } })
  await prisma.wallet.deleteMany({ where: { userId } })
  await prisma.category.deleteMany({ where: { userId } })
}

async function main() {
  const user = process.env.SEED_USER_EMAIL
    ? await prisma.user.findUnique({ where: { email: process.env.SEED_USER_EMAIL } })
    : await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })

  if (!user) {
    throw new Error('No existe un usuario para cargar el seed. Crea o registra un usuario primero.')
  }

  const suffix = suffixFor(user.id)
  const mapId = (baseId: string) => scopedId(baseId, suffix)

  await clearFinancialDataForUser(user.id)

  const categories = seedCategories.map((category) => ({
    ...category,
    id: mapId(category.id),
    userId: user.id,
    parentId: category.parentId ? mapId(category.parentId) : undefined,
    isSystem: false,
  }))

  const tags = seedTags.map((tag) => ({
    ...tag,
    id: mapId(tag.id),
    userId: user.id,
  }))

  const wallets = seedWallets.map((wallet) => ({
    ...wallet,
    id: mapId(wallet.id),
    userId: user.id,
  }))

  const people = seedPeople.map((person) => ({
    ...person,
    id: mapId(person.id),
    userId: user.id,
  }))

  const debts = seedDebts.map((debt) => ({
    ...debt,
    id: mapId(debt.id),
    userId: user.id,
    personId: mapId(debt.personId),
  }))

  const scheduledPlans = seedScheduledPlans.map((plan) => {
    const targetWalletId = 'targetWalletId' in plan && typeof plan.targetWalletId === 'string'
      ? mapId(plan.targetWalletId)
      : undefined

    return {
      ...plan,
      id: mapId(plan.id),
      userId: user.id,
      categoryId: plan.categoryId ? mapId(plan.categoryId) : undefined,
      sourceWalletId: plan.sourceWalletId ? mapId(plan.sourceWalletId) : undefined,
      targetWalletId,
    }
  })

  const scheduledOccurrences = seedScheduledOccurrences.map((occurrence) => ({
    ...occurrence,
    id: mapId(occurrence.id),
    planId: mapId(occurrence.planId),
    userId: user.id,
  }))

  const installmentPlans = seedInstallmentPlans.map((plan) => ({
    ...plan,
    id: mapId(plan.id),
    userId: user.id,
    categoryId: plan.categoryId ? mapId(plan.categoryId) : undefined,
    chargeWalletId: plan.chargeWalletId ? mapId(plan.chargeWalletId) : undefined,
    paymentWalletId: plan.paymentWalletId ? mapId(plan.paymentWalletId) : undefined,
  }))

  const installmentOccurrences = seedInstallmentOccurrences.map((occurrence) => ({
    ...occurrence,
    id: mapId(occurrence.id),
    installmentPlanId: mapId(occurrence.installmentPlanId),
    userId: user.id,
  }))

  const transactions = seedTransactions.map((transaction) => ({
    ...transaction,
    id: mapId(transaction.id),
    userId: user.id,
    walletId: mapId(transaction.walletId),
    categoryId: transaction.categoryId ? mapId(transaction.categoryId) : undefined,
    fromWalletId: transaction.fromWalletId ? mapId(transaction.fromWalletId) : undefined,
    toWalletId: transaction.toWalletId ? mapId(transaction.toWalletId) : undefined,
    personId: transaction.personId ? mapId(transaction.personId) : undefined,
    debtId: transaction.debtId ? mapId(transaction.debtId) : undefined,
  }))

  await prisma.category.createMany({ data: categories as never })
  await prisma.userCycleSettings.create({
    data: {
      ...seedCycleSettings,
      id: mapId(seedCycleSettings.id),
      userId: user.id,
    } as never,
  })
  await prisma.tag.createMany({ data: tags as never })
  await prisma.wallet.createMany({ data: wallets as never })
  await prisma.person.createMany({ data: people as never })
  await prisma.debt.createMany({ data: debts as never })
  await prisma.scheduledPlan.createMany({ data: scheduledPlans as never })
  await prisma.scheduledOccurrence.createMany({ data: scheduledOccurrences as never })
  await prisma.installmentPlan.createMany({ data: installmentPlans as never })
  await prisma.installmentOccurrence.createMany({ data: installmentOccurrences as never })
  await prisma.transaction.createMany({ data: transactions as never })

  console.log(`Seed de ciclo actual cargado para ${user.email} (${user.id})`)
}

if (process.env.NODE_ENV !== 'production') {
  main()
    .catch((error) => {
      console.error('Seed para usuario existente falló', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
