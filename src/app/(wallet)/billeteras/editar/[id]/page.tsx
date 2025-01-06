export const revalidate = 0


import { getWalletById } from '@/actions'
import { DeleteWalletButton, EditWalletForm } from '@/components'

interface Props {
    params: { id: string }
}


export default async function EditarBilleteraPage({ params }: Props) {

    const walletId = params.id
    const wallet = await getWalletById(walletId)

    if (!wallet) {
        return <div>Cargando...</div>
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