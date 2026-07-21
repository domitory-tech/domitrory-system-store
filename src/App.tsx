/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ArrowUpRight, ArrowDownRight, RefreshCcw, LogOut, Menu, X, Warehouse, FileText, AlertCircle, Database, Users } from 'lucide-react';
import { User, Product, Transaction } from './types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES } from './data/mockData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Intake from './components/Intake';
import Withdraw from './components/Withdraw';
import Logs from './components/Logs';
import UsersManagement from './components/UsersManagement';
import Reports from './components/Reports';
import FirebaseConfig from './components/FirebaseConfig';
import {
  initFirebaseConnection,
  seedInitialData,
  saveProduct,
  deleteProductFromDb,
  saveTransaction,
  saveUser,
  deleteUserFromDb,
  db,
  logDatabaseAction
} from './utils/firebase';
import { doc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Firebase database states
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string>('');
  const [syncError, setSyncError] = useState<string | null>(null);

  // ข้อมูลผู้ใช้งานระบบสโตร์
  const [users, setUsers] = useState<User[]>([]);

  // Automatically persist locally as a secondary backup/fallback
  useEffect(() => {
    if (products.length > 0) {
      localStorage.setItem('gas_store_products', JSON.stringify(products));
    }
  }, [products]);

  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('gas_store_transactions', JSON.stringify(transactions));
    }
  }, [transactions]);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('gas_store_users', JSON.stringify(users));
    }
  }, [users]);

  // Initialize and load from Firebase with real-time listeners
  useEffect(() => {
    let unsubscribeProducts: () => void;
    let unsubscribeTransactions: () => void;
    let unsubscribeUsers: () => void;

    const setupFirebaseListeners = async () => {
      setIsLoadingDb(true);
      try {
        await initFirebaseConnection();
        // Seed initial data if DB is completely empty
        await seedInitialData();

        // Subscribe to products collection in real-time
        unsubscribeProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
          const prodList: Product[] = [];
          snapshot.forEach((doc) => {
            prodList.push(doc.data() as Product);
          });
          setProducts(prodList);
        }, (error) => {
          console.error("Products subscription error:", error);
        });

        // Subscribe to transactions collection in real-time
        unsubscribeTransactions = onSnapshot(collection(db, 'transactions'), (snapshot) => {
          const txList: Transaction[] = [];
          snapshot.forEach((doc) => {
            txList.push(doc.data() as Transaction);
          });
          // Sort transactions descending by timestamp
          const sorted = txList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setTransactions(sorted);
        }, (error) => {
          console.error("Transactions subscription error:", error);
        });

        // Subscribe to users collection in real-time
        unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
          const userList: User[] = [];
          snapshot.forEach((doc) => {
            userList.push(doc.data() as User);
          });
          setUsers(userList);
        }, (error) => {
          console.error("Users subscription error:", error);
        });

      } catch (err: any) {
        console.error('Failed to load Firebase data:', err);
        setSyncError('กำลังรันระบบในโหมดสำรองข้อมูลท้องถิ่น (Local Fallback Mode) เนื่องจากเชื่อมต่อ Firebase ไม่สำเร็จ: ' + err.message);
        
        // Load fallback from localStorage or mock data
        const savedProducts = localStorage.getItem('gas_store_products');
        const savedTransactions = localStorage.getItem('gas_store_transactions');
        const savedUsers = localStorage.getItem('gas_store_users');

        setProducts(savedProducts ? JSON.parse(savedProducts) : INITIAL_PRODUCTS);
        setTransactions(savedTransactions ? JSON.parse(savedTransactions) : INITIAL_TRANSACTIONS);
        setUsers(savedUsers ? JSON.parse(savedUsers) : [
          { username: 'admin', fullName: 'ผู้ดูแลระบบทั่วไป', role: 'Admin', password: 'admin1234' },
          { username: 'staff', fullName: 'เจ้าหน้าที่พัสดุหอพัก', role: 'Staff', password: 'staff1234' }
        ]);
      } finally {
        setIsLoadingDb(false);
      }
    };

    setupFirebaseListeners();

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, []);

  const handleAddUser = async (newUser: User) => {
    const nextUsers = [...users, newUser];
    setUsers(nextUsers);
    setIsSyncing(true);
    setSyncError(null);
    try {
      await saveUser(newUser);
      setSyncSuccessMessage('บันทึกข้อมูลผู้ใช้ใหม่ลง Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('บันทึกข้อมูลล้มเหลว: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteUser = async (username: string) => {
    const nextUsers = users.filter((u) => u.username !== username);
    setUsers(nextUsers);
    setIsSyncing(true);
    setSyncError(null);
    try {
      await deleteUserFromDb(username);
      setSyncSuccessMessage('ลบข้อมูลผู้ใช้จาก Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('ลบข้อมูลล้มเหลว: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateUser = async (oldUsername: string, updatedUser: User) => {
    const nextUsers = users.map((u) => (u.username === oldUsername ? updatedUser : u));
    setUsers(nextUsers);
    if (currentUser && currentUser.username === oldUsername) {
      setCurrentUser(updatedUser);
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      if (oldUsername !== updatedUser.username) {
        await deleteUserFromDb(oldUsername);
      }
      await saveUser(updatedUser);
      setSyncSuccessMessage('อัปเดตข้อมูลผู้ใช้ใน Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('บันทึกข้อมูลล้มเหลว: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ดึงรายการประเภทหมวดหมู่ที่มีในฐานข้อมูล
  const categoriesList = INITIAL_CATEGORIES.map(cat => cat.name);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
    logDatabaseAction(`ผู้ใช้งาน ${user.fullName} (@${user.username}) เข้าสู่ระบบสำเร็จ [บทบาท: ${user.role}]`, 'success');
  };

  const handleLogout = () => {
    if (currentUser) {
      logDatabaseAction(`ผู้ใช้งาน ${currentUser.fullName} (@${currentUser.username}) ออกจากระบบ`, 'info');
    }
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  useEffect(() => {
    if (currentUser) {
      const tabLabels: Record<string, string> = {
        dashboard: 'แผงควบคุมหลัก (Dashboard)',
        inventory: 'ทะเบียนคลังพัสดุ (Inventory)',
        intake: 'นำเข้าพัสดุ (Intake)',
        withdraw: 'เบิกจ่ายพัสดุ (Withdraw)',
        logs: 'ประวัติการเคลื่อนไหว (Activity Logs)',
        reports: 'รายงานและสถิติ (Reports)',
        firebase_db: 'จัดการฐานข้อมูล Cloud Firestore & Google Drive',
        users: 'จัดการข้อมูลผู้ใช้ (User Management)'
      };
      const label = tabLabels[activeTab] || activeTab;
      logDatabaseAction(`ผู้ใช้งาน ${currentUser.fullName} เข้าสู่เมนู: ${label}`, 'info');
    }
  }, [activeTab, currentUser]);

  // ดึงสินค้าจากหน้าจอเพื่อเข้าไปจัดการนำเข้า
  const handleSelectProductForIntake = (code: string) => {
    setSelectedProductCode(code);
    setActiveTab('intake');
  };

  // ดึงสินค้าจากหน้าจอเพื่อเข้าไปจัดการเบิกจ่าย
  const handleSelectProductForWithdraw = (code: string) => {
    setSelectedProductCode(code);
    setActiveTab('withdraw');
  };

  // ประมวลผลนำเข้าพัสดุ
  const handleProcessIntake = async (data: {
    code: string;
    name: string;
    category: string;
    quantity: number;
    minStock: number;
    unit: string;
    imageBase64?: string;
    note?: string;
    building?: string;
    location?: string;
  }) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    
    // อัปเดตพัสดุ
    let updatedProduct: Product;
    const prevItem = products.find(p => p.code === data.code);
    const prevQty = prevItem ? prevItem.quantity : 0;
    const newQty = prevQty + data.quantity;
    
    if (prevItem) {
      updatedProduct = {
        ...prevItem,
        quantity: newQty,
        updatedAt: timestamp,
        imageUrl: data.imageBase64 || prevItem.imageUrl
      };
    } else {
      updatedProduct = {
        code: data.code,
        name: data.name,
        category: data.category,
        quantity: data.quantity,
        minStock: data.minStock,
        unit: data.unit,
        imageUrl: data.imageBase64 || undefined,
        updatedAt: timestamp,
        building: data.building,
        location: data.location
      };
    }

    const newTx: Transaction = {
      id: `TX-IN-${Date.now()}`,
      code: data.code,
      productName: prevItem ? prevItem.name : data.name,
      category: prevItem ? prevItem.category : data.category,
      type: 'INTAKE',
      quantity: data.quantity,
      prevQuantity: prevQty,
      newQuantity: newQty,
      operator: currentUser?.fullName || 'ผู้ดูแลระบบทั่วไป',
      note: data.note,
      timestamp: timestamp
    };

    setProducts((prev) => {
      const idx = prev.findIndex(p => p.code === data.code);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = updatedProduct;
        return updated;
      } else {
        return [updatedProduct, ...prev];
      }
    });

    setTransactions((prev) => [newTx, ...prev]);

    setIsSyncing(true);
    setSyncError(null);
    try {
      await saveProduct(updatedProduct);
      await saveTransaction(newTx);
      setSyncSuccessMessage('บันทึกนำเข้าพัสดุลง Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Firebase: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ประมวลผลเบิกจ่ายพัสดุ
  const handleProcessWithdraw = async (data: {
    code: string;
    quantity: number;
    recipient: string;
    note?: string;
    operator?: string;
  }) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const item = products.find(p => p.code === data.code);
    if (!item) return;

    const newQty = Math.max(0, item.quantity - data.quantity);
    const updatedProduct = {
      ...item,
      quantity: newQty,
      updatedAt: timestamp
    };

    const newTx: Transaction = {
      id: `TX-OUT-${Date.now()}`,
      code: data.code,
      productName: item.name,
      category: item.category,
      type: 'WITHDRAW',
      quantity: data.quantity,
      prevQuantity: item.quantity,
      newQuantity: newQty,
      operator: data.operator || currentUser?.fullName || 'เจ้าหน้าที่พัสดุหอพัก',
      recipient: data.recipient,
      note: data.note,
      timestamp: timestamp
    };

    setProducts((prev) => prev.map((p) => (p.code === data.code ? updatedProduct : p)));
    setTransactions((prev) => [newTx, ...prev]);

    setIsSyncing(true);
    setSyncError(null);
    try {
      await saveProduct(updatedProduct);
      await saveTransaction(newTx);
      setSyncSuccessMessage('บันทึกเบิกจ่ายพัสดุลง Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('เกิดข้อผิดพลาดในการบันทึกข้อมูลลง Firebase: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // แก้ไขรายละเอียดพัสดุ
  const handleEditProduct = async (updatedProduct: Product) => {
    setProducts((prev) => prev.map((p) => (p.code === updatedProduct.code ? updatedProduct : p)));
    setIsSyncing(true);
    setSyncError(null);
    try {
      await saveProduct(updatedProduct);
      setSyncSuccessMessage('แก้ไขข้อมูลพัสดุใน Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ลบพัสดุออกจากระบบ
  const handleDeleteProduct = async (code: string) => {
    setProducts((prev) => prev.filter((p) => p.code !== code));
    setIsSyncing(true);
    setSyncError(null);
    try {
      await deleteProductFromDb(code);
      setSyncSuccessMessage('ลบข้อมูลพัสดุใน Firebase สำเร็จ!');
      setTimeout(() => setSyncSuccessMessage(''), 3000);
    } catch (err: any) {
      setSyncError('เกิดข้อผิดพลาดในการลบข้อมูล: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // ล้างข้อมูลทั้งหมด
  const handleResetLocalData = async () => {
    if (window.confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลพัสดุและประวัติทั้งหมดออกจากระบบ? การกระทำนี้จะลบข้อมูลออกจากระบบฐานข้อมูล Firebase แบบถาวรและไม่สามารถย้อนกลับได้')) {
      setIsSyncing(true);
      setSyncError(null);
      try {
        for (const p of products) {
          await deleteProductFromDb(p.code);
        }
        for (const t of transactions) {
          await deleteDoc(doc(db, 'transactions', t.id));
        }
        setProducts([]);
        setTransactions([]);
        setSyncSuccessMessage('ล้างข้อมูลพัสดุและรายการเคลื่อนไหวทั้งหมดใน Firebase สำเร็จ!');
        setTimeout(() => setSyncSuccessMessage(''), 3000);
      } catch (err: any) {
        setSyncError('ล้างข้อมูลผิดพลาด: ' + err.message);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  // นำเข้าข้อมูลและเขียนทับฐานข้อมูลเดิม (Restore DB)
  const handleRestoreLocalData = async (
    restoredProducts: Product[],
    restoredTransactions: Transaction[],
    restoredUsers: User[]
  ) => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      // 1. ล้างข้อมูลเก่า
      for (const p of products) {
        await deleteProductFromDb(p.code);
      }
      for (const t of transactions) {
        await deleteDoc(doc(db, 'transactions', t.id));
      }
      
      // ลบผู้ใช้เก่ายกเว้น user ปัจจุบัน เพื่อป้องกัน session ปัญหาหลุดกลางคัน
      for (const u of users) {
        if (u.username !== currentUser?.username) {
          await deleteUserFromDb(u.username);
        }
      }

      // 2. นำเข้าข้อมูลใหม่จากไฟล์สำรอง
      for (const p of restoredProducts) {
        await saveProduct(p);
      }
      for (const t of restoredTransactions) {
        await saveTransaction(t);
      }
      for (const u of restoredUsers) {
        await saveUser(u);
      }

      setProducts(restoredProducts);
      setTransactions(restoredTransactions);
      setUsers(restoredUsers);

      setSyncSuccessMessage('กู้คืนฐานข้อมูลจากไฟล์สำรอง (Restore DB) เรียบร้อยสมบูรณ์แล้ว!');
      setTimeout(() => setSyncSuccessMessage(''), 4000);
    } catch (err: any) {
      setSyncError('เกิดข้อผิดพลาดในการนำเข้าข้อมูลสำรอง: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} users={users} />;
  }

  // Loading Screen for Firestore DB
  if (isLoadingDb) {
    return (
      <div id="db-loading-screen" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center max-w-sm space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <h2 className="font-bold text-slate-800 text-sm">กำลังเชื่อมต่อฐานข้อมูล Cloud...</h2>
          <p className="text-xs text-slate-500">กรุณารอสักครู่ ระบบกำลังจัดเตรียมข้อมูลคลังพัสดุจาก console.firebase.google.com</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'แผงควบคุมหลัก', icon: LayoutDashboard },
    { id: 'inventory', label: 'ทะเบียนคลังพัสดุ', icon: Package },
    { id: 'intake', label: 'นำเข้าพัสดุ', icon: ArrowUpRight },
    { id: 'withdraw', label: 'เบิกจ่ายพัสดุ', icon: ArrowDownRight },
    { id: 'logs', label: 'ประวัติการเคลื่อนไหว', icon: RefreshCcw },
    { id: 'reports', label: 'รายงาน พิมพ์ (Export)', icon: FileText },
    ...(currentUser.role === 'Admin' ? [
      { id: 'firebase_db', label: '🔥 ฐานข้อมูล Firebase', icon: Database },
      { id: 'users', label: 'จัดการข้อมูลผู้ใช้', icon: Users }
    ] : []),
  ];

  return (
    <div id="main-application-frame" className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800">
      
      {/* SIDEBAR ON DESKTOP */}
      <aside id="desktop-sidebar" className="hidden md:flex flex-col w-64 bg-slate-100 text-slate-700 border-r border-slate-200 shrink-0 select-none">
        {/* Brand Banner */}
        <div className="p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-xl text-white">
            <Warehouse className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-sm tracking-tight">ระบบคลังสโตร์หอพัก</h1>
            <p className="text-[10px] text-slate-500 font-light mt-0.5">เบิก-นำเข้า-จ่ายพัสดุ</p>
          </div>
        </div>

        {/* User Information Profile */}
        <div className="p-4 mx-4 mt-4 bg-slate-200/55 rounded-2xl border border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center text-xs">
              {currentUser.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">{currentUser.fullName}</p>
              <span className="inline-block text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase mt-0.5">
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Google Sheets Connection Status Badge */}
        <div className="mx-4 mt-2 px-3.5 py-2 bg-white border border-slate-200/60 rounded-xl flex items-center justify-between text-[10px]">
          <span className="text-slate-400 font-medium">คลังข้อมูลหลัก:</span>
          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Cloud Firestore
          </div>
        </div>

        {/* Sidebar Menu Links */}
        <nav className="flex-1 px-4 mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Logout Bar */}
        <div className="p-4 border-t border-slate-200">
          <button
            id="btn-logout-sidebar"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบคลัง
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <header id="mobile-header" className="md:hidden bg-slate-100 text-slate-800 p-4 border-b border-slate-200 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5">
          <Warehouse className="h-5 w-5 text-indigo-600" />
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 text-sm leading-none">คลังสโตร์หอพัก</span>
            <span className="text-[8px] text-slate-500 mt-0.5">
              🟢 เชื่อมต่อฐานข้อมูล Cloud Firestore
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-toggle-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* MOBILE DROPDOWN NAVIGATION MENU */}
      {mobileMenuOpen && (
        <div id="mobile-navigation-drawer" className="md:hidden bg-slate-100 border-b border-slate-200 px-4 py-3 space-y-1 select-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
          <button
            id="btn-logout-mobile"
            onClick={() => {
              handleLogout();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            ออกจากระบบ
          </button>
        </div>
      )}

      {/* CORE CONTENT PANEL */}
      <main id="main-content-panel" className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col">

        {/* Global Firebase Background Sync Notifications */}
        {(isSyncing || syncSuccessMessage || syncError) && (
          <div className="mb-4 transition-all duration-300">
            {isSyncing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 font-semibold animate-pulse shadow-sm w-fit">
                <RefreshCcw className="h-3.5 w-3.5 text-indigo-500 animate-spin" />
                <span>กำลังบันทึกและซิงค์ข้อมูลลง Cloud Firestore...</span>
              </div>
            )}
            {syncSuccessMessage && !isSyncing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold shadow-sm w-fit animate-fade-in">
                <span className="h-2 w-2 bg-emerald-500 rounded-full"></span>
                <span>{syncSuccessMessage}</span>
              </div>
            )}
            {syncError && !isSyncing && (
              <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700 font-bold shadow-sm w-fit">
                <AlertCircle className="h-4 w-4 text-rose-500" />
                <span>{syncError}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6 flex-grow pb-8">
          {/* Render Active View Tab */}
          {activeTab === 'dashboard' && (
            <Dashboard
              products={products}
              transactions={transactions}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onSelectProductForIntake={handleSelectProductForIntake}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'inventory' && (
            <Inventory
              products={products}
              categories={categoriesList}
              currentUser={currentUser}
              onSelectProductForIntake={handleSelectProductForIntake}
              onSelectProductForWithdraw={handleSelectProductForWithdraw}
              onNavigateToTab={(tab) => setActiveTab(tab)}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === 'intake' && (
            <Intake
              products={products}
              categories={categoriesList}
              currentUser={currentUser}
              onAddTransaction={handleProcessIntake}
              selectedProductCode={selectedProductCode}
              clearSelectedProductCode={() => setSelectedProductCode('')}
            />
          )}

          {activeTab === 'withdraw' && (
            <Withdraw
              products={products}
              categories={categoriesList}
              currentUser={currentUser}
              onAddTransaction={handleProcessWithdraw}
              selectedProductCode={selectedProductCode}
              clearSelectedProductCode={() => setSelectedProductCode('')}
            />
          )}

          {activeTab === 'logs' && (
            <Logs
              transactions={transactions}
              categories={categoriesList}
            />
          )}

          {activeTab === 'reports' && (
            <Reports
              products={products}
              transactions={transactions}
              categories={categoriesList}
            />
          )}

          {activeTab === 'firebase_db' && currentUser.role === 'Admin' && (
            <FirebaseConfig
              products={products}
              transactions={transactions}
              users={users}
              onResetData={handleResetLocalData}
              onRestoreData={handleRestoreLocalData}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'users' && currentUser.role === 'Admin' && (
            <UsersManagement
              users={users}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
              currentUser={currentUser}
            />
          )}
        </div>

        {/* System Designer Credit Footer */}
        <footer className="mt-auto pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 select-none">
          <div>
            © {new Date().getFullYear()} ระบบคลังสโตร์และจัดการพัสดุหอพักกลาง
          </div>
          <div className="text-center sm:text-right flex flex-col sm:items-end gap-1">
            <span className="font-bold text-slate-600 flex items-center justify-center sm:justify-end gap-1">
              💻 ผู้ออกแบบระบบ โดย: <a href="mailto:eakpon@gmail.com" className="text-indigo-600 hover:underline">eakpon@gmail.com</a>
            </span>
            <span className="font-mono text-[9px] text-slate-400">
              code: AI studio Run : <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline">( https://github.com/ )</a>
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
