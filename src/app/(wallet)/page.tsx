export const revalidate = 0

import { getCategories, getCurrentCycleSummary, getTransactions, getWallets } from '@/actions'
import { auth } from '@/auth.config'
import { DashboardHome } from '@/components'


export default async function HomePage() {

    const session = await auth()

    const respTransactions = await getTransactions()
    const transactions = respTransactions.ok ? respTransactions.transactions : []

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

    const respCycleSummary = await getCurrentCycleSummary()
    const cycleSummary = respCycleSummary.ok ? respCycleSummary.data : null

    return (
        <div className='space-y-7'>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Panel principal</p>
                    <h1 className='mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl'>
                        {session ? `Hola, ${session.user.nickname}` : 'Bienvenido a Wallet Pipe'}
                    </h1>
                </div>
            </div>

            <DashboardHome transactions={ transactions } categories={ categories } wallets={ wallets } cycleSummary={ cycleSummary } />
        </div>
    )
}

