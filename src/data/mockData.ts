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

export const INITIAL_PRODUCTS: Product[] = [
  {
    code: 'ST-001',
    name: 'กระดาษ A4 Double A 80 แกรม',
    category: 'อุปกรณ์สำนักงาน',
    quantity: 12,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'รีม',
    updatedAt: '2026-07-19 14:30:22',
    building: 'อาคารอำนวยการ',
    location: 'A05'
  },
  {
    code: 'ST-002',
    name: 'หลอดไฟ LED Philips 12W',
    category: 'อุปกรณ์ซ่อมหอพัก',
    quantity: 25,
    minStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'หลอด',
    updatedAt: '2026-07-19 11:15:00',
    building: 'อาคารพัสดุกลาง',
    location: 'B12'
  },
  {
    code: 'ST-003',
    name: 'น้ำยาล้างห้องน้ำ เป็ดโปร 500 มล.',
    category: 'อุปกรณ์แม่บ้านหอพัก',
    quantity: 4, // ต่ำกว่าเกณฑ์เตือน (minStock = 8)
    minStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1585832770485-e28e329d554e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'ขวด',
    updatedAt: '2026-07-18 09:20:11',
    building: 'อาคารพัสดุกลาง',
    location: 'C03'
  },
  {
    code: 'ST-004',
    name: 'ผ้าปูที่นอนซาติน 3.5 ฟุต (สีน้ำเงิน)',
    category: 'อุปกรณ์ชุดเครื่องนอน',
    quantity: 32,
    minStock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'ผืน',
    updatedAt: '2026-07-19 16:45:30',
    building: 'หอพักหญิง 1',
    location: 'D10'
  },
  {
    code: 'ST-005',
    name: 'ปากกาลูกลื่นสีน้ำเงิน Lancer (กล่อง 50 ด้าม)',
    category: 'อุปกรณ์สำนักงาน',
    quantity: 3, // ต่ำกว่าเกณฑ์เตือน (minStock = 5)
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'กล่อง',
    updatedAt: '2026-07-17 15:00:00',
    building: 'อาคารอำนวยการ',
    location: 'A08'
  },
  {
    code: 'ST-006',
    name: 'เทปพันสายไฟ 3M อย่างดี',
    category: 'อุปกรณ์ซ่อมหอพัก',
    quantity: 15,
    minStock: 6,
    imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'ม้วน',
    updatedAt: '2026-07-15 10:40:12',
    building: 'อาคารพัสดุกลาง',
    location: 'B15'
  },
  {
    code: 'ST-007',
    name: 'ไม้กวาดดอกหญ้าหนาพิเศษ',
    category: 'อุปกรณ์แม่บ้านหอพัก',
    quantity: 18,
    minStock: 5,
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'ด้าม',
    updatedAt: '2026-07-19 08:30:00',
    building: 'อาคารพัสดุกลาง',
    location: 'C05'
  },
  {
    code: 'ST-008',
    name: 'หมอนหนุนใยสังเคราะห์ 19x29 นิ้ว',
    category: 'อุปกรณ์ชุดเครื่องนอน',
    quantity: 2, // ต่ำกว่าเกณฑ์เตือน (minStock = 10)
    minStock: 10,
    imageUrl: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    unit: 'ใบ',
    updatedAt: '2026-07-18 17:12:44',
    building: 'หอพักชาย 2',
    location: 'E02'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-IN-1721415022000',
    code: 'ST-001',
    productName: 'กระดาษ A4 Double A 80 แกรม',
    category: 'อุปกรณ์สำนักงาน',
    type: 'INTAKE',
    quantity: 10,
    prevQuantity: 2,
    newQuantity: 12,
    operator: 'ผู้ดูแลระบบทั่วไป',
    note: 'นำเข้าพัสดุประจำเดือนกรกฎาคม',
    timestamp: '2026-07-19 14:30:22'
  },
  {
    id: 'TX-OUT-1721414100000',
    code: 'ST-004',
    productName: 'ผ้าปูที่นอนซาติน 3.5 ฟุต (สีน้ำเงิน)',
    category: 'อุปกรณ์ชุดเครื่องนอน',
    type: 'WITHDRAW',
    quantity: 5,
    prevQuantity: 37,
    newQuantity: 32,
    operator: 'เจ้าหน้าที่พัสดุหอพัก',
    recipient: 'แม่บ้านสมศรี (ตึก A)',
    note: 'เปลี่ยนให้ผู้เช่าห้อง 302',
    timestamp: '2026-07-19 16:45:30'
  },
  {
    id: 'TX-IN-1721394900000',
    code: 'ST-002',
    productName: 'หลอดไฟ LED Philips 12W',
    category: 'อุปกรณ์ซ่อมหอพัก',
    type: 'INTAKE',
    quantity: 15,
    prevQuantity: 10,
    newQuantity: 25,
    operator: 'ผู้ดูแลระบบทั่วไป',
    note: 'จัดซื้อเพิ่มตามรอบบิล',
    timestamp: '2026-07-19 11:15:00'
  },
  {
    id: 'TX-OUT-1721324411000',
    code: 'ST-003',
    productName: 'น้ำยาล้างห้องน้ำ เป็ดโปร 500 มล.',
    category: 'อุปกรณ์แม่บ้านหอพัก',
    type: 'WITHDRAW',
    quantity: 4,
    prevQuantity: 8,
    newQuantity: 4,
    operator: 'เจ้าหน้าที่พัสดุหอพัก',
    recipient: 'แม่บ้านประทุม',
    note: 'เบิกใช้ทำความสะอาดตึก B และ C',
    timestamp: '2026-07-18 09:20:11'
  },
  {
    id: 'TX-OUT-1721295164000',
    code: 'ST-008',
    productName: 'หมอนหนุนใยสังเคราะห์ 19x29 นิ้ว',
    category: 'อุปกรณ์ชุดเครื่องนอน',
    type: 'WITHDRAW',
    quantity: 8,
    prevQuantity: 10,
    newQuantity: 2,
    operator: 'เจ้าหน้าที่พัสดุหอพัก',
    recipient: 'นส. อรทัย (ชั้น 4)',
    note: 'เบิกเครื่องนอนหอพักตึกชาย',
    timestamp: '2026-07-18 17:12:44'
  }
];
