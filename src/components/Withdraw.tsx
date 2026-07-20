/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MinusCircle, UserCheck, AlertTriangle, MessageSquare, ArrowDownRight, Package, Filter } from 'lucide-react';
import { Product, User } from '../types';

interface WithdrawProps {
  products: Product[];
  categories: string[];
  currentUser: User;
  onAddTransaction: (data: {
    code: string;
    quantity: number;
    recipient: string;
    note?: string;
    operator?: string;
  }) => void;
  selectedProductCode: string;
  clearSelectedProductCode: () => void;
}

export default function Withdraw({ products, categories, currentUser, onAddTransaction, selectedProductCode, clearSelectedProductCode }: WithdrawProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [code, setCode] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number | ''>('');
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [operator, setOperator] = useState(currentUser.fullName);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync operator state when currentUser changes
  useEffect(() => {
    setOperator(currentUser.fullName);
  }, [currentUser]);

  // ตั้งค่าตามทางเลือกลัดจากหน้าอื่น
  useEffect(() => {
    if (selectedProductCode) {
      setCode(selectedProductCode);
      const found = products.find(p => p.code === selectedProductCode);
      if (found) {
        setSelectedProduct(found);
        setSelectedCategory(found.category);
      }
      clearSelectedProductCode();
    }
  }, [selectedProductCode]);

  // กรองรายการสินค้าเฉพาะในหมวดหมู่ที่เลือก
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory)
    : [];

  const handleProductChange = (productCode: string) => {
    setCode(productCode);
    setErrorMsg(null);
    const found = products.find(p => p.code === productCode);
    if (found) {
      setSelectedProduct(found);
    } else {
      setSelectedProduct(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!code) {
      setErrorMsg('กรุณาเลือกอุปกรณ์พัสดุที่ต้องการเบิก');
      return;
    }

    if (!selectedProduct) {
      setErrorMsg('ไม่พบข้อมูลพัสดุชิ้นนี้ในระบบ');
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      setErrorMsg('กรุณากรอกจำนวนเบิกใช้ให้ถูกต้อง');
      return;
    }

    if (Number(quantity) > selectedProduct.quantity) {
      setErrorMsg(`ไม่สามารถเบิกพัสดุเกินจำนวนที่มีอยู่ในคลังได้ (คลังคงเหลือ: ${selectedProduct.quantity} ${selectedProduct.unit})`);
      return;
    }

    if (!recipient.trim()) {
      setErrorMsg('กรุณาระบุชื่อผู้รับพัสดุ / แผนก');
      return;
    }

    // บันทึกเบิกใช้
    onAddTransaction({
      code: selectedProduct.code,
      quantity: Number(quantity),
      recipient: recipient.trim(),
      note: note.trim() || undefined,
      operator: operator.trim() || currentUser.fullName
    });

    setSuccessMsg(`เบิกจ่ายสำเร็จ: จ่ายอุปกรณ์ "${selectedProduct.name}" จำนวน ${quantity} ${selectedProduct.unit} ให้แก่ "${recipient}" เรียบร้อยแล้ว`);
    
    // ล้างค่าฟอร์ม
    setCode('');
    setSelectedProduct(null);
    setQuantity('');
    setRecipient('');
    setNote('');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 5000);
  };

  const stockAfter = selectedProduct && quantity !== '' ? selectedProduct.quantity - Number(quantity) : null;

  return (
    <div id="withdraw-tab-content" className="max-w-3xl mx-auto space-y-6">
      {/* Alert Messages */}
      {errorMsg && (
        <div id="withdraw-error-banner" className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <p className="text-sm font-semibold">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div id="withdraw-success-banner" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-start gap-3">
          <UserCheck className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
          <p className="text-sm font-semibold">{successMsg}</p>
        </div>
      )}

      {/* Main Withdraw Panel */}
      <div id="withdraw-form-panel" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-amber-600 to-orange-700 p-6 text-white">
          <h2 className="text-xl font-bold">เบิกจ่ายอุปกรณ์พัสดุ (Stock Withdrawal)</h2>
          <p className="text-xs text-amber-100 mt-1">ทำรายการตัดสต็อกพัสดุหอพัก พร้อมบันทึกรายละเอียดผู้รับสินค้าและวัตถุประสงค์</p>
        </div>

        <form id="withdraw-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Select Category */}
          <div>
            <label htmlFor="withdraw-category-select" className="block text-sm font-semibold text-slate-700 mb-1.5">เลือกหมวดหมู่อุปกรณ์</label>
            <div className="relative">
              <select
                id="withdraw-category-select"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  // ล้างรายการสินค้าที่เคยเลือกไว้ ถ้าสินค้านั้นไม่ได้อยู่ในหมวดหมู่ใหม่ที่เลือก
                  setCode('');
                  setSelectedProduct(null);
                }}
                className="block w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer font-medium"
              >
                <option value="">-- กรุณาเลือกหมวดหมู่อุปกรณ์ --</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <Filter className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Select Product */}
          <div>
            <label htmlFor="withdraw-product-select" className="block text-sm font-semibold text-slate-700 mb-1.5">เลือกพัสดุที่ต้องการเบิกจ่าย</label>
            <div className="relative">
              <select
                id="withdraw-product-select"
                required
                disabled={!selectedCategory}
                value={code}
                onChange={(e) => handleProductChange(e.target.value)}
                className={`block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer ${!selectedCategory ? 'opacity-65 cursor-not-allowed bg-slate-100' : 'font-medium'}`}
              >
                {!selectedCategory ? (
                  <option value="">-- กรุณาเลือกหมวดหมู่อุปกรณ์ด้านบนก่อน --</option>
                ) : (
                  <>
                    <option value="">-- กรุณาเลือกสินค้าอุปกรณ์ --</option>
                    {filteredProducts.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.code} - {item.name} (คงเหลือ: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </>
                )}
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Quantity & Stock Visual Display */}
          {selectedProduct && (
            <div id="withdraw-visual-calc" className="p-5 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center items-center">
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase">คงเหลือในสโตร์</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{selectedProduct.quantity} {selectedProduct.unit}</p>
              </div>
              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-auto"></div>
              <div>
                <p className="text-xs text-rose-500 font-semibold uppercase">จำนวนที่เบิกใช้</p>
                <p className="text-lg font-bold text-rose-600 mt-0.5">-{quantity || 0} {selectedProduct.unit}</p>
              </div>
              <div className="hidden sm:block h-8 w-[1px] bg-slate-200 mx-auto"></div>
              <div>
                <p className="text-xs text-indigo-500 font-semibold uppercase">คลังคงเหลือสุทธิ</p>
                <p className={`text-xl font-black mt-0.5 ${stockAfter !== null && stockAfter <= selectedProduct.minStock ? 'text-amber-600' : 'text-indigo-600'}`}>
                  {stockAfter !== null ? `${stockAfter} ${selectedProduct.unit}` : `--`}
                </p>
                {stockAfter !== null && stockAfter <= selectedProduct.minStock && (
                  <span className="text-[9px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200 mt-1 inline-block">
                    ⚠️ ต่ำกว่าจุดเตือนเมื่อตัดยอดแล้ว
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quantity Input */}
          <div>
            <label htmlFor="withdraw-quantity-input" className="block text-sm font-semibold text-slate-700 mb-1.5">จำนวนเบิกจ่าย</label>
            <input
              id="withdraw-quantity-input"
              type="number"
              required
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
              placeholder="ระบุตัวเลขจำนวนที่เบิก..."
              className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
            />
          </div>

          {/* Recipient Details */}
          <div>
            <label htmlFor="withdraw-recipient-input" className="block text-sm font-semibold text-slate-700 mb-1.5">ระบุชื่อผู้เบิกพัสดุอุปกรณ์ / แผนก / หน่วยงานย่อย</label>
            <div className="relative">
              <input
                id="withdraw-recipient-input"
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="ระบุชื่อผู้เบิกพัสดุ เช่น นายสุรชัย ช่างประปา, แม่บ้านประยงค์..."
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Operator Details */}
          <div>
            <label htmlFor="withdraw-operator-input" className="block text-sm font-semibold text-slate-700 mb-1.5">ผู้ดำเนินการ / ผู้ทำรายการเบิก</label>
            <div className="relative">
              {currentUser.role === 'Admin' ? (
                <input
                  id="withdraw-operator-input"
                  type="text"
                  required
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="ระบุชื่อผู้ดำเนินการเบิกจ่าย..."
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
                />
              ) : (
                <input
                  id="withdraw-operator-input"
                  type="text"
                  disabled
                  value={currentUser.fullName}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-400 text-sm font-semibold cursor-not-allowed"
                />
              )}
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserCheck className="h-5 w-5" />
              </div>
            </div>
            {currentUser.role === 'Admin' ? (
              <p className="text-[11px] text-amber-600 mt-1">💡 เข้าสู่ระบบด้วยสิทธิ์ Admin: สามารถแก้ไขระบุชื่อผู้ดำเนินการได้เอง</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">ล็อกตามชื่อผู้ใช้งานที่เข้าสู่ระบบ</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="withdraw-note-input" className="block text-sm font-semibold text-slate-700 mb-1.5">วัตถุประสงค์การใช้งาน / รายละเอียดการเบิก</label>
            <div className="relative">
              <textarea
                id="withdraw-note-input"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ระบุรายละเอียดเพิ่มเติม เช่น ซ่อมไฟตึกชายชั้น 3, เปลี่ยนห้องเช่า 504..."
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
              ></textarea>
              <div className="absolute top-3 left-3.5 text-slate-400">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Logged-in Staff footer */}
          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 flex justify-between items-center border border-slate-100">
            <span className="flex items-center gap-1.5 font-medium"><ArrowDownRight className="h-4 w-4 text-slate-400" /> วันที่เบิกจ่าย: {new Date().toLocaleDateString('th-TH')}</span>
            <span className="font-semibold">ผู้ดำเนินการ: {operator} ({currentUser.role})</span>
          </div>

          {/* Submit button */}
          <button
            id="btn-submit-withdraw"
            type="submit"
            className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold shadow-md shadow-amber-100 hover:shadow-lg hover:shadow-amber-200 transition-all cursor-pointer active:scale-98"
          >
            บันทึกประวัติการเบิกจ่าย
          </button>
        </form>
      </div>
    </div>
  );
}
