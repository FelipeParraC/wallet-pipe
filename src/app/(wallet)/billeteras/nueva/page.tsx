
import { CreateWalletForm } from '@/components'

export default async function NuevaBilleteraPage() {

    return (
        <div className='max-w-md mx-auto text-center'>
            <h1 className='text-2xl font-bold mb-3'>Crear cuenta, tarjeta o saldo de transporte</h1>
            <p className='mb-6 text-sm text-muted-foreground'>
                Configura el saldo inicial de una cuenta, la deuda actual de una tarjeta de crédito o el saldo disponible de transporte.
            </p>
            <CreateWalletForm />
        </div>
    )
}

