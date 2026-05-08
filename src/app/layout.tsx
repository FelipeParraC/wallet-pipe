import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Analytics } from '@vercel/analytics/react'
import { Provider } from '@/components'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Wallet Pipe',
    description: 'La aplicación para gestionar tus finanzas personales',
    manifest: '/manifest.json',
    icons: {
        icon: [
            { url: '/logo.png', sizes: '128x128', type: 'image/png' },
            { url: '/logo192.png', sizes: '192x192', type: 'image/png' },
            { url: '/logo512.png', sizes: '512x512', type: 'image/png' },
        ],
        shortcut: '/logo.png',
        apple: '/apple-touch-icon.png',
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
                <Provider>
                    { children }
                </Provider>
                
                <Analytics />
            </body>
        </html>
    )
}

