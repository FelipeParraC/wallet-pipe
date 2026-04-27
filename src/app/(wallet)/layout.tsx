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
        <div className='relative min-h-screen overflow-x-hidden'>
            <div className='pointer-events-none fixed inset-0 -z-10'>
                <div className='ambient-grid absolute inset-0 opacity-20' />
                <div className='absolute left-[-8rem] top-[-6rem] h-72 w-72 rounded-full bg-sky-500/14 blur-3xl' />
                <div className='absolute right-[-6rem] top-20 h-64 w-64 rounded-full bg-blue-500/14 blur-3xl' />
                <div className='absolute bottom-[-8rem] left-1/3 h-72 w-72 rounded-full bg-slate-500/12 blur-3xl' />
            </div>
            <Navbar />

            <main className="mx-auto max-w-7xl px-3 py-6 pb-28 sm:px-4 sm:py-8 lg:px-6">
                {children}
            </main>
        </div>
    )
}

