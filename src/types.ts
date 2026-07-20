/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  username: string;
  fullName: string;
  role: string;
  password?: string;
}

export interface Product {
  code: string;       // รหัสอุปกรณ์
  name: string;       // ชื่ออุปกรณ์
  category: string;   // หมวดหมู่
  quantity: number;   // จำนวนคงเหลือ
  minStock: number;   // จุดแจ้งเตือนขั้นต่ำ
  imageUrl?: string;  // รูปภาพสินค้า
  unit: string;       // หน่วยนับ
  updatedAt: string;  // อัปเดตล่าสุด
  building?: string;  // อาคารที่เก็บอุปกรณ์
  location?: string;  // จุดเก็บอุปกรณ์ เช่น A1-A20
}

export interface Transaction {
  id: string;
  code: string;
  productName: string;
  category: string;
  type: 'INTAKE' | 'WITHDRAW'; // นำเข้า หรือ เบิกจ่าย
  quantity: number;
  prevQuantity: number;
  newQuantity: number;
  operator: string;           // ผู้ทำรายการ
  recipient?: string;         // ผู้รับสินค้า (สำหรับเบิกจ่าย)
  note?: string;              // หมายเหตุ
  timestamp: string;          // วันที่-เวลา
}

export interface Category {
  id: string;
  name: string;
  folderId?: string;          // Google Drive Folder ID
}
