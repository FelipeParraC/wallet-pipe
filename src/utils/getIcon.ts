import { WalletType } from '@/interfaces'
import { Bus, Coins, CreditCard, LucideIcon, WalletIcon } from 'lucide-react'

export const getIcon = (type: WalletType ): LucideIcon => {
    switch (type) {
        case 'Efectivo':
            return Coins
        case 'Cuenta Bancaria':
            return CreditCard
        case 'Ahorros':
            return WalletIcon
        case 'Transporte':
            return Bus
    }
}