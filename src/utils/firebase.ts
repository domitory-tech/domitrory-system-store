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
import { Product, Transaction, User } from '../types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS } from '../data/mockData';

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
    await setDoc(doc(db, colPath, product.code), product);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${product.code}`);
  }
};

// Delete a product
export const deleteProductFromDb = async (code: string): Promise<void> => {
  const colPath = 'products';
  try {
    await deleteDoc(doc(db, colPath, code));
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
    await setDoc(doc(db, colPath, tx.id), tx);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${tx.id}`);
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
    await setDoc(doc(db, colPath, user.username), user);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${colPath}/${user.username}`);
  }
};

// Delete user account
export const deleteUserFromDb = async (username: string): Promise<void> => {
  const colPath = 'users';
  try {
    await deleteDoc(doc(db, colPath, username));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${colPath}/${username}`);
  }
};

// Seeds Firestore database if it is empty
export const seedInitialData = async (): Promise<{ products: Product[]; transactions: Transaction[]; users: User[] }> => {
  const dbUsers = await getUsersFromDb();
  const dbProducts = await getProducts();
  const dbTransactions = await getTransactions();

  let finalUsers = dbUsers;
  let finalProducts = dbProducts;
  let finalTransactions = dbTransactions;

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

  if (dbProducts.length === 0) {
    for (const p of INITIAL_PRODUCTS) {
      await saveProduct(p);
    }
    finalProducts = INITIAL_PRODUCTS;
  }

  if (dbTransactions.length === 0) {
    for (const t of INITIAL_TRANSACTIONS) {
      await saveTransaction(t);
    }
    finalTransactions = INITIAL_TRANSACTIONS;
  }

  return { products: finalProducts, transactions: finalTransactions, users: finalUsers };
};
