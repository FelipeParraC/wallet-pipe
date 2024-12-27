import { LucideIcon } from 'lucide-react';

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: string;
  icon: LucideIcon;
  color: string;
  includeInTotal: boolean;
}

