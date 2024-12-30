import Link from "next/link"
import { PieChart, Receipt, Settings, Wallet } from "lucide-react"
import { Button, Card, CardContent, CardHeader, CardTitle } from "../ui"

const quickLinks = [
    { name: 'Transacciones', href: '/transacciones', icon: Receipt },
    { name: 'Billeteras', href: '/billeteras', icon: Wallet },
    { name: 'Reportes', href: '/reportes', icon: PieChart },
    { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export const QuickAccessCard = () => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Accesos Rápidos</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-4'>
                {quickLinks.map((link) => (
                    <Button key={link.name} asChild variant='outline' className='h-20 flex flex-col items-center justify-center'>
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
