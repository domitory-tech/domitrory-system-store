/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, ArrowUpRight, ArrowDownRight, Filter, FileSpreadsheet, Calendar } from 'lucide-react';
import { Transaction } from '../types';

interface LogsProps {
  transactions: Transaction[];
  categories: string[];
}

export default function Logs({ transactions, categories }: LogsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'ALL' | 'INTAKE' | 'WITHDRAW'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // กรองรายการประวัติ
  const filteredLogs = transactions.filter(log => {
    const matchesSearch = log.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          log.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (log.recipient && log.recipient.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || log.type === selectedType;
    const matchesCategory = selectedCategory === 'ALL' || log.category === selectedCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div id="logs-tab-content" className="space-y-6">
      {/* Filters Board */}
      <div id="logs-filters-panel" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ประวัติการเคลื่อนไหวพัสดุ (Transaction Logs)</h2>
            <p className="text-sm text-slate-500 mt-1">สมุดบันทึกรายการนำเข้า-เบิกจ่ายทั้งหมดแบบละเอียด ตรวจสอบย้อนหลังได้ทันที</p>
          </div>
          {/* Export to Sheets description */}
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
            <FileSpreadsheet className="h-4 w-4" /> ประสานงานฐานข้อมูล Google Sheets เสมอ
          </span>
        </div>

        {/* Filters and Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search bar */}
          <div className="md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              id="logs-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อพัสดุ, รหัสสินค้า, ผู้ทำรายการ หรือผู้รับ..."
              className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Type filter */}
          <div className="md:col-span-3">
            <select
              id="logs-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
            >
              <option value="ALL">รายการทุกประเภท</option>
              <option value="INTAKE">🟢 รายการนำเข้า (Intake)</option>
              <option value="WITHDRAW">🟠 รายการเบิกจ่าย (Withdraw)</option>
            </select>
          </div>

          {/* Category filter */}
          <div className="md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="h-5 w-5" />
            </div>
            <select
              id="logs-category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="ALL">ทุกหมวดหมู่อุปกรณ์</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div id="logs-table-panel" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-4" />
            <p className="text-base font-semibold text-slate-600">ไม่พบข้อมูลประวัติทำรายการ</p>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนการตั้งค่าการกรองของคุณ เพื่อค้นหาข้อมูลอื่นๆ</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">ID รายการ</th>
                  <th className="p-4">รหัส / อุปกรณ์</th>
                  <th className="p-4">ประเภท</th>
                  <th className="p-4 text-center">จำนวนทำรายการ</th>
                  <th className="p-4 text-center">ผลลัพธ์ยอดคลัง</th>
                  <th className="p-4">ผู้ทำรายการ</th>
                  <th className="p-4">ผู้รับพัสดุ</th>
                  <th className="p-4">วัน-เวลาบันทึก</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Log ID */}
                    <td className="p-4 pl-6 text-slate-400 font-mono text-[11px]">
                      {log.id.split('-').slice(1).join('-') || log.id}
                    </td>

                    {/* Product Code & Name */}
                    <td className="p-4">
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-1">{log.productName}</p>
                        <span className="text-[10px] bg-slate-50 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded">{log.code}</span>
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="p-4">
                      {log.type === 'INTAKE' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-100">
                          <ArrowUpRight className="h-3.5 w-3.5" /> นำเข้า
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-100">
                          <ArrowDownRight className="h-3.5 w-3.5" /> เบิกจ่าย
                        </span>
                      )}
                    </td>

                    {/* Transaction Quantity */}
                    <td className="p-4 text-center font-bold text-sm text-slate-800">
                      {log.type === 'INTAKE' ? '+' : '-'}{log.quantity}
                    </td>

                    {/* Stock Transition */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs">
                        <span className="text-slate-400 font-medium">{log.prevQuantity}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-slate-800 font-bold">{log.newQuantity}</span>
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="p-4 text-slate-600 font-medium text-xs">
                      {log.operator}
                    </td>

                    {/* Recipient */}
                    <td className="p-4">
                      {log.recipient && log.recipient !== '-' ? (
                        <div className="space-y-0.5">
                          <p className="text-xs font-semibold text-slate-700">{log.recipient}</p>
                          {log.note && <p className="text-[10px] text-slate-400 leading-tight italic line-clamp-1" title={log.note}>{log.note}</p>}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">-</span>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="p-4 text-slate-400 text-xs font-medium whitespace-nowrap">
                      {log.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
