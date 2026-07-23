/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, AlertCircle, ShoppingBag, Plus, Minus, Grid, List, Edit2, Trash2, Folder, ExternalLink } from 'lucide-react';
import { Product, User, Category } from '../types';

interface InventoryProps {
  products: Product[];
  categories: string[];
  categoriesData?: Category[];
  currentUser: User;
  onSelectProductForIntake: (code: string) => void;
  onSelectProductForWithdraw: (code: string) => void;
  onNavigateToTab: (tab: string) => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (code: string) => void;
}

export default function Inventory({ 
  products, 
  categories, 
  categoriesData = [],
  currentUser,
  onSelectProductForIntake, 
  onSelectProductForWithdraw, 
  onNavigateToTab,
  onEditProduct,
  onDeleteProduct
}: InventoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('TABLE');

  // Admin Edit Product states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editProductCode, setEditProductCode] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editProductCategory, setEditProductCategory] = useState('');
  const [editProductUnit, setEditProductUnit] = useState('');
  const [editProductMinStock, setEditProductMinStock] = useState<number>(5);
  const [editProductBuilding, setEditProductBuilding] = useState('');
  const [editProductLocation, setEditProductLocation] = useState('');
  const [editProductImageUrl, setEditProductImageUrl] = useState('');

  // Admin Delete Confirmation states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  const convertGoogleDriveLink = (url: string): string => {
    if (!url) return '';
    // Match file ID from various formats of Google Drive links
    // e.g. https://drive.google.com/file/d/1234567890abcdef/view?usp=sharing
    // e.g. https://drive.google.com/open?id=1234567890abcdef
    // e.g. https://docs.google.com/uc?id=1234567890abcdef
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
    }
    return url;
  };

  const handleOpenEditModal = (product: Product) => {
    setEditProductCode(product.code);
    setEditProductName(product.name);
    setEditProductCategory(product.category);
    setEditProductUnit(product.unit);
    setEditProductMinStock(product.minStock);
    setEditProductBuilding(product.building || '');
    setEditProductLocation(product.location || '');
    setEditProductImageUrl(product.imageUrl || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProductName.trim() || !editProductUnit.trim()) {
      return;
    }
    const updatedProduct: Product = {
      code: editProductCode,
      name: editProductName.trim(),
      category: editProductCategory,
      unit: editProductUnit.trim(),
      minStock: editProductMinStock,
      building: editProductBuilding.trim() || undefined,
      location: editProductLocation.trim() || undefined,
      quantity: products.find(p => p.code === editProductCode)?.quantity || 0,
      imageUrl: editProductImageUrl.trim() ? convertGoogleDriveLink(editProductImageUrl.trim()) : undefined,
      updatedAt: new Date().toISOString()
    };
    onEditProduct(updatedProduct);
    setIsEditModalOpen(false);
  };

  const handleOpenDeleteConfirm = (product: Product) => {
    setDeleteProduct(product);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteProduct) {
      onDeleteProduct(deleteProduct.code);
      setIsDeleteConfirmOpen(false);
      setDeleteProduct(null);
    }
  };

  // กรองรายการสินค้า
  const filteredProducts = products.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.building && item.building.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    
    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = item.quantity <= item.minStock && item.quantity > 0;
    } else if (stockFilter === 'OUT') {
      matchesStock = item.quantity === 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  return (
    <div id="inventory-tab-content" className="space-y-6">
      {/* Top Controls Board */}
      <div id="inventory-control-board" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">ทะเบียนพัสดุและสต็อกคงเหลือ</h2>
            <p className="text-sm text-slate-500 mt-1">สืบค้นรายการอุปกรณ์ทั้งหมด ตรวจสอบระดับสต็อก และจัดการเบิกจ่ายด่วน</p>
          </div>
          {/* Toggle View Mode */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === 'TABLE' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
              title="แสดงผลแบบตาราง"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-2 rounded-lg cursor-pointer transition-all ${viewMode === 'GRID' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
              title="แสดงผลแบบกล่องการ์ด"
            >
              <Grid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 md:col-span-5 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              id="inventory-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหารหัสอุปกรณ์ หรือ ชื่อพัสดุ..."
              className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-1 md:col-span-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="h-5 w-5" />
            </div>
            <select
              id="inventory-category-select"
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

          {/* Stock Level Filter */}
          <div className="sm:col-span-1 md:col-span-3">
            <select
              id="inventory-stock-filter-select"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer"
            >
              <option value="ALL">สถานะทั้งหมด</option>
              <option value="LOW">⚠️ ของเหลือน้อยกว่าเกณฑ์</option>
              <option value="OUT">❌ สินค้าหมด (สต็อกเป็น 0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      {filteredProducts.length === 0 ? (
        <div id="inventory-empty-state" className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400 shadow-sm">
          <ShoppingBag className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <p className="text-base font-semibold text-slate-600">ไม่พบรายการพัสดุพึ่งค้นหา</p>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนเงื่อนไขการค้นหา หรือเพิ่มรายการอุปกรณ์ใหม่เข้าสู่คลัง</p>
          <button
            onClick={() => onNavigateToTab('intake')}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
          >
            <Plus className="h-4 w-4" /> นำเข้ารายการใหม่
          </button>
        </div>
      ) : viewMode === 'TABLE' ? (
        /* TABLE VIEW MODE */
        <div id="inventory-table-container" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-slate-500 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-4 pl-6">รูปภาพ / รหัส / รายการพัสดุ</th>
                  <th className="p-4">หมวดหมู่</th>
                  <th className="p-4">อาคาร / จุดเก็บอุปกรณ์</th>
                  <th className="p-4 text-center">คงเหลือในคลัง</th>
                  <th className="p-4 text-center">จุดแจ้งเตือนต่ำสุด</th>
                  <th className="p-4 text-center">อัปเดตล่าสุด</th>
                  <th className="p-4 pr-6 text-center">จัดสต็อกคลัง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((item) => {
                  const isLow = item.quantity <= item.minStock && item.quantity > 0;
                  const isOut = item.quantity === 0;

                  return (
                    <tr key={item.code} className="hover:bg-slate-50/50 transition-colors">
                      {/* Product Name and Image */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-4">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              className="h-12 w-12 object-cover rounded-xl bg-slate-100 border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-12 bg-indigo-50 border border-indigo-100 text-indigo-500 flex items-center justify-center rounded-xl font-bold shrink-0 text-sm">
                              {item.code}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full font-mono">{item.code}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 text-slate-600 text-xs font-medium">
                        {item.category}
                      </td>

                      {/* Storage Building and Spot */}
                      <td className="p-4 text-xs">
                        <div className="font-semibold text-slate-700">{item.building || 'ไม่ได้ระบุ'}</div>
                        <div className="text-slate-400 font-mono mt-0.5">จุดเก็บ: {item.location || 'ไม่ได้ระบุ'}</div>
                      </td>

                      {/* Current Stock */}
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${isOut ? 'bg-rose-50 text-rose-700 border border-rose-100' : isLow ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                            {item.quantity} {item.unit}
                          </span>
                          {isOut && (
                            <span className="text-[10px] text-rose-500 font-semibold mt-1 flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" /> สินค้าหมด
                            </span>
                          )}
                          {isLow && (
                            <span className="text-[10px] text-amber-500 font-semibold mt-1 flex items-center gap-0.5">
                              <AlertTriangle className="h-3 w-3" /> ใกล้หมดสต็อก
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Alert Threshold */}
                      <td className="p-4 text-center text-slate-400 font-semibold text-xs">
                        {item.minStock} {item.unit}
                      </td>

                      {/* Updated Date */}
                      <td className="p-4 text-center text-slate-400 text-xs">
                        {item.updatedAt.substring(0, 16)} น.
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 pr-6 text-center">
                        <div className="inline-flex gap-1.5">
                          <button
                            id={`btn-intake-act-${item.code}`}
                            onClick={() => onSelectProductForIntake(item.code)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-600 rounded-xl cursor-pointer transition-colors"
                            title="นำเข้าพัสดุเพิ่ม"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            id={`btn-withdraw-act-${item.code}`}
                            onClick={() => onSelectProductForWithdraw(item.code)}
                            className="p-2 bg-amber-50 hover:bg-amber-600 hover:text-white text-amber-600 rounded-xl cursor-pointer transition-colors"
                            title="เบิกจ่ายพัสดุ"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          {currentUser.role === 'Admin' && (
                            <>
                              <button
                                id={`btn-edit-act-${item.code}`}
                                onClick={() => handleOpenEditModal(item)}
                                className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl cursor-pointer transition-colors"
                                title="แก้ไขชื่อ/ข้อมูลพัสดุ"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                id={`btn-delete-act-${item.code}`}
                                onClick={() => handleOpenDeleteConfirm(item)}
                                className="p-2 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 rounded-xl cursor-pointer transition-colors"
                                title="ลบข้อมูลพัสดุออกจากระบบ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW MODE */
        <div id="inventory-grid-container" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
          {filteredProducts.map((item) => {
            const isLow = item.quantity <= item.minStock && item.quantity > 0;
            const isOut = item.quantity === 0;

            return (
              <div key={item.code} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col hover:shadow-md transition-shadow">
                {/* Image Section */}
                <div className="relative aspect-video bg-slate-50 overflow-hidden border-b border-slate-100 shrink-0">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-50/50 text-indigo-400 font-bold text-lg">
                      {item.code}
                    </div>
                  )}
                  {/* Category Badge */}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-slate-900/75 backdrop-blur-md text-white rounded text-[10px] font-semibold">
                    {item.category}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-indigo-600 font-bold">{item.code}</span>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 h-10 leading-tight">{item.name}</h3>
                    
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-slate-400 font-medium">คงเหลือคลัง:</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${isOut ? 'bg-rose-50 text-rose-700' : isLow ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <p>ขั้นต่ำเกณฑ์เตือน:</p>
                      <p className="font-semibold">{item.minStock} {item.unit}</p>
                    </div>

                    <div className="flex justify-between items-start text-[11px] text-slate-500 pt-1.5 border-t border-dashed border-slate-100">
                      <p className="shrink-0">สถานที่เก็บ:</p>
                      <p className="font-semibold text-right text-slate-700 line-clamp-1">
                        {item.building ? `${item.building} (${item.location || '-'})` : 'ไม่ได้ระบุ'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-slate-100">
                    <div className="flex gap-2">
                      <button
                        id={`grid-btn-intake-${item.code}`}
                        onClick={() => onSelectProductForIntake(item.code)}
                        className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center"
                      >
                        นำเข้า
                      </button>
                      <button
                        id={`grid-btn-withdraw-${item.code}`}
                        onClick={() => onSelectProductForWithdraw(item.code)}
                        className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-600 text-amber-600 hover:text-white rounded-lg text-xs font-bold cursor-pointer transition-colors text-center"
                      >
                        เบิกจ่าย
                      </button>
                    </div>
                    {currentUser.role === 'Admin' && (
                      <div className="flex gap-2">
                        <button
                          id={`grid-btn-edit-${item.code}`}
                          onClick={() => handleOpenEditModal(item)}
                          className="flex-1 py-1 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors text-center flex items-center justify-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" /> แก้ไขข้อมูล
                        </button>
                        <button
                          id={`grid-btn-delete-${item.code}`}
                          onClick={() => handleOpenDeleteConfirm(item)}
                          className="flex-1 py-1 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-lg text-[10px] font-bold cursor-pointer transition-colors text-center flex items-center justify-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> ลบรายการ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADMIN EDIT PRODUCT MODAL */}
      {isEditModalOpen && (
        <div id="admin-edit-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-250">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Edit2 className="h-5 w-5" /> แก้ไขข้อมูลพัสดุ
              </h3>
              <p className="text-xs text-blue-100 mt-1">รหัสพัสดุอุปกรณ์: <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">{editProductCode}</span></p>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label htmlFor="edit-product-name" className="block text-xs font-semibold text-slate-600 mb-1">ชื่อรายการพัสดุอุปกรณ์</label>
                <input
                  id="edit-product-name"
                  type="text"
                  required
                  value={editProductName}
                  onChange={(e) => setEditProductName(e.target.value)}
                  placeholder="เช่น กระดาษ A4 80 แกรม, หลอดไฟ LED..."
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
                />
              </div>

              {/* Category & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-product-category" className="block text-xs font-semibold text-slate-600 mb-1">หมวดหมู่</label>
                  <select
                    id="edit-product-category"
                    value={editProductCategory}
                    onChange={(e) => setEditProductCategory(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-product-unit" className="block text-xs font-semibold text-slate-600 mb-1">หน่วยนับ</label>
                  <input
                    id="edit-product-unit"
                    type="text"
                    required
                    value={editProductUnit}
                    onChange={(e) => setEditProductUnit(e.target.value)}
                    placeholder="เช่น ชิ้น, รีม, กล่อง, ม้วน..."
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm"
                  />
                </div>
              </div>

              {/* Category Google Drive Folder Link Banner */}
              {(() => {
                const selectedCatObj = categoriesData.find(c => c.name === editProductCategory);
                if (selectedCatObj && selectedCatObj.folderId) {
                  return (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                        <Folder className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>Google Drive Folder: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-800 font-bold">{selectedCatObj.folderId}</code></span>
                      </div>
                      <a
                        href={`https://drive.google.com/drive/folders/${selectedCatObj.folderId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shrink-0 text-[10px]"
                      >
                        <span>เปิด Drive</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Min Stock */}
              <div>
                <label htmlFor="edit-product-minstock" className="block text-xs font-semibold text-slate-600 mb-1">เกณฑ์แจ้งเตือนสต็อกต่ำสุด</label>
                <input
                  id="edit-product-minstock"
                  type="number"
                  required
                  min="0"
                  value={editProductMinStock}
                  onChange={(e) => setEditProductMinStock(Number(e.target.value))}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-semibold"
                />
              </div>

              {/* Building & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-product-building" className="block text-xs font-semibold text-slate-600 mb-1">อาคารที่เก็บ</label>
                  <input
                    id="edit-product-building"
                    type="text"
                    value={editProductBuilding}
                    onChange={(e) => setEditProductBuilding(e.target.value)}
                    placeholder="เช่น อาคารพัสดุกลาง"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-location" className="block text-xs font-semibold text-slate-600 mb-1">จุดเก็บ (เช่น A1-A20)</label>
                  <input
                    id="edit-product-location"
                    type="text"
                    value={editProductLocation}
                    onChange={(e) => setEditProductLocation(e.target.value)}
                    placeholder="เช่น A05"
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono"
                  />
                </div>
              </div>

              {/* Product Image URL (Google Drive Supported) */}
              <div>
                <label htmlFor="edit-product-imageurl" className="block text-xs font-semibold text-slate-600 mb-1">
                  ลิงก์รูปภาพพัสดุ (รองรับลิงก์รูปภาพทั่วไป และ Google Drive Link 📍)
                </label>
                <div className="space-y-2">
                  <input
                    id="edit-product-imageurl"
                    type="text"
                    value={editProductImageUrl}
                    onChange={(e) => setEditProductImageUrl(e.target.value)}
                    placeholder="เช่น https://drive.google.com/file/d/... หรือ https://..."
                    className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm font-mono"
                  />
                  {editProductImageUrl.trim() && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <img
                        src={convertGoogleDriveLink(editProductImageUrl)}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 object-cover rounded-lg bg-white border border-slate-200 shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=No+Image';
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-500">ภาพตัวอย่างพัสดุ</p>
                        <p className="text-[10px] text-slate-400 truncate">{editProductImageUrl}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 hover:shadow-lg transition-all cursor-pointer text-sm"
                >
                  บันทึกข้อมูลพัสดุ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN DELETE CONFIRM MODAL */}
      {isDeleteConfirmOpen && deleteProduct && (
        <div id="admin-delete-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-250">
            <div className="bg-rose-50 p-5 text-rose-800 border-b border-rose-100 flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg">ยืนยันการลบข้อมูลพัสดุอุปกรณ์</h3>
                <p className="text-xs text-rose-600 mt-0.5">การดำเนินการนี้จะไม่สามารถกู้คืนกลับมาได้ในภายหลัง</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-400 font-semibold uppercase">รายการที่จะลบ</p>
                <p className="text-sm font-bold text-slate-800 mt-1">{deleteProduct.code} - {deleteProduct.name}</p>
                <p className="text-xs text-slate-500 mt-1">หมวดหมู่: {deleteProduct.category} | คงเหลือ: {deleteProduct.quantity} {deleteProduct.unit}</p>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบพัสดุนี้ออกจากระบบทะเบียนสโตร์หอพัก? ข้อมูลสต็อกคงเหลือทั้งหมดจะถูกนำออกด้วย
              </p>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeleteProduct(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold transition-all cursor-pointer text-sm"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-md shadow-rose-100 hover:shadow-lg transition-all cursor-pointer text-sm"
                >
                  ลบข้อมูลออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
