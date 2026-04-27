import { getAmountColor, getIcon } from "@/utils"
import { CurrencyDisplay } from "../CurrencyDisplay"
import type { Wallet } from "@/interfaces"
import { Card, CardContent, CardHeader, CardTitle } from "../ui"

interface WalletInfoProps {
    wallet: Wallet
}


export const WalletInfo = ({ wallet }: WalletInfoProps) => {

    const Icon = getIcon( wallet.type )
    const isCreditCard = wallet.type === 'Tarjeta de Crédito'

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-2xl font-bold'>{ wallet.name }</CardTitle>
                <Icon className='h-8 w-8 text-muted-foreground' />
            </CardHeader>
            <CardContent>
                {isCreditCard ? (
                    <div className='space-y-4'>
                        <div>
                            <p className='text-sm text-muted-foreground'>Deuda actual</p>
                            <CurrencyDisplay
                                amount={ wallet.balance }
                                showDecimals={ true }
                                className='text-3xl font-bold text-red-400'
                            />
                        </div>
                        <div className='grid gap-3 md:grid-cols-3'>
                            <div className='rounded-md border p-3'>
                                <p className='text-xs text-muted-foreground'>Cupo disponible</p>
                                <CurrencyDisplay amount={ wallet.availableCredit ?? 0 } showDecimals={ true } className='text-lg font-semibold text-green-400' />
                            </div>
                            <div className='rounded-md border p-3'>
                                <p className='text-xs text-muted-foreground'>Cupo total</p>
                                <CurrencyDisplay amount={ wallet.creditLimit ?? 0 } showDecimals={ true } className='text-lg font-semibold' />
                            </div>
                            <div className='rounded-md border p-3'>
                                <p className='text-xs text-muted-foreground'>Ciclo</p>
                                <p className='text-lg font-semibold'>Corte {wallet.statementClosingDay} · Pago {wallet.paymentDueDay}</p>
                            </div>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                            Esta tarjeta se administra como deuda: las compras aumentan el saldo pendiente y los pagos se registran desde otra cuenta.
                        </p>
                    </div>
                ) : (
                    <>
                        <CurrencyDisplay
                            amount={ wallet.balance }
                            showDecimals={ true }
                            className={`text-3xl font-bold ${ getAmountColor( wallet.balance )}`}
                        />
                        <p className='text-sm text-muted-foreground capitalize'>
                            { wallet.type }
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
