/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Transaction, Category } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'อุปกรณ์สำนักงาน', folderId: 'drive_folder_office_001' },
  { id: 'cat-2', name: 'อุปกรณ์ซ่อมหอพัก', folderId: 'drive_folder_repair_002' },
  { id: 'cat-3', name: 'อุปกรณ์แม่บ้านหอพัก', folderId: 'drive_folder_cleaning_003' },
  { id: 'cat-4', name: 'อุปกรณ์ชุดเครื่องนอน', folderId: 'drive_folder_bedding_004' }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];
