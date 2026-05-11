import { auth } from '@/auth.config'
import { redirect } from 'next/navigation'

export default async function WalletLayout({
    children,
}: {
    children: React.ReactNode
}) {

    const session = await auth()

    if ( session?.user && !session.user.nickname?.trim() ) {
        redirect('/completar-perfil')
    }

    if ( session?.user ) {
        redirect('/')
    }

    return (
        <main className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
                {children}
        </main>
    )
}
