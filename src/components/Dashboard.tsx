/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Package, Inbox, AlertTriangle, XCircle, ArrowUpRight, ArrowDownRight, RefreshCcw, Bell, Database, Sparkles, BookOpen, X, FileSpreadsheet } from 'lucide-react';
import { Product, Transaction, User } from '../types';

interface DashboardProps {
  products: Product[];
  transactions: Transaction[];
  onNavigateToTab: (tab: string) => void;
  onSelectProductForIntake: (code: string) => void;
  currentUser: User;
}

export default function Dashboard({ products, transactions, onNavigateToTab, onSelectProductForIntake, currentUser }: DashboardProps) {
  const [showSetupBanner, setShowSetupBanner] = useState(false);
  
  // คำนวณสถิติ
  const totalItems = products.length;
  const totalQuantity = products.reduce((acc, item) => acc + item.quantity, 0);
  const lowStockItems = products.filter(item => item.quantity <= item.minStock && item.quantity > 0);
  const outOfStockItems = products.filter(item => item.quantity === 0);

  // ดึงรายการล่าสุด 5 รายการ
  const recentTransactions = [...transactions].slice(0, 5);

  return (
    <div id="dashboard-tab-content" className="space-y-6">
      {/* Header Panel */}
      <div id="dashboard-header" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div>
          <h2 id="dashboard-heading" className="text-xl font-bold text-slate-900">ภาพรวมสโตร์และคลังพัสดุหอพัก</h2>
          <p className="text-sm text-slate-500 mt-1">สรุปสถานะพัสดุคงเหลือ จุดสั่งซื้อ และรายการเคลื่อนไหวแบบเรียลไทม์</p>
        </div>
        <div className="flex gap-2.5">
          <button
            id="btn-shortcut-intake"
            onClick={() => onNavigateToTab('intake')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <ArrowUpRight className="h-4.5 w-4.5" />
            นำเข้าพัสดุ
          </button>
          <button
            id="btn-shortcut-withdraw"
            onClick={() => onNavigateToTab('withdraw')}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-medium shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <ArrowDownRight className="h-4.5 w-4.5" />
            เบิกจ่ายพัสดุ
          </button>
        </div>
      </div>



      {/* KPI Stats Grid */}
      <div id="dashboard-kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Total Items */}
        <div id="kpi-total-items" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">พัสดุทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalItems}</p>
            <p className="text-xs text-slate-500 mt-0.5">รายการอุปกรณ์ที่ลงทะเบียน</p>
          </div>
        </div>

        {/* KPI 2: Total Quantity */}
        <div id="kpi-total-quantity" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">จำนวนรวมในคลัง</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{totalQuantity}</p>
            <p className="text-xs text-slate-500 mt-0.5">หน่วยนับรวมทั้งหมดในสโตร์</p>
          </div>
        </div>

        {/* KPI 3: Low Stock Warning */}
        <div id="kpi-low-stock" className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all ${lowStockItems.length > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'}`}>
          <div className={`p-3.5 rounded-xl ${lowStockItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ของเหลือน้อยกว่าเกณฑ์</p>
            <p className={`text-2xl font-bold mt-0.5 ${lowStockItems.length > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{lowStockItems.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">รายการที่ต้องรีบเติมพัสดุ</p>
          </div>
        </div>

        {/* KPI 4: Out Of Stock */}
        <div id="kpi-out-of-stock" className={`bg-white p-5 rounded-2xl border shadow-sm flex items-center gap-4 transition-all ${outOfStockItems.length > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'}`}>
          <div className={`p-3.5 rounded-xl ${outOfStockItems.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
            <XCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">ของหมดสต็อก</p>
            <p className={`text-2xl font-bold mt-0.5 ${outOfStockItems.length > 0 ? 'text-rose-700' : 'text-slate-900'}`}>{outOfStockItems.length}</p>
            <p className="text-xs text-slate-500 mt-0.5">สินค้าที่มีค่าในคลังเป็นศูนย์</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Low Stock Alert List & Recent Logs */}
      <div id="dashboard-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Section: Low Stock Items */}
        <div id="dashboard-low-stock-panel" className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-50/40 via-transparent to-transparent">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-500" />
              <h3 className="font-bold text-slate-900">แจ้งเตือนระดับคลังพัสดุวิกฤต</h3>
            </div>
            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
              ควรจัดหาเพิ่ม
            </span>
          </div>

          <div className="p-2">
            {[...lowStockItems, ...outOfStockItems].length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <p className="text-sm">🎉 พัสดุทุกรายการอยู่ในเกณฑ์ที่ปลอดภัย ไม่มีพัสดุติดขัด</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-slate-400 text-xs font-semibold border-b border-slate-100 uppercase tracking-wider">
                      <th className="p-3">รหัส / อุปกรณ์</th>
                      <th className="p-3 text-center">คงเหลือปัจจุบัน</th>
                      <th className="p-3 text-center">ขั้นต่ำแจ้งเตือน</th>
                      <th className="p-3 text-center">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...outOfStockItems, ...lowStockItems].map((item) => (
                      <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt={item.name} className="h-10 w-10 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0" />
                            ) : (
                              <div className="h-10 w-10 bg-slate-100 text-slate-400 flex items-center justify-center rounded-lg font-bold shrink-0 text-xs">
                                {item.code.substring(0, 3)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                              <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">{item.code}</span>
                                {item.building && (
                                  <span className="text-[10px] text-slate-400 font-semibold">📍 {item.building} ({item.location || '-'})</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.quantity === 0 ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-400 font-medium">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            id={`btn-replenish-${item.code}`}
                            onClick={() => onSelectProductForIntake(item.code)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            เติมสต็อก
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Recent Transactions */}
        <div id="dashboard-recent-logs" className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <RefreshCcw className="h-5 w-5 text-indigo-500" />
              <h3 className="font-bold text-slate-900">ประวัติเบิก-จ่าย ล่าสุด</h3>
            </div>
            <button
              id="btn-all-logs-shortcut"
              onClick={() => onNavigateToTab('logs')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer flex items-center gap-1"
            >
              ดูทั้งหมด
            </button>
          </div>

          <div className="p-5">
            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                ไม่มีประวัติการทำรายการในฐานข้อมูล
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex gap-3.5 items-start relative group">
                    <div className="mt-1 shrink-0">
                      {tx.type === 'INTAKE' ? (
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 shadow-sm">
                          <ArrowUpRight className="h-4.5 w-4.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200 shadow-sm">
                          <ArrowDownRight className="h-4.5 w-4.5" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-3 border-b border-slate-100 group-last:border-0 group-last:pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-semibold text-slate-800 text-sm truncate">{tx.productName}</p>
                        <span className={`text-xs font-bold ${tx.type === 'INTAKE' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {tx.type === 'INTAKE' ? '+' : '-'}{tx.quantity}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1 text-xs text-slate-400">
                        <span>โดย {tx.operator}</span>
                        <span>{tx.timestamp.substring(11, 16)} น.</span>
                      </div>
                      {tx.recipient && tx.recipient !== '-' && (
                        <p className="text-xs bg-slate-50 text-slate-600 px-2 py-1 rounded mt-1.5 inline-block">
                          <span className="font-medium text-slate-400">ผู้รับ:</span> {tx.recipient}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
