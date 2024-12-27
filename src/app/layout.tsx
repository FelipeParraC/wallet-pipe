import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import { NewTransactionFloatingButton } from '@/components/NewTransactionFloatingButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Wallet Pipe',
    description: 'Aplicación para gestionar tus finanzas personales',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="es">
            <body className={inter.className}>
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    {children}
                </main>
                <NewTransactionFloatingButton />
            </body>
        </html>
    )
}

