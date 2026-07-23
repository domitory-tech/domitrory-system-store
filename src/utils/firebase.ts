/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Product, Transaction, User, Category } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES } from '../data/mockData';

// Helper to remove 'undefined' fields prior to sending to Firestore
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        cleanObj[key] = sanitizeForFirestore(value);
      } else {
        cleanObj[key] = value;
      }
    }
  }
  return cleanObj as T;
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Initial connection with optional Anonymous Auth
export const initFirebaseConnection = async (): Promise<void> => {
  try {
    // Attempt anonymous sign-in but do not block if disabled in Firebase console
    await signInAnonymously(auth).catch((err) => {
      console.warn("Anonymous Authentication is not enabled in Firebase Console. Proceeding with public access rules.", err);
    });
    // Test connection with a valid collection allowed by rules
    const testSnapshot = await getDocs(collection(db, 'users'));
    console.log("Firebase connection established successfully, found users count:", testSnapshot.size);
  } catch (error) {
    console.error("Firebase connection test failed: ", error);
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
    throw error;
  }
};

// Fetch all products
export const getProducts = async (): Promise<Product[]> => {
  const colPath = 'products';
  try {
    const querySnapshot = await getDocs(collection(db, colPath));
    const items: Product[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as Product);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
};

// Save or Update a product
export const saveProduct = async (product: Product): Promise<void> => {
  const colPath = 'products';
  try {
    const cleanData = sanitizeForFirestore(product);
    await setDoc(doc(db, colPath, product.code), cleanData);
    logDatabaseAction(`บันทึก/อัปเดตข้อมูลพัสดุสำเร็จ: ${product.code} - ${product.name} (คงเหลือ: ${product.quantity} ${product.unit})`, 'success');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${product.code}`);
  }
};

// Delete a product
export const deleteProductFromDb = async (code: string): Promise<void> => {
  const colPath = 'products';
  try {
    await deleteDoc(doc(db, colPath, code));
    logDatabaseAction(`ลบข้อมูลพัสดุรหัส ${code} ออกจากคลังเรียบร้อย`, 'warn');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${colPath}/${code}`);
  }
};

// Fetch all transactions
export const getTransactions = async (): Promise<Transaction[]> => {
  const colPath = 'transactions';
  try {
    const querySnapshot = await getDocs(collection(db, colPath));
    const items: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as Transaction);
    });
    // Sort transactions descending by timestamp
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
};

// Save a transaction log
export const saveTransaction = async (tx: Transaction): Promise<void> => {
  const colPath = 'transactions';
  try {
    const cleanData = sanitizeForFirestore(tx);
    await setDoc(doc(db, colPath, tx.id), cleanData);
    logDatabaseAction(`บันทึกรายการเคลื่อนไหวสำเร็จ: ${tx.id} | ${tx.type === 'INTAKE' ? 'นำเข้า (+)' : 'เบิกจ่าย (-)'} พัสดุ ${tx.code} จำนวน ${tx.quantity} (${tx.operator})`, 'success');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${tx.id}`);
  }
};

// Fetch all categories
export const getCategoriesFromDb = async (): Promise<Category[]> => {
  const colPath = 'categories';
  try {
    const querySnapshot = await getDocs(collection(db, colPath));
    const items: Category[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as Category);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
};

// Save category
export const saveCategory = async (category: Category): Promise<void> => {
  const colPath = 'categories';
  try {
    const cleanData = sanitizeForFirestore(category);
    await setDoc(doc(db, colPath, category.id), cleanData);
    logDatabaseAction(`บันทึกข้อมูลหมวดหมู่พัสดุสำเร็จ: ${category.name}`, 'success');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${category.id}`);
  }
};

