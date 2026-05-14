export const revalidate = 0

import { getCategories, getCurrentCycleSummary, getTransactions, getWallets } from '@/actions'
import { auth } from '@/auth.config'
import { DashboardHome, DataUnavailableNotice } from '@/components'
import { attachCreditCardPaymentsToWallets } from '@/lib/wallet-card-summary'
import { redirect } from 'next/navigation'


export default async function HomePage() {

    const session = await auth()

    if (!session?.user) {
        redirect('/auth/login')
    }

    const [respTransactions, respWallets, respCategories, respCycleSummary] = await Promise.all([
        getTransactions(),
        getWallets(),
        getCategories(),
        getCurrentCycleSummary(),
    ])

    const transactions = respTransactions.ok ? respTransactions.transactions : []

    const categories = respCategories.ok ? respCategories.categories : []

    const cycleSummary = respCycleSummary.ok ? respCycleSummary.data : null
    const wallets = attachCreditCardPaymentsToWallets(
        respWallets.ok ? respWallets.wallets ?? [] : [],
        cycleSummary?.summary.creditCardObligations ?? [],
    )
    const readIssue = [respTransactions, respWallets, respCategories, respCycleSummary].find((response) => !response.ok)

    return (
        <div className='space-y-7'>
            <div className='flex items-center justify-between'>
                <div>
                    <p className='text-xs uppercase tracking-[0.28em] text-slate-500'>Panel principal</p>
                    <h1 className='mt-1 text-2xl font-semibold tracking-tight text-white md:text-3xl'>
                        Hola, {session.user.nickname}
                    </h1>
                </div>
            </div>

            {readIssue && <DataUnavailableNotice message={readIssue.message} />}

            <DashboardHome transactions={ transactions } categories={ categories } wallets={ wallets } cycleSummary={ cycleSummary } />
        </div>
    )
}

