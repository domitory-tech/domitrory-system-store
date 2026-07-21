import React from 'react';
import { Database, ShieldAlert, ExternalLink, RefreshCw, Layers, History, Users } from 'lucide-react';
import { Product, Transaction, User } from '../types';

interface FirebaseConfigProps {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  onResetData: () => void;
  currentUser: User;
}

export default function FirebaseConfig({
  products,
  transactions,
  users,
  onResetData,
  currentUser,
}: FirebaseConfigProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl p-6 shadow-md shadow-orange-500/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-5 w-5" />
            จัดการฐานข้อมูล Cloud Firestore
          </h2>
          <p className="text-xs text-orange-50">
            ระบบจัดเก็บข้อมูลในคลังสโตร์หอพักแบบเรียลไทม์ เชื่อมโยงผ่าน Google Firebase Platform
          </p>
        </div>
        <a
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-bold text-xs rounded-xl hover:bg-orange-50 transition-colors shadow-sm shrink-0"
        >
          เปิด Firebase Console
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Grid Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">สถานะการเชื่อมต่อ</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <p className="text-xs font-bold text-slate-800">Connected (Online)</p>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">พัสดุในระบบ</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{products.length} รายการ</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <History className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ธุรกรรมเคลื่อนไหว</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{transactions.length} รายการ</p>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ผู้ใช้งานระบบ</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5">{users.length} คน</p>
          </div>
        </div>
      </div>

      {/* Main Configurations & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Firebase details */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4 md:col-span-2">
          <h3 className="font-bold text-slate-900 text-sm">การเชื่อมต่อฐานข้อมูลปัจจุบัน</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            ระบบได้รับการกําหนดค่าฐานข้อมูล Firestore ในฝั่งเซิร์ฟเวอร์เพื่อให้ข้อมูลทั้งหมดซิงโครไนซ์แบบสองทิศทาง (Real-time Sync) คุณไม่ต้องกังวลเรื่องการสูญหายของข้อมูลในเบราว์เซอร์ ข้อมูลทั้งหมดจะปลอดภัยและเข้าถึงได้จากทุกที่ที่เชื่อมต่อกับ Firebase โปรเจกต์นี้
          </p>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-400">ชนิดฐานข้อมูล:</span>
              <span className="font-bold text-slate-700 font-mono text-[11px]">Cloud Firestore (NoSQL)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-400">การรับรองสิทธิ์:</span>
              <span className="font-bold text-slate-700 font-mono text-[11px]">Anonymous Authentication</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-200/60">
              <span className="text-slate-400">ระดับสิทธิ์ความปลอดภัย:</span>
              <span className="font-bold text-emerald-600 font-bold">Secured via Security Rules</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">ความน่าเชื่อถือ:</span>
              <span className="text-emerald-600 font-bold">99.9% Cloud SLA</span>
            </div>
          </div>
        </div>

        {/* Right Column: Danger Zone */}
        <div className="p-6 bg-white border border-rose-100 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <h3 className="font-bold text-rose-600 text-sm flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              โซนควบคุมความปลอดภัย (Danger Zone)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ฟังก์ชันนี้มีไว้เพื่อล้างฐานข้อมูลในกรณีที่ต้องการตั้งค่าพัสดุหอพักใหม่ตั้งแต่เริ่มต้น การล้างข้อมูลจะเป็นการลบพัสดุและรายการธุรกรรมทั้งหมดออกจากระบบคลังอย่างถาวร
            </p>
          </div>

          <button
            onClick={onResetData}
            className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            ล้างข้อมูลทั้งหมดในคลัง (Reset DB)
          </button>
        </div>
      </div>
    </div>
  );
}
