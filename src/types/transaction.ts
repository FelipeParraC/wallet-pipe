export interface Transaction {
    id: number;
    wallet: string;
    title: string;
    description: string;
    date: string;
    amount: number;
    category: string;
}