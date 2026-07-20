/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FileCode, Copy, Check, BookOpen, AlertCircle, Sparkles, FileText } from 'lucide-react';
import { CODE_GS, INDEX_HTML, JAVASCRIPT_HTML, SETUP_GUIDE } from '../data/gasCode';

export default function GasDeveloper() {
  const [activeSubTab, setActiveSubTab] = useState<'gs' | 'html' | 'js' | 'guide'>('guide');
  const [copied, setCopied] = useState(false);

  const getCodeString = () => {
    switch (activeSubTab) {
      case 'gs': return CODE_GS;
      case 'html': return INDEX_HTML;
      case 'js': return JAVASCRIPT_HTML;
      case 'guide': return SETUP_GUIDE;
      default: return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="gas-developer-center" className="space-y-6">
      {/* Intro Panel */}
      <div id="developer-intro" className="bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 bottom-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-500/30 text-indigo-200 text-xs font-semibold rounded-full border border-indigo-400/20">
              <Sparkles className="h-3 w-3" /> ผู้ช่วยติดตั้งระบบ (GAS Developer Hub)
            </span>
            <h2 className="text-xl font-bold">ศูนย์รวมโค้ด Google Apps Script (GAS) สำหรับคัดลอก</h2>
            <p className="text-xs text-indigo-200">ระบบสโตร์และพัสดุหอพัก เชื่อมต่อฐานข้อมูลชีตและเก็บรูปสินค้าลง Drive อัตโนมัติแยกหมวดหมู่</p>
          </div>
          <button
            id="btn-copy-code"
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-indigo-950 font-bold rounded-xl text-xs cursor-pointer shadow transition-all active:scale-95"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                คัดลอกรหัสสำเร็จ!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                คัดลอกโค้ดของแท็บปัจจุบัน
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div id="developer-tabs-panel" className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'guide' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
        >
          <BookOpen className="h-4 w-4" />
          คู่มือจัดเตรียม Sheets & Drive
        </button>
        <button
          onClick={() => setActiveSubTab('gs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'gs' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
        >
          <FileCode className="h-4 w-4" />
          Code.gs (หลังบ้านของระบบ)
        </button>
        <button
          onClick={() => setActiveSubTab('html')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'html' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
        >
          <FileText className="h-4 w-4" />
          Index.html (หน้าจอหลัก)
        </button>
        <button
          onClick={() => setActiveSubTab('js')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'js' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
        >
          <FileCode className="h-4 w-4" />
          JavaScript.html (ตัวอย่างคุมหน้าบ้าน)
        </button>
      </div>

      {/* Code Display Area */}
      <div id="developer-code-display-frame" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {activeSubTab === 'guide' ? (
          /* SETUP GUIDE tab */
          <div className="p-6 md:p-8 space-y-6">
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold">คำแนะนำก่อนเริ่มจัดทำ:</p>
                <p className="mt-1 leading-relaxed">กรุณาทำตามแต่ละขั้นตอนอย่างตั้งใจเพื่อความไหลลื่นของตัวแอปพลิเคชัน ตัวสคริปต์นี้ถูกเขียนโดยใช้คำสั่งจดจำข้อมูลที่มีประสิทธิภาพสูง ตารางข้อมูลจะถูกสร้างทันทีเมื่อผู้ใช้งานล็อกอินเข้าใช้งานครั้งแรกบน Google Sheets</p>
              </div>
            </div>

            <div className="prose max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap font-sans">
              {SETUP_GUIDE}
            </div>
          </div>
        ) : (
          /* CODE TABS */
          <div className="relative">
            {/* Overlay Copy Button */}
            <button
              onClick={handleCopy}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg cursor-pointer transition-colors border border-slate-700 z-10 shadow-sm"
              title="คัดลอกไปยัง Clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>

            {/* Code Blocks */}
            <pre id="pre-code-content" className="p-6 bg-slate-900 text-slate-200 overflow-auto text-xs font-mono leading-relaxed h-[600px] selection:bg-indigo-500 selection:text-white">
              <code>{getCodeString()}</code>
            </pre>
          </div>
        )}
      </div>

      {/* Help box */}
      <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3.5 text-indigo-900 text-xs">
        <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
        <p className="font-medium leading-relaxed">
          <strong>💡 เคล็ดลับเพิ่มเติม:</strong> เมื่อทำการ Deploy ใน Google Apps Script ทุกๆ ครั้งที่คุณมีการอัปเดตสคริปต์เพิ่มเติม คุณต้องสร้างรุ่นการทำงานใหม่ (New deployment) และเลือกเปลี่ยนสิทธิ์ให้เป็นรุ่นล่าสุดเสมอ เพื่อป้องกันปัญหาสัญลักษณ์ Cache
        </p>
      </div>
    </div>
  );
}
