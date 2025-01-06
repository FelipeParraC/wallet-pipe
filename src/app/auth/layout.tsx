import { auth } from '@/auth.config'
import { Navbar } from '@/components'
import { redirect } from 'next/navigation'

export default async function WalletLayout({
    children,
}: {
    children: React.ReactNode
}) {

    const session = await auth()

    if ( session?.user ) {
        redirect('/')
    }

    return (
        <>
            <Navbar />

            <main className="container mx-auto -mt-48 md:mt-0">
                {children}
            </main>
        </>
    )
}