import { WalletType } from '@/interfaces'
import { Bus, Coins, CreditCard, Landmark, LucideIcon, WalletIcon } from 'lucide-react'

export const getIcon = (type: WalletType ): LucideIcon => {
    switch (type) {
        case 'Efectivo':
            return Coins
        case 'Cuenta Bancaria':
            return Landmark
        case 'Ahorros':
            return WalletIcon
        case 'Transporte':
            return Bus
        case 'Tarjeta de Crédito':
            return CreditCard
    }
}
