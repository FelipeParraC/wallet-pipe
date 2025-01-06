import { auth } from '@/auth.config'
import { Navbar } from '@/components'
import { redirect } from 'next/navigation'

export default async function WalletLayout({
    children,
}: {
    children: React.ReactNode
}) {

    const session = await auth()

    if ( !session?.user ) {
        redirect('/auth/login')
    }

    return (
        <>
            <Navbar />

            <main className="container mx-auto px-4 py-8 pb-24">
                {children}
            </main>
        </>
    )
}

