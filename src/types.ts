/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  costPrice: number;
  category: string;
  description?: string;
  isAvailable: boolean;
  updatedAt?: number;
  updatedBy?: string;
}

export interface AuditLog {
  id: string;
  timestamp: number;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete';
  itemName: string;
  changes: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export type PaymentMethod = 'cash' | 'card' | 'bank_transfer';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  totalCost: number;
  cashPaid: number;
  change: number;
  timestamp: number;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled' | 'awaiting_payment';
  userId: string;
  customerEmail: string;
  paymentMethod: PaymentMethod;
}

export interface DailySales {
  date: string;
  totalSales: number;
  orderCount: number;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'staff' | 'customer';
}
