import { getAmountColor, getIcon } from "@/utils"
import { CurrencyDisplay } from "../CurrencyDisplay"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Wallet } from "@/interfaces"

interface WalletInfoProps {
    wallet: Wallet
}


export const WalletInfo = ({ wallet }: WalletInfoProps) => {

    const Icon = getIcon( wallet.type )

    return (
        <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-2xl font-bold'>{ wallet.name }</CardTitle>
                <Icon className='h-8 w-8 text-muted-foreground' />
            </CardHeader>
            <CardContent>
                <CurrencyDisplay
                    amount={ wallet.balance }
                    showDecimals={ true }
                    className={`text-3xl font-bold ${ getAmountColor( wallet.balance )}`}
                />
                <p className='text-sm text-muted-foreground capitalize'>
                    { wallet.type }
                </p>
            </CardContent>
        </Card>
    )
}
