import { Navbar } from '@/components'

export default function WalletLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />

            <main className="container mx-auto px-4 py-8 pb-24">
                {children}
            </main>
        </>
    )
}