// Delete category
export const deleteCategoryFromDb = async (id: string): Promise<void> => {
  const colPath = 'categories';
  try {
    await deleteDoc(doc(db, colPath, id));
    logDatabaseAction(`ลบข้อมูลหมวดหมู่พัสดุรหัส ${id} สำเร็จ`, 'warn');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${colPath}/${id}`);
  }
};

// Fetch all users
export const getUsersFromDb = async (): Promise<User[]> => {
  const colPath = 'users';
  try {
    const querySnapshot = await getDocs(collection(db, colPath));
    const items: User[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as User);
    });
    return items;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, colPath);
    return [];
  }
};

// Save user account
export const saveUser = async (user: User): Promise<void> => {
  const colPath = 'users';
  try {
    const cleanData = sanitizeForFirestore(user);
    await setDoc(doc(db, colPath, user.username), cleanData);
    logDatabaseAction(`บันทึกข้อมูลบัญชีผู้ใช้งานสำเร็จ: ${user.username} (${user.fullName} | สิทธิ์: ${user.role})`, 'success');
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${user.username}`);
  }
};

// Delete user account
export const deleteUserFromDb = async (username: string): Promise<void> => {
  const colPath = 'users';
  try {
    await deleteDoc(doc(db, colPath, username));
    logDatabaseAction(`ลบบัญชีผู้ใช้งานระบบสำเร็จ: ${username}`, 'warn');
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${colPath}/${username}`);
  }
};

// Seeds Firestore database if it is empty
export const seedInitialData = async (): Promise<{ products: Product[]; transactions: Transaction[]; users: User[]; categories: Category[] }> => {
  const dbUsers = await getUsersFromDb();
  const dbProducts = await getProducts();
  const dbTransactions = await getTransactions();
  const dbCategories = await getCategoriesFromDb();

  let finalUsers = dbUsers;
  let finalProducts = dbProducts;
  let finalTransactions = dbTransactions;
  let finalCategories = dbCategories;

  if (dbUsers.length === 0) {
    const initialUsers: User[] = [
      { username: 'admin', fullName: 'ผู้ดูแลระบบทั่วไป', role: 'Admin', password: 'admin1234' },
      { username: 'staff', fullName: 'เจ้าหน้าที่พัสดุหอพัก', role: 'Staff', password: 'staff1234' }
    ];
    for (const u of initialUsers) {
      await saveUser(u);
    }
    finalUsers = initialUsers;
  }

  if (dbCategories.length === 0) {
    for (const c of INITIAL_CATEGORIES) {
      await saveCategory(c);
    }
    finalCategories = INITIAL_CATEGORIES;
  }

  // No automatic mock products or transactions seeding - user will add their own items
  return { products: finalProducts, transactions: finalTransactions, users: finalUsers, categories: finalCategories };
};

/**
 * Log actions to the global Real-time Database Monitor
 */
export const logDatabaseAction = (text: string, type: 'info' | 'success' | 'warn' = 'info') => {
  const timestamp = new Date().toLocaleTimeString('th-TH');
  const logEntry = {
    id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
    time: timestamp,
    text,
    type
  };
  
  if (typeof window !== 'undefined') {
    if (!(window as any).__db_logs) {
      (window as any).__db_logs = [];
    }
    (window as any).__db_logs.unshift(logEntry);
    // Limit to 200 logs to preserve memory
    if ((window as any).__db_logs.length > 200) {
      (window as any).__db_logs.pop();
    }
    // Dispatch a custom event so listeners can capture this in real-time
    window.dispatchEvent(new CustomEvent('db-action-log', { detail: logEntry }));
  }
};

/**
 * Fetch stored Google Drive folder URL
 */
export const getGoogleDriveUrl = async (): Promise<string> => {
  try {
    const docSnap = await getDoc(doc(db, 'settings', 'google_drive'));
    if (docSnap.exists()) {
      return docSnap.data().url || '';
    }
    return '';
  } catch (err) {
    console.error('Error fetching Google Drive URL from Firestore:', err);
    return '';
  }
};

/**
 * Save Google Drive folder URL
 */
export const saveGoogleDriveUrl = async (url: string): Promise<void> => {
  try {
    await setDoc(doc(db, 'settings', 'google_drive'), { url, updatedAt: new Date().toISOString() });
    logDatabaseAction(`บันทึก/อัปเดตลิงก์โฟลเดอร์ Google Drive: ${url}`, 'success');
  } catch (err) {
    console.error('Error saving Google Drive URL to Firestore:', err);
    logDatabaseAction(`เกิดข้อผิดพลาดในการบันทึกลิงก์ Google Drive: ${err instanceof Error ? err.message : String(err)}`, 'warn');
    throw err;
  }
};
