import { Navbar } from '@/components'

export default function WalletLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            <Navbar />

            <main className="container mx-auto -mt-48 md:-mt-20">
                {children}
            </main>
        </>
    )
}