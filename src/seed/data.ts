import { Transaction } from "@/types/transaction";
import { Wallet } from "@/types/wallet";
import { Coins, CreditCard, WalletIcon, Bus } from 'lucide-react';

export const initialTransactions: Transaction[] = [
    { id: 1, wallet: "Efectivo", title: "Compra en supermercado", description: "Compra semanal", date: "2023-05-01", amount: -50, category: 'Alimentación' },
    { id: 2, wallet: "Cuenta Corriente", title: "Pago de salario", description: "Ingreso mensual", date: "2023-05-02", amount: 1000, category: 'Ingresos' },
    { id: 3, wallet: "Tarjeta Transporte", title: "Recarga de tarjeta", description: "Transporte público", date: "2023-05-03", amount: -30, category: 'Transporte' },
    { id: 4, wallet: "Ahorros", title: "Cena en restaurante", description: "Salida con amigos", date: "2023-05-04", amount: -100, category: 'Entretenimiento' },
    { id: 5, wallet: "Cuenta Corriente", title: "Transferencia a ahorros", description: "Ahorro mensual", date: "2023-05-05", amount: -200, category: 'Transferencia' },
];

export const wallets: Wallet[] = [
    { id: "1", name: "Efectivo", balance: 500, type: "Efectivo", icon: Coins, color: "#22c55e", includeInTotal: true },
    { id: "2", name: "Cuenta Corriente", balance: 2500, type: "Cuenta Bancaria", icon: CreditCard, color: "#3b82f6", includeInTotal: true },
    { id: "3", name: "Ahorros", balance: 10000, type: "Ahorros", icon: WalletIcon, color: "#a855f7", includeInTotal: true },
    { id: "4", name: "Tarjeta Transporte", balance: 50, type: "Transporte", icon: Bus, color: "#f97316", includeInTotal: false },
];

export const categories = [
    "Alimentación",
    "Transporte",
    "Vivienda",
    "Entretenimiento",
    "Salud",
    "Educación",
    "Ropa",
    "Otros",
];

