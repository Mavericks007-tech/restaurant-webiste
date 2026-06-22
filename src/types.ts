/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole | string;
  createdAt: string;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  available: boolean;
  createdAt: string;
}

export interface Booking {
  id: number;
  userId?: number | null;
  name: string;
  email: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guests: number;
  specialRequests?: string;
  status: "Pending" | "Confirmed" | "Cancelled";
  createdAt: string;
}

export interface OrderItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  userId?: number | null;
  name: string;
  email: string;
  phone: string;
  items: OrderItem[];
  total: number;
  orderType: "takeaway" | "delivery";
  address?: string;
  instructions?: string;
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  paymentStatus: "Pending" | "Paid";
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
