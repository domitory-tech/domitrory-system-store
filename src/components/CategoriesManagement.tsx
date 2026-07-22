/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tags, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Folder, Package, Info, ShieldAlert, ExternalLink } from 'lucide-react';
import { Category, Product, User } from '../types';

export function extractFolderId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/) || trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }
  return trimmed;
}

interface CategoriesManagementProps {
  categories: Category[];
  products: Product[];
  onAddCategory: (newCategory: Category) => Promise<void>;
  onUpdateCategory: (oldCategory: Category, updatedCategory: Category) => Promise<void>;
  onDeleteCategory: (category: Category) => Promise<void>;
  currentUser: User;
}

export default function CategoriesManagement({
  categories,
  products,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  currentUser,
}: CategoriesManagementProps) {
  // Add Category Form states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [addErrorMsg, setAddErrorMsg] = useState<string | null>(null);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Edit Category Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editFolderId, setEditFolderId] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Category Warning Modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Handle Add Category submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddErrorMsg(null);
    setAddSuccessMsg(null);

    const nameTrimmed = newCategoryName.trim();
    if (!nameTrimmed) {
      setAddErrorMsg('กรุณากรอกชื่อหมวดหมู่อุปกรณ์');
      return;
    }

    // Check duplicate name
    const exists = categories.some(
      (c) => c.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (exists) {
      setAddErrorMsg(`หมวดหมู่ชื่อ "${nameTrimmed}" มีอยู่ในระบบเรียบร้อยแล้ว`);
      return;
    }

    const cleanFolderId = extractFolderId(newFolderId);

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name: nameTrimmed,
      folderId: cleanFolderId || undefined,
    };

    setIsSubmittingAdd(true);
    try {
      await onAddCategory(newCat);
      setNewCategoryName('');
      setNewFolderId('');
      setAddSuccessMsg(`เพิ่มหมวดหมู่ "${nameTrimmed}" เรียบร้อยแล้ว`);
      setTimeout(() => setAddSuccessMsg(null), 3000);
    } catch (err: any) {
      setAddErrorMsg('เกิดข้อผิดพลาดในการบันทึก: ' + (err.message || String(err)));
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Edit Category Modal open
  const handleOpenEdit = (category: Category) => {
    setTargetCategory(category);
    setEditName(category.name);
    setEditFolderId(category.folderId || '');
    setEditErrorMsg(null);
    setIsEditModalOpen(true);
  };

  // Handle Save Category Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCategory) return;
    setEditErrorMsg(null);

    const nameTrimmed = editName.trim();
    if (!nameTrimmed) {
      setEditErrorMsg('กรุณากรอกชื่อหมวดหมู่อุปกรณ์');
      return;
    }

    // Check duplicate name with other categories
    const exists = categories.some(
      (c) => c.id !== targetCategory.id && c.name.toLowerCase() === nameTrimmed.toLowerCase()
    );
    if (exists) {
      setEditErrorMsg(`หมวดหมู่ชื่อ "${nameTrimmed}" มีอยู่ในระบบเรียบร้อยแล้ว`);
      return;
    }

    const cleanFolderId = extractFolderId(editFolderId);

    const updatedCat: Category = {
      ...targetCategory,
      name: nameTrimmed,
      folderId: cleanFolderId || undefined,
    };

    setIsSubmittingEdit(true);
    try {
      await onUpdateCategory(targetCategory, updatedCat);
      setIsEditModalOpen(false);
      setTargetCategory(null);
    } catch (err: any) {
      setEditErrorMsg('เกิดข้อผิดพลาดในการแก้ไข: ' + (err.message || String(err)));
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handle Open Delete Confirm Modal
  const handleOpenDelete = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteErrorMsg(null);
    setIsDeleteModalOpen(true);
  };

  // Handle Confirm Delete Category
  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    // Check count of products belonging to this category
    const productCount = products.filter((p) => p.category === categoryToDelete.name).length;

    if (productCount > 0) {
      setDeleteErrorMsg(
        `ไม่สามารถลบหมวดหมู่นี้ได้ เนื่องจากยังมีรายการพัสดุในหมวดหมู่นี้จำนวน ${productCount} รายการ กรุณาลบหรือย้ายรายการพัสดุออกให้เป็น 0 ก่อนลบหมวดหมู่`
      );
      return;
    }

    setIsSubmittingDelete(true);
    try {
      await onDeleteCategory(categoryToDelete);
      setIsDeleteModalOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      setDeleteErrorMsg('เกิดข้อผิดพลาดในการลบ: ' + (err.message || String(err)));
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div id="categories-management-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-indigo-100 mb-1">
            <Tags className="h-5 w-5 text-indigo-200" />
            <span className="text-xs font-semibold uppercase tracking-wider">ระบบจัดการหมวดหมู่อุปกรณ์</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">เพิ่มและแก้ไขหมวดหมู่อุปกรณ์พัสดุ</h2>
          <p className="text-xs text-indigo-100/90 mt-1">
            บริหารจัดการหมวดหมู่สินค้าในคลังสโตร์ เพื่อจัดกลุ่มนำเข้า เบิกจ่าย และออกรายงาน
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center text-xs">
          <div className="text-indigo-200 font-medium">หมวดหมู่ทั้งหมดในระบบ</div>
          <div className="text-2xl font-black text-white mt-0.5">{categories.length} หมวดหมู่</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD CATEGORY FORM PANEL */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">เพิ่มหมวดหมู่ใหม่</h3>
              <p className="text-[11px] text-slate-500">สร้างหมวดหมู่อุปกรณ์พัสดุใหม่เข้าสู่ระบบ</p>
            </div>
          </div>

          {addErrorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{addErrorMsg}</span>
            </div>
          )}

          {addSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{addSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อหมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="เช่น อุปกรณ์ไฟฟ้า, เครื่องนอน..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Google Drive Folder ID <span className="text-slate-400 font-normal">(ถ้ามี)</span>
              </label>
              <input
                type="text"
                value={newFolderId}
                onChange={(e) => setNewFolderId(e.target.value)}
                placeholder="รหัสโฟลเดอร์ เช่น 1A2b3C..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmittingAdd}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{isSubmittingAdd ? 'กำลังบันทึก...' : 'เพิ่มหมวดหมู่อุปกรณ์'}</span>
            </button>
          </form>
        </div>

        {/* CATEGORIES LIST TABLE PANEL */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                <Tags className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">รายการหมวดหมู่ทั้งหมด</h3>
                <p className="text-[11px] text-slate-500">ตรวจสอบ แก้ไข หรือลบหมวดหมู่</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-3.5">ชื่อหมวดหมู่</th>
                  <th className="p-3.5 text-center">พัสดุในหมวดนี้</th>
                  <th className="p-3.5">Drive Folder ID</th>
                  <th className="p-3.5 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">
                      ยังไม่มีหมวดหมู่อุปกรณ์ในระบบ
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => {
                    const productCount = products.filter((p) => p.category === cat.name).length;
                    return (
                      <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                            {cat.name}
                          </div>
                        </td>
                        <td className="p-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              productCount > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Package className="h-3 w-3" />
                            {productCount} รายการ
                          </span>
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">
                          {cat.folderId ? (
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 text-slate-700 font-bold">
                                <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                {cat.folderId}
                              </span>
                              <a
                                href={`https://drive.google.com/drive/folders/${cat.folderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded-md font-sans font-bold transition-colors"
                              >
                                <span>เปิด Drive</span>
                                <ExternalLink className="h-2.5 w-2.5" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-300 italic">- ไม่ได้ระบุ -</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(cat)}
                              title="แก้ไขหมวดหมู่"
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(cat)}
                              title="ลบหมวดหมู่"
                              className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT CATEGORY MODAL */}
      {isEditModalOpen && targetCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">แก้ไขข้อมูลหมวดหมู่</h3>
                  <p className="text-[11px] text-slate-500">ปรับเปลี่ยนชื่อ หรือ Google Drive ID</p>
                </div>
              </div>
            </div>

            {editErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{editErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ชื่อหมวดหมู่อุปกรณ์ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google Drive Folder ID
                </label>
                <input
                  type="text"
                  value={editFolderId}
                  onChange={(e) => setEditFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingEdit ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION / WARNING MODAL */}
      {isDeleteModalOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">ยืนยันการลบหมวดหมู่</h3>
                <p className="text-xs text-slate-500">หมวดหมู่: <span className="font-bold text-slate-800">{categoryToDelete.name}</span></p>
              </div>
            </div>

            {(() => {
              const count = products.filter((p) => p.category === categoryToDelete.name).length;
              if (count > 0) {
                return (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-2 text-rose-800">
                    <div className="font-bold flex items-center gap-2 text-rose-700">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      ไม่สามารถลบหมวดหมู่นี้ได้ในขณะนี้!
                    </div>
                    <p>
                      เนื่องจากยังมีพัสดุจัดอยู่ในหมวดหมู่นี้จำนวน{' '}
                      <span className="font-black underline">{count} รายการ</span>
                    </p>
                    <p className="text-[11px] text-rose-600/90">
                      * เงื่อนไขระบบ: การลบหมวดหมู่จะทำได้ก็ต่อเมื่อจำนวนรายการพัสดุในหมวดหมู่นั้นเท่ากับ 0 เท่านั้น กรุณาย้ายหรือลบรายการพัสดุออกให้หมดก่อน
                    </p>
                  </div>
                );
              }

              return (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ <span className="font-bold text-slate-800">{categoryToDelete.name}</span> ออกจากระบบ?
                </div>
              );
            })()}

            {deleteErrorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{deleteErrorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              {products.filter((p) => p.category === categoryToDelete.name).length === 0 && (
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isSubmittingDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingDelete ? 'กำลังลบ...' : 'ลบหมวดหมู่'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
