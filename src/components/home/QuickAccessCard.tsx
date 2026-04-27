import Link from 'next/link'
import { CreditCard, PieChart, Receipt, Settings, Wallet } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '../ui'

const quickLinks = [
    { name: 'Movimientos', href: '/transacciones', icon: Receipt },
    { name: 'Cuentas', href: '/billeteras', icon: Wallet },
    { name: 'Planeación', href: '/planeacion', icon: CreditCard },
    { name: 'Reportes', href: '/reportes', icon: PieChart },
    { name: 'Ajustes', href: '/configuracion', icon: Settings },
]

export const QuickAccessCard = () => {
    return (
        <Card className='rounded-[1.75rem]'>
            <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-3'>
                {quickLinks.map((link) => (
                    <Button key={link.name} asChild variant='outline' className='h-20 flex-col rounded-[1.5rem]'>
                        <Link href={link.href}>
                            <link.icon className='h-6 w-6 mb-2' />
                            {link.name}
                        </Link>
                    </Button>
                ))}
            </CardContent>
        </Card>
    )
}
