import { getCategories, getWalletById, getWallets } from '@/actions'
import { CreateTransactionForm } from '@/components'
import { redirect } from 'next/navigation'

interface Props {
    searchParams: {
        walletId?: string
    }
}

export default async function NuevaTransaccionPage({ searchParams }: Props) {

    const walletId = searchParams.walletId || ''
    const respWallet = await getWalletById( walletId )
    
    const wallet = respWallet.wallet
    
    if ( !wallet ) {
        redirect('/billeteras')
    }

    const respWallets = await getWallets()
    const wallets = respWallets.ok ? respWallets.wallets : []

    const respCategories = await getCategories()
    const categories = respCategories.ok ? respCategories.categories : []

    if ( !wallets ) {
        return <></>
    }

    return (
        <div className='space-y-6 max-w-2xl mx-auto text-center'>
            <h1 className='text-3xl font-bold mb-8'>Nueva Transacción</h1>
            <CreateTransactionForm wallets={ wallets } categories={ categories } wallet={ wallet } />
        </div>
    )
}

