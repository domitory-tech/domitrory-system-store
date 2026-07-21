/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Transaction, User } from '../types';

let cachedAccessToken: string | null = null;
let isSigningIn = false;

let authSuccessCallback: ((user: any, token: string) => void) | null = null;
let authFailureCallback: (() => void) | null = null;

// Dynamically load the Google Identity Services SDK
export const loadGis = (): Promise<void> => {
  return new Promise((resolve) => {
    if ((window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    document.head.appendChild(script);
  });
};

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: any, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (onAuthSuccess) authSuccessCallback = onAuthSuccess;
  if (onAuthFailure) authFailureCallback = onAuthFailure;

  if (cachedAccessToken) {
    const email = localStorage.getItem('google_logged_in_email') || 'Google Account';
    if (onAuthSuccess) onAuthSuccess({ email }, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }

  // Return a dummy unsubscribe function
  return () => {
    authSuccessCallback = null;
    authFailureCallback = null;
  };
};

// Sign in with Google Popup using Google Identity Services (GIS)
export const googleSignIn = async (): Promise<{ user: { email: string }; accessToken: string } | null> => {
  await loadGis();

  return new Promise((resolve, reject) => {
    try {
      isSigningIn = true;
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            isSigningIn = false;
            reject(new Error(tokenResponse.error_description || tokenResponse.error));
            return;
          }

          const accessToken = tokenResponse.access_token;
          cachedAccessToken = accessToken;

          try {
            // Retrieve user email via Google userinfo API
            const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` }
            });
            let email = 'Google Account';
            if (profileRes.ok) {
              const profile = await profileRes.json();
              email = profile.email || 'Google Account';
            }

            localStorage.setItem('google_logged_in_email', email);

            const userObj = { email };
            if (authSuccessCallback) {
              authSuccessCallback(userObj, accessToken);
            }

            resolve({ user: userObj, accessToken });
          } catch (err) {
            console.error('Failed to retrieve user info:', err);
            const userObj = { email: 'Connected Account' };
            localStorage.setItem('google_logged_in_email', userObj.email);
            if (authSuccessCallback) {
              authSuccessCallback(userObj, accessToken);
            }
            resolve({ user: userObj, accessToken });
          } finally {
            isSigningIn = false;
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      isSigningIn = false;
      reject(err);
    }
  });
};

// Sign out
export const googleSignOut = async () => {
  cachedAccessToken = null;
  localStorage.removeItem('google_logged_in_email');
  localStorage.removeItem('google_spreadsheet_id');
  localStorage.removeItem('google_spreadsheet_url');
  if (authFailureCallback) {
    authFailureCallback();
  }
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
