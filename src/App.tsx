/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ArrowUpRight, ArrowDownRight, RefreshCcw, FileCode, LogOut, Menu, X, Warehouse, FileText, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { User, Product, Transaction } from './types';
import { INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_CATEGORIES } from './data/mockData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Intake from './components/Intake';
import Withdraw from './components/Withdraw';
import Logs from './components/Logs';
import GasDeveloper from './components/GasDeveloper';
import UsersManagement from './components/UsersManagement';
import Reports from './components/Reports';
import { Users } from 'lucide-react';
import {
  isConfigured,
  fetchLiveProducts,
  fetchLiveTransactions,
  fetchLiveUsers,
  syncIntake,
  syncWithdraw,
  syncEditProduct,
  syncDeleteProduct,
  syncAddUser,
  syncDeleteUser,
  syncUpdateUser
} from './utils/gasApi';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Local persistence fallback
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('gas_store_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('gas_store_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ข้อมูลผู้ใช้งานระบบสโตร์
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('gas_store_users');
    return saved ? JSON.parse(saved) : [
      { username: 'admin', fullName: 'ผู้ดูแลระบบทั่วไป', role: 'Admin', password: 'admin1234' },
      { username: 'staff', fullName: 'เจ้าหน้าที่พัสดุหอพัก', role: 'Staff', password: 'staff1234' }
    ];
  });

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccessMessage, setSyncSuccessMessage] = useState<string | null>(null);

  // Automatically persist locally
  useEffect(() => {
    localStorage.setItem('gas_store_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('gas_store_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('gas_store_users', JSON.stringify(users));
  }, [users]);

  // Sync pull function
  const handleSyncFromGAS = async (showSuccessToast = false) => {
    if (!isConfigured()) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const liveProducts = await fetchLiveProducts();
      if (liveProducts) {
        setProducts(liveProducts);
      }

      const liveTxs = await fetchLiveTransactions();
      if (liveTxs) {
        setTransactions(liveTxs);
      }

      const liveUsers = await fetchLiveUsers();
      if (liveUsers && liveUsers.length > 0) {
        // preserve password fields if missing from api
        setUsers(prev => {
          return liveUsers.map(lu => {
            const match = prev.find(p => p.username === lu.username);
            return {
              ...lu,
              password: lu.password || (match ? match.password : '1234')
            };
          });
        });
      }

      if (showSuccessToast) {
        setSyncSuccessMessage('🔄 ดึงข้อมูลล่าสุดจาก Google Sheets สำเร็จ!');
        setTimeout(() => setSyncSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      setSyncError('ไม่สามารถเชื่อมต่อ Google Sheets ได้ กรุณาเช็ค Apps Script URL');
    } finally {
      setIsSyncing(false);
    }
  };

  // Initial pull on mount
  useEffect(() => {
    if (isConfigured()) {
      handleSyncFromGAS();
    }
  }, []);

  const handleAddUser = async (newUser: User) => {
    setUsers((prev) => [...prev, newUser]);
    if (isConfigured()) {
      try {
        await syncAddUser(newUser);
        await handleSyncFromGAS();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeleteUser = async (username: string) => {
    setUsers((prev) => prev.filter((u) => u.username !== username));
    if (isConfigured()) {
      try {
        await syncDeleteUser(username);
        await handleSyncFromGAS();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdateUser = async (oldUsername: string, updatedUser: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.username === oldUsername ? updatedUser : u))
    );
    if (currentUser && currentUser.username === oldUsername) {
      setCurrentUser(updatedUser);
    }
    if (isConfigured()) {
      try {
        await syncUpdateUser(oldUsername, updatedUser);
        await handleSyncFromGAS();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ดึงรายการประเภทหมวดหมู่ที่มีในฐานข้อมูล
  const categoriesList = INITIAL_CATEGORIES.map(cat => cat.name);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

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
    setProducts((prevProducts) => {
      const idx = prevProducts.findIndex(p => p.code === data.code);
      if (idx !== -1) {
        // มีสินค้าอยู่เดิม
        const updated = [...prevProducts];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + data.quantity,
          updatedAt: timestamp,
          imageUrl: data.imageBase64 || updated[idx].imageUrl
        };
        return updated;
      } else {
        // รายการสินค้าใหม่
        const newProduct: Product = {
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
        return [newProduct, ...prevProducts];
      }
    });

    // บันทึก Log ประวัติ
    const prevItem = products.find(p => p.code === data.code);
    const prevQty = prevItem ? prevItem.quantity : 0;
    const newTx: Transaction = {
      id: `TX-IN-${Date.now()}`,
      code: data.code,
      productName: prevItem ? prevItem.name : data.name,
      category: prevItem ? prevItem.category : data.category,
      type: 'INTAKE',
      quantity: data.quantity,
      prevQuantity: prevQty,
      newQuantity: prevQty + data.quantity,
      operator: currentUser?.fullName || 'ผู้ดูแลระบบทั่วไป',
      note: data.note,
      timestamp: timestamp
    };

    setTransactions((prevTxs) => [newTx, ...prevTxs]);

    // ส่งเข้า Google Sheets
    if (isConfigured()) {
      try {
        await syncIntake({
          ...data,
          operator: currentUser?.fullName || 'ผู้ดูแลระบบทั่วไป',
          imageName: `img_${data.code}_${Date.now()}.png`
        });
        await handleSyncFromGAS();
      } catch (err) {
        console.error("GAS intake failed:", err);
      }
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

    // อัปเดตจำนวนคงเหลือพัสดุ
    setProducts((prevProducts) => {
      const idx = prevProducts.findIndex(p => p.code === data.code);
      if (idx !== -1) {
        const updated = [...prevProducts];
        updated[idx] = {
          ...updated[idx],
          quantity: Math.max(0, updated[idx].quantity - data.quantity),
          updatedAt: timestamp
        };
        return updated;
      }
      return prevProducts;
    });

    // บันทึกประวัติเบิกจ่าย
    const newTx: Transaction = {
      id: `TX-OUT-${Date.now()}`,
      code: data.code,
      productName: item.name,
      category: item.category,
      type: 'WITHDRAW',
      quantity: data.quantity,
      prevQuantity: item.quantity,
      newQuantity: item.quantity - data.quantity,
      operator: data.operator || currentUser?.fullName || 'เจ้าหน้าที่พัสดุหอพัก',
      recipient: data.recipient,
      note: data.note,
      timestamp: timestamp
    };

    setTransactions((prevTxs) => [newTx, ...prevTxs]);

    // ส่งเข้า Google Sheets
    if (isConfigured()) {
      try {
        await syncWithdraw({
          ...data,
          operator: data.operator || currentUser?.fullName || 'เจ้าหน้าที่พัสดุหอพัก'
        });
        await handleSyncFromGAS();
      } catch (err) {
        console.error("GAS withdraw failed:", err);
      }
    }
  };

  // แก้ไขรายละเอียดพัสดุ
  const handleEditProduct = async (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.code === updatedProduct.code ? updatedProduct : p))
    );
    if (isConfigured()) {
      try {
        await syncEditProduct(updatedProduct);
        await handleSyncFromGAS();
      } catch (err) {
        console.error("GAS edit failed:", err);
      }
    }
  };

  // ลบพัสดุออกจากระบบ
  const handleDeleteProduct = async (code: string) => {
    setProducts((prev) => prev.filter((p) => p.code !== code));
    if (isConfigured()) {
      try {
        await syncDeleteProduct(code);
        await handleSyncFromGAS();
      } catch (err) {
        console.error("GAS delete failed:", err);
      }
    }
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} users={users} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'แผงควบคุมหลัก', icon: LayoutDashboard },
    { id: 'inventory', label: 'ทะเบียนคลังพัสดุ', icon: Package },
    { id: 'intake', label: 'นำเข้าพัสดุ', icon: ArrowUpRight },
    { id: 'withdraw', label: 'เบิกจ่ายพัสดุ', icon: ArrowDownRight },
    { id: 'logs', label: 'ประวัติการเคลื่อนไหว', icon: RefreshCcw },
    { id: 'reports', label: 'รายงาน พิมพ์ (Export)', icon: FileText },
    ...(currentUser.role === 'Admin' ? [
      { id: 'users', label: 'จัดการข้อมูลผู้ใช้', icon: Users },
      { id: 'developer', label: '🔋 ติดตั้งฐานข้อมูล (GAS)', icon: FileCode }
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

        {/* Sidebar Menu Links */}
        <nav className="flex-1 px-4 space-y-1">
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
              {isConfigured() ? '🟢 Google Sheets API' : '⚪ Local Simulation Mode'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConfigured() && (
            <button
              onClick={() => handleSyncFromGAS(true)}
              disabled={isSyncing}
              className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
              title="ดึงข้อมูลล่าสุด"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          )}
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
        {/* Dynamic Sync Notification Toast */}
        {syncSuccessMessage && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 font-medium shadow-sm">
            <span className="p-1 bg-emerald-500 rounded-lg text-white text-[10px] font-bold">✓</span>
            <div>{syncSuccessMessage}</div>
          </div>
        )}
        {syncError && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium shadow-sm">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
            <div>{syncError}</div>
          </div>
        )}
        {isSyncing && !syncSuccessMessage && (
          <div className="mb-4 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-center gap-3 text-xs text-indigo-700 font-medium shadow-sm">
            <RefreshCcw className="h-4 w-4 text-indigo-500 animate-spin shrink-0" />
            <div>กำลังอัปเดตและประสานข้อมูลกับ Google Sheets...</div>
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

          {activeTab === 'users' && currentUser.role === 'Admin' && (
            <UsersManagement
              users={users}
              onAddUser={handleAddUser}
              onDeleteUser={handleDeleteUser}
              onUpdateUser={handleUpdateUser}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'developer' && currentUser.role === 'Admin' && (
            <GasDeveloper onSync={() => handleSyncFromGAS(true)} />
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
              code: AI studio Run : <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline">( https://github.com/ )</a> | Google Dirver | Google Sheets
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
