/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MenuItem } from './types';

export const MENU_ITEMS: MenuItem[] = [
  // Kotas
  { id: 'k1', name: 'Standard Kota', price: 25, costPrice: 12, category: 'Kotas', description: 'Fresh 1/4 loaf, crispy chips, polony, atchar, and special house sauce.', isAvailable: true },
  { id: 'k2', name: 'Student Special', price: 35, costPrice: 18, category: 'Kotas', description: '1/4 loaf, chips, polony, vienna, and cheese.', isAvailable: true },
  { id: 'k3', name: 'Witbank King', price: 55, costPrice: 30, category: 'Kotas', description: '1/4 loaf, double chips, double polony, russian, egg, and double cheese.', isAvailable: true },
  { id: 'k4', name: 'Full House BBQ', price: 75, costPrice: 42, category: 'Kotas', description: 'The absolute works: Beef patty, russian, vienna, egg, cheese, chips, and polony.', isAvailable: true },
  
  // Platters & Meals
  { id: 'p1', name: 'Family Platter', price: 180, costPrice: 95, category: 'Grills', description: 'Large chips, 4 russians, 4 viennas, and a 2L cold drink.', isAvailable: true },
  { id: 'p2', name: 'Quarter Chicken & Chips', price: 65, costPrice: 35, category: 'Grills', description: 'Flame grilled 1/4 chicken served with a generous portion of chips.', isAvailable: true },
  
  // Burgers
  { id: 'b1', name: 'Beef Burger', price: 35, costPrice: 18, category: 'Burgers', description: 'Grilled beef patty, lettuce, tomato, and house burger sauce.', isAvailable: true },
  { id: 'b2', name: 'Cheese Burger', price: 42, costPrice: 22, category: 'Burgers', description: 'Standard beef burger with a thick slice of cheddar.', isAvailable: true },
  { id: 'b3', name: 'Dagwood Special', price: 85, costPrice: 45, category: 'Burgers', description: 'Triple decker burger with beef patty, egg, bacon, cheese, and chips.', isAvailable: true },
  
  // Chips
  { id: 'c1', name: 'Slap Chips (S)', price: 18, costPrice: 6, category: 'Chips', description: 'Traditional soft slap chips with vinegar and salt.', isAvailable: true },
  { id: 'c2', name: 'Slap Chips (M)', price: 30, costPrice: 10, category: 'Chips', description: 'Medium portion of traditional slap chips.', isAvailable: true },
  { id: 'c3', name: 'Slap Chips (L)', price: 45, costPrice: 15, category: 'Chips', description: 'Large family sharing portion of slap chips.', isAvailable: true },
  
  // Proteins & Add-ons
  { id: 's1', name: 'Russian (Big)', price: 22, costPrice: 10, category: 'Sides', description: 'Deep fried spicy beef russian.', isAvailable: true },
  { id: 's2', name: 'Vienna (2)', price: 14, costPrice: 6, category: 'Sides', description: 'Two smoked viennas.', isAvailable: true },
  { id: 's3', name: 'Polony Slice (3)', price: 10, costPrice: 3, category: 'Sides', isAvailable: true },
  { id: 's4', name: 'Fried Egg', price: 8, costPrice: 2, category: 'Sides', isAvailable: true },
  
  // Drinks
  { id: 'd1', name: 'Coca-Cola 500ml', price: 20, costPrice: 11, category: 'Drinks', isAvailable: true },
  { id: 'd2', name: 'Twizza 500ml', price: 14, costPrice: 7, category: 'Drinks', isAvailable: true },
  { id: 'd3', name: 'Score Energy', price: 12, costPrice: 6, category: 'Drinks', isAvailable: true },
  { id: 'd4', name: 'Stoney Ginger Beer', price: 20, costPrice: 11, category: 'Drinks', isAvailable: true },
];

export const CATEGORIES = ['All', 'Kotas', 'Grills', 'Burgers', 'Chips', 'Sides', 'Drinks'];
