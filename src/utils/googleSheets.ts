/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Transaction, User } from '../types';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Scopes
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // If we have user but no token (e.g. on refresh), we can trigger signInWithPopup or ask user to click
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Clear and show login
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup
export const googleSignIn = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('ไม่พบ Access Token จากบัญชี Google');
    }
    cachedAccessToken = credential.accessToken;
    // Save to localStorage for convenience (only non-sensitive sign-in state, NOT token)
    localStorage.setItem('google_logged_in_email', result.user.email || '');
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Sign out
export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem('google_logged_in_email');
  localStorage.removeItem('google_spreadsheet_id');
  localStorage.removeItem('google_spreadsheet_url');
};

export const getAccessToken = () => cachedAccessToken;

// REST API Wrappers
const HEADERS_PRODUCTS = ["รหัสอุปกรณ์", "ชื่ออุปกรณ์", "หมวดหมู่", "จำนวนคงเหลือ", "จุดแจ้งเตือนขั้นต่ำ", "หน่วยนับ", "อัปเดตล่าสุด", "อาคารที่เก็บ", "ตำแหน่งที่เก็บ", "ลิงก์รูปภาพ"];
const HEADERS_TRANSACTIONS = ["ID รายการ", "รหัสอุปกรณ์", "ชื่ออุปกรณ์", "หมวดหมู่", "ประเภท", "จำนวน", "จำนวนก่อนหน้า", "จำนวนใหม่", "ผู้ทำรายการ", "ผู้รับสินค้า", "หมายเหตุ", "วัน-เวลา"];
const HEADERS_USERS = ["Username", "ชื่อ-นามสกุล", "บทบาท", "รหัสผ่าน"];

/**
 * Searches for spreadsheet on user's drive or creates a new one
 */
export const findOrCreateSpreadsheet = async (
  token: string,
  initialProducts: Product[],
  initialTransactions: Transaction[],
  initialUsers: User[]
): Promise<{ spreadsheetId: string; url: string; createdNew: boolean }> => {
  const fileName = "คลังสโตร์หอพัก (Dormitory Inventory Store)";
  
  // 1. Search for existing file
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`;
  
  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!searchRes.ok) {
    throw new Error('การค้นหาไฟล์บน Google Drive ล้มเหลว: ' + searchRes.statusText);
  }
  
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    const file = searchData.files[0];
    localStorage.setItem('google_spreadsheet_id', file.id);
    localStorage.setItem('google_spreadsheet_url', file.webViewLink);
    return { spreadsheetId: file.id, url: file.webViewLink, createdNew: false };
  }

  // 2. Create new Spreadsheet if not found
  const createUrl = `https://sheets.googleapis.com/v4/spreadsheets`;
  const createPayload = {
    properties: {
      title: fileName
    },
    sheets: [
      { properties: { title: "Products" } },
      { properties: { title: "Transactions" } },
      { properties: { title: "Users" } }
    ]
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(createPayload)
  });

  if (!createRes.ok) {
    throw new Error('การสร้างไฟล์ Google Sheets ใหม่ล้มเหลว: ' + createRes.statusText);
  }

  const sheetData = await createRes.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const url = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  localStorage.setItem('google_spreadsheet_id', spreadsheetId);
  localStorage.setItem('google_spreadsheet_url', url);

  // 3. Upload initial local data to populate the newly created spreadsheet
  await pushDataToSpreadsheet(token, spreadsheetId, initialProducts, initialTransactions, initialUsers);

  return { spreadsheetId, url, createdNew: true };
};

/**
 * Clear and Write Data to Google Sheet tabs
 */
export const pushDataToSpreadsheet = async (
  token: string,
  spreadsheetId: string,
  products: Product[],
  transactions: Transaction[],
  users: User[]
): Promise<void> => {
  const sheetsToUpdate = [
    {
      name: "Products",
      headers: HEADERS_PRODUCTS,
      rows: products.map(p => [
        p.code,
        p.name,
        p.category,
        p.quantity.toString(),
        p.minStock.toString(),
        p.unit,
        p.updatedAt,
        p.building || '',
        p.location || '',
        p.imageUrl || ''
      ])
    },
    {
      name: "Transactions",
      headers: HEADERS_TRANSACTIONS,
      rows: transactions.map(t => [
        t.id,
        t.code,
        t.productName,
        t.category,
        t.type,
        t.quantity.toString(),
        t.prevQuantity.toString(),
        t.newQuantity.toString(),
        t.operator,
        t.recipient || '',
        t.note || '',
        t.timestamp
      ])
    },
    {
      name: "Users",
      headers: HEADERS_USERS,
      rows: users.map(u => [
        u.username,
        u.fullName,
        u.role,
        u.password || ''
      ])
    }
  ];

  for (const sheet of sheetsToUpdate) {
    // A. Clear the existing content
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheet.name}!A1:Z1000:clear`;
    await fetch(clearUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });

    // B. Construct value grid (header + data rows)
    const values = [sheet.headers, ...sheet.rows];

    // C. Write to Google Sheet
    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheet.name}!A1?valueInputOption=RAW`;
    const writeRes = await fetch(writeUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    });

    if (!writeRes.ok) {
      throw new Error(`การอัปโหลดชีต ${sheet.name} ล้มเหลว: ` + writeRes.statusText);
    }
  }
};

/**
 * Fetch and Parse Data from Google Sheet
 */
export const pullDataFromSpreadsheet = async (
  token: string,
  spreadsheetId: string
): Promise<{ products: Product[]; transactions: Transaction[]; users: User[] }> => {
  
  // A. Fetch Products
  const productsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Products!A1:J1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let products: Product[] = [];
  if (productsRes.ok) {
    const data = await productsRes.json();
    if (data.values && data.values.length > 1) {
      const rows = data.values.slice(1); // Skip header row
      products = rows.map((row: any[]): Product => ({
        code: row[0] || '',
        name: row[1] || '',
        category: row[2] || '',
        quantity: parseInt(row[3] || '0', 10),
        minStock: parseInt(row[4] || '0', 10),
        unit: row[5] || '',
        updatedAt: row[6] || '',
        building: row[7] || '',
        location: row[8] || '',
        imageUrl: row[9] || ''
      })).filter(p => p.code);
    }
  }

  // B. Fetch Transactions
  const transactionsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Transactions!A1:L1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let transactions: Transaction[] = [];
  if (transactionsRes.ok) {
    const data = await transactionsRes.json();
    if (data.values && data.values.length > 1) {
      const rows = data.values.slice(1);
      transactions = rows.map((row: any[]): Transaction => ({
        id: row[0] || '',
        code: row[1] || '',
        productName: row[2] || '',
        category: row[3] || '',
        type: (row[4] || 'INTAKE') as 'INTAKE' | 'WITHDRAW',
        quantity: parseInt(row[5] || '0', 10),
        prevQuantity: parseInt(row[6] || '0', 10),
        newQuantity: parseInt(row[7] || '0', 10),
        operator: row[8] || '',
        recipient: row[9] || '',
        note: row[10] || '',
        timestamp: row[11] || ''
      })).filter(t => t.id);
    }
  }

  // C. Fetch Users
  const usersRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Users!A1:D1000`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  let users: User[] = [];
  if (usersRes.ok) {
    const data = await usersRes.json();
    if (data.values && data.values.length > 1) {
      const rows = data.values.slice(1);
      users = rows.map((row: any[]): User => ({
        username: row[0] || '',
        fullName: row[1] || '',
        role: row[2] || '',
        password: row[3] || ''
      })).filter(u => u.username);
    }
  }

  return { products, transactions, users };
};
