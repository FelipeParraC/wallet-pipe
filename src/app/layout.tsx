import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Wallet Pipe',
    description: 'La aplicación para gestionar tus finanzas personales',
    manifest: '/manifest.json',
    icons: {
        apple: '/logo512.png',
    }
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang='es' className='dark'>
            <body className={`${inter.className} bg-gray-950 text-gray-100 select-none`}>
                { children }
                <Analytics />
            </body>
        </html>
    )
}

