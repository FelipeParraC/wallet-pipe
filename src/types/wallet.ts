import { LucideIcon } from 'lucide-react';

export interface Wallet {
  id: string;
  userId: string; // Nuevo campo
  name: string;
  balance: number;
  type: string;
  icon: LucideIcon;
  color: string;
  includeInTotal: boolean;
  fareValue?: number;
}

