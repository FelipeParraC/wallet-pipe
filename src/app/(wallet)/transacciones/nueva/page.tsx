import { getCategories, getWallets } from '@/actions'
import { CreateTransactionForm } from '@/components'

interface Props {
    searchParams: {
        walletId?: string
    }
}

export default async function NuevaTransaccionPage({ searchParams }: Props) {

    const walletId = searchParams.walletId
    const wallets = await getWallets()

    if ( !wallets ) {
        return <></>
    }

    const wallet = wallets.find((wallet) => wallet.id === walletId)
    const categories = await getCategories()

    return (
        <div className='space-y-6 max-w-2xl mx-auto text-center'>
            <h1 className='text-3xl font-bold mb-8'>Nueva Transacción</h1>
            <CreateTransactionForm wallets={ wallets } categories={ categories } wallet={ wallet } />
        </div>
    )
}

