'use client'

import { PiggyBank } from 'lucide-react'
import type { Wallet } from '@/interfaces'
import { Card, CardContent } from '../ui'
import { SavingsBoxForm } from './SavingsBoxForm'

interface NewSavingsBoxProps {
    wallets: Wallet[]
}

export const NewSavingsBox = ({ wallets }: NewSavingsBoxProps) => {
    const parentWallets = wallets.filter((wallet) => wallet.isActive && !wallet.isSavingsBox && wallet.type !== 'Tarjeta de Crédito' && wallet.type !== 'Transporte')
    const hasParentWallets = parentWallets.length > 0

    return (
        <SavingsBoxForm
            wallets={wallets}
            trigger={(
                <Card className={[
                    'group flex h-full min-h-[13rem] items-center justify-center rounded-[1.75rem] border border-dashed bg-white/[0.03] transition-all duration-200',
                    hasParentWallets
                        ? 'border-sky-300/20 hover:-translate-y-0.5 hover:border-sky-300/40 hover:bg-white/[0.05] hover:shadow-[0_18px_40px_rgba(2,6,23,0.24)]'
                        : 'border-white/10 opacity-60',
                ].join(' ')}
                >
                    <CardContent className='flex flex-col items-center justify-center p-6 text-center'>
                        <span className='flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-sky-300/20 bg-gradient-to-br from-sky-400/20 to-blue-500/10 text-sky-200'>
                            <PiggyBank className='h-8 w-8 transition-colors group-hover:text-white' />
                        </span>
                        <p className='mt-4 text-lg font-medium text-white transition-colors'>Nueva cajita</p>
                        <p className='mt-2 max-w-48 text-sm text-slate-400'>
                            {hasParentWallets ? 'Aparta dinero dentro de una cuenta.' : 'Primero crea una cuenta normal.'}
                        </p>
                    </CardContent>
                </Card>
            )}
        />
    )
}
