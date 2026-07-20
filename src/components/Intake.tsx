/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Download, UploadCloud, Search, Check, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { Product, User } from '../types';

interface IntakeProps {
  products: Product[];
  categories: string[];
  currentUser: User;
  onAddTransaction: (data: {
    code: string;
    name: string;
    category: string;
    quantity: number;
    minStock: number;
    unit: string;
    imageBase64?: string;
    imageName?: string;
    note?: string;
    building?: string;
    location?: string;
  }) => void;
  selectedProductCode: string;
  clearSelectedProductCode: () => void;
}

export default function Intake({ products, categories, currentUser, onAddTransaction, selectedProductCode, clearSelectedProductCode }: IntakeProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>(5);
  const [unit, setUnit] = useState('ชิ้น');
  const [note, setNote] = useState('');
  const [building, setBuilding] = useState('');
  const [location, setLocation] = useState('');
  
  // Image states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [isExisting, setIsExisting] = useState(false);
  const [existingProduct, setExistingProduct] = useState<Product | null>(null);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ตั้งรหัสตามช็อตคัทจากหน้าอื่น (หากถูกเลือกมา)
  useEffect(() => {
    if (selectedProductCode) {
      setCode(selectedProductCode);
      handleProductLookup(selectedProductCode);
      clearSelectedProductCode();
    }
  }, [selectedProductCode]);

  // ค้นหาสินค้าอัตโนมัติเมื่อรหัสสินค้าเปลี่ยน
  const handleCodeChange = (val: string) => {
    setCode(val);
    handleProductLookup(val);
  };

  const handleProductLookup = (productCode: string) => {
    const cleanedCode = productCode.trim().toUpperCase();
    const found = products.find(p => p.code.toUpperCase() === cleanedCode);

    if (found) {
      setIsExisting(true);
      setExistingProduct(found);
      setName(found.name);
      setCategory(found.category);
      setMinStock(found.minStock);
      setUnit(found.unit);
      setBuilding(found.building || '');
      setLocation(found.location || '');
      setImagePreview(found.imageUrl || null);
    } else {
      setIsExisting(false);
      setExistingProduct(null);
      // หากไม่ใช่สินค้าเดิม ไม่ควรลบฟอร์มถ้าผู้ใช้เริ่มกรอกแล้ว แต่ตอนสลับรหัสให้ล้างค่าที่ค้าง
      setName('');
      setCategory(categories[0] || '');
      setMinStock(5);
      setUnit('ชิ้น');
      setBuilding('');
      setLocation('');
      setImagePreview(null);
      setImageFile(null);
      setImageBase64(null);
    }
  };

  // จัดการอัปโหลดไฟล์ภาพ
  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกเฉพาะไฟล์รูปภาพเท่านั้น');
      return;
    }
    setImageFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    if (!quantity || Number(quantity) <= 0) {
      setAlertMsg({ type: 'error', text: 'กรุณากรอกจำนวนที่ต้องการนำเข้าให้ถูกต้อง' });
      return;
    }

    onAddTransaction({
      code: code.trim().toUpperCase(),
      name: name.trim(),
      category: category,
      quantity: Number(quantity),
      minStock: Number(minStock || 0),
      unit: unit.trim(),
      imageBase64: imageBase64 || undefined,
      imageName: imageFile?.name || undefined,
      note: note.trim() || undefined,
      building: building.trim() || undefined,
      location: location.trim() || undefined
    });

    setAlertMsg({
      type: 'success',
      text: `นำเข้าพัสดุสำเร็จ: เพิ่มรายการ ${name || 'อุปกรณ์เดิม'} จำนวน ${quantity} ${unit} เรียบร้อยแล้ว`
    });

    // ล้างค่าฟอร์ม
    setCode('');
    setName('');
    setCategory(categories[0] || '');
    setQuantity('');
    setMinStock(5);
    setUnit('ชิ้น');
    setBuilding('');
    setLocation('');
    setNote('');
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setIsExisting(false);
    setExistingProduct(null);

    // หายไปใน 5 วินาที
    setTimeout(() => {
      setAlertMsg(null);
    }, 5000);
  };

  const currentTotal = existingProduct ? existingProduct.quantity : 0;
  const newTotal = quantity !== '' ? currentTotal + Number(quantity) : currentTotal;

  return (
    <div id="intake-tab-content" className="max-w-3xl mx-auto space-y-6">
      {/* Alert Alert Banner */}
      {alertMsg && (
        <div id="intake-alert-banner" className={`p-4 rounded-2xl flex items-start gap-3 border ${alertMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{alertMsg.text}</p>
        </div>
      )}

      {/* Main Intake Form Frame */}
      <div id="intake-form-frame" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
          <h2 className="text-xl font-bold">นำเข้าอุปกรณ์พัสดุ (Stock Intake)</h2>
          <p className="text-xs text-emerald-100 mt-1">กรอกรหัสพัสดุเพื่อเช็กสต็อกเดิม หรือเพิ่มพัสดุรายการใหม่เข้าไปในคลังสโตร์หอพัก</p>
        </div>

        <form id="intake-form" onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grid Panel 1: Code and Quantity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Code */}
            <div>
              <label htmlFor="intake-product-code" className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสอุปกรณ์ / พัสดุ</label>
              <div className="relative">
                <input
                  id="intake-product-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="เช่น ST-001 (กดพิมพ์เพื่อค้นหา)"
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono font-bold uppercase placeholder:font-sans placeholder:font-normal text-sm"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-5 w-5" />
                </div>
              </div>
              {isExisting && existingProduct && (
                <span className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> ตรวจพบสินค้าในคลัง (ระบบจะคำนวณยอดทบยอดเดิม)
                </span>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label htmlFor="intake-quantity" className="block text-sm font-semibold text-slate-700 mb-1.5">จำนวนที่นำเข้า</label>
              <input
                id="intake-quantity"
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value !== '' ? Number(e.target.value) : '')}
                placeholder="กรอกจำนวนตัวเลข..."
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
              />
            </div>
          </div>

          {/* Dynamic Calculation Board */}
          <div id="stock-calc-board" className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row justify-around items-center gap-4 text-center">
            <div className="space-y-0.5">
              <p className="text-xs text-slate-400 font-medium uppercase">คงเหลือเดิมในคลัง</p>
              <p className="text-lg font-bold text-slate-700">{currentTotal} {unit}</p>
            </div>
            <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
            <div className="space-y-0.5">
              <p className="text-xs text-indigo-500 font-semibold uppercase">จำนวนที่กำลังนำเข้า</p>
              <p className="text-lg font-bold text-indigo-600">+{quantity || 0} {unit}</p>
            </div>
            <div className="hidden sm:block h-6 w-[1px] bg-slate-200"></div>
            <div className="space-y-0.5">
              <p className="text-xs text-emerald-600 font-bold uppercase">คาดการณ์คลังคงใหม่</p>
              <p className="text-xl font-black text-emerald-600">{newTotal} {unit}</p>
            </div>
          </div>

          {/* Expandable form section: For new products or editable items */}
          <div id="dynamic-fields" className="space-y-5 border-t border-slate-100 pt-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block"></span>
              ข้อมูลจำเพาะอุปกรณ์พัสดุ {isExisting ? '(ดึงข้อมูลอัตโนมัติ)' : '(สินค้าใหม่)'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Product Name */}
              <div>
                <label htmlFor="intake-product-name" className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อพัสดุ / อุปกรณ์</label>
                <input
                  id="intake-product-name"
                  type="text"
                  required
                  disabled={isExisting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="กรอกชื่ออุปกรณ์..."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-75 disabled:text-slate-500"
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="intake-category" className="block text-sm font-semibold text-slate-700 mb-1.5">หมวดหมู่อุปกรณ์</label>
                <select
                  id="intake-category"
                  required
                  disabled={isExisting}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-75 disabled:text-slate-500 cursor-pointer"
                >
                  <option value="" disabled>เลือกหมวดหมู่...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Alert Threshold (Min Stock) */}
              <div>
                <label htmlFor="intake-min-stock" className="block text-sm font-semibold text-slate-700 mb-1.5">จุดแจ้งเตือนพัสดุขั้นต่ำ</label>
                <input
                  id="intake-min-stock"
                  type="number"
                  required
                  disabled={isExisting}
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value !== '' ? Number(e.target.value) : '')}
                  placeholder="เตือนเมื่อจำนวนเท่ากับหรือน้อยกว่า..."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-75 disabled:text-slate-500"
                />
              </div>

              {/* Unit Type */}
              <div>
                <label htmlFor="intake-unit" className="block text-sm font-semibold text-slate-700 mb-1.5">หน่วยนับ</label>
                <input
                  id="intake-unit"
                  type="text"
                  required
                  disabled={isExisting}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="เช่น ชิ้น, ตัว, หลอด, รีม..."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-75 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Building */}
              <div>
                <label htmlFor="intake-building" className="block text-sm font-semibold text-slate-700 mb-1.5">อาคารที่เก็บอุปกรณ์</label>
                <input
                  id="intake-building"
                  type="text"
                  required
                  disabled={isExisting}
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="เช่น อาคารอำนวยการ, อาคารพัสดุกลาง, หอพักหญิง 1..."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-75 disabled:text-slate-500"
                />
              </div>

              {/* Location / Spot */}
              <div>
                <label htmlFor="intake-location" className="block text-sm font-semibold text-slate-700 mb-1.5">จุดเก็บอุปกรณ์ (เช่น A1-A20)</label>
                <input
                  id="intake-location"
                  type="text"
                  required
                  disabled={isExisting}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="เช่น A05, B12, ชั้น 1 ตู้ซ้ายมือ..."
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm disabled:opacity-75 disabled:text-slate-500"
                />
              </div>
            </div>

            {/* Image Upload Area: Supporting Drag & Drop & Click */}
            <div>
              <p className="block text-sm font-semibold text-slate-700 mb-1.5">อัปโหลดรูปภาพสินค้า (จัดเก็บลง Google Drive เฉพาะเจาะจงตามโฟลเดอร์หมวดหมู่)</p>
              
              <div
                id="image-dropzone"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={isExisting ? undefined : triggerFileInput}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${isExisting ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' : isDragOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100/50'}`}
              >
                <input
                  id="input-file-image"
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && e.target.files[0] && handleFileChange(e.target.files[0])}
                  accept="image/*"
                  disabled={isExisting}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative inline-block group">
                    <img
                      src={imagePreview}
                      alt="รูปพรีวิวสินค้า"
                      referrerPolicy="no-referrer"
                      className="max-h-40 rounded-xl mx-auto border border-slate-200 shadow-sm"
                    />
                    {!isExisting && (
                      <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-semibold">เปลี่ยนรูปภาพ</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <UploadCloud className="h-10 w-10 text-slate-400 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">ลากและวางรูปภาพตรงนี้ หรือ <span className="text-indigo-600 underline">คลิกเพื่อเลือกไฟล์</span></p>
                    <p className="text-xs text-slate-400">รองรับเฉพาะภาพ .jpg, .png, .jpeg (ระบบจะบันทึกเข้า Google Drive อัตโนมัติ)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes/Remarks */}
            <div>
              <label htmlFor="intake-note" className="block text-sm font-semibold text-slate-700 mb-1.5">หมายเหตุการนำเข้า</label>
              <textarea
                id="intake-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="กรอกรายละเอียดเพิ่มเติม เช่น บิลเลขที่จัดซื้อ หรือ แหล่งที่มา..."
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm resize-none"
              ></textarea>
            </div>
          </div>

          {/* Form Operator Info Box */}
          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 flex justify-between items-center border border-slate-100">
            <span className="flex items-center gap-1.5 font-medium"><FileText className="h-4 w-4 text-slate-400" /> วันที่นำเข้า: {new Date().toLocaleDateString('th-TH')}</span>
            <span className="font-semibold">ผู้ทำรายการ: {currentUser.fullName} ({currentUser.role})</span>
          </div>

          {/* Submit Button */}
          <button
            id="btn-submit-intake"
            type="submit"
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-200 transition-all cursor-pointer active:scale-98"
          >
            บันทึกการนำเข้าพัสดุ
          </button>
        </form>
      </div>
    </div>
  );
}
