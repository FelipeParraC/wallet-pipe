export const revalidate = 0


import { getWalletById } from '@/actions'
import { DeleteWalletButton, EditWalletForm } from '@/components'
import { redirect } from 'next/navigation'

interface Props {
    params: { id: string }
}


export default async function EditarBilleteraPage({ params }: Props) {

    const walletId = params.id
    const respWallet = await getWalletById( walletId )
    
    if ( !respWallet.ok ) {
        redirect('/billeteras')
    }

    const wallet = respWallet.wallet
    
    if (!wallet) {
        return <div>Cargando...</div>
    }

    if ( !wallet.isActive ) {
        redirect('/billeteras')
    }

    return (
        <div className='max-w-md mx-auto text-center'>
            <h1 className='text-2xl font-bold mb-6'>Editar Billetera</h1>
            <EditWalletForm wallet={ wallet } />
            
            <div className='mt-16'>
                <DeleteWalletButton walletId={ walletId } />
            </div>
        </div>
    )
}