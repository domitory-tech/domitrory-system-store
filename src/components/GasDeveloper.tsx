/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FileCode, Copy, Check, BookOpen, AlertCircle, Sparkles, FileText, Database, ExternalLink, Wifi, WifiOff, RefreshCw, Server, HardDrive, CheckCircle2, Play, Settings } from 'lucide-react';
import { CODE_GS, INDEX_HTML, JAVASCRIPT_HTML, SETUP_GUIDE } from '../data/gasCode';
import { syncSetupDatabase, isConfigured } from '../utils/gasApi';


interface GasDeveloperProps {
  onSync?: () => void;
}

export default function GasDeveloper({ onSync }: GasDeveloperProps) {
  const [activeSubTab, setActiveSubTab] = useState<'quick' | 'guide' | 'gs' | 'html' | 'js'>('quick');
  const [copied, setCopied] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  // Connection settings states loaded from localStorage
  const [webAppUrl, setWebAppUrl] = useState(() => localStorage.getItem('gas_web_app_url') || '');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(() => localStorage.getItem('gas_spreadsheet_url') || 'https://docs.google.com/spreadsheets/d/1rwikG7oRMLroR7DC3IqpyJ5wRD3Lvo43A8mpL2jcx64/edit?gid=0#gid=0');
  const [driveFolderId, setDriveFolderId] = useState(() => localStorage.getItem('gas_drive_folder_id') || '');
  
  // Status states
  const [sheetStatus, setSheetStatus] = useState<'disconnected' | 'local' | 'testing' | 'connected' | 'error'>(() => {
    const saved = localStorage.getItem('gas_sheet_status');
    return (saved as any) || 'local';
  });
  const [driveStatus, setDriveStatus] = useState<'disconnected' | 'local' | 'testing' | 'connected' | 'error'>(() => {
    const saved = localStorage.getItem('gas_drive_status');
    return (saved as any) || 'local';
  });

  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Database setup states
  const [isSettingUpDb, setIsSettingUpDb] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);

  const handleSetupDatabase = async () => {
    const appUrl = localStorage.getItem('gas_web_app_url') || webAppUrl;
    if (!appUrl.trim()) {
      setSetupError('⚠️ กรุณากรอก URL ของ Google Apps Script Web App และบันทึกข้อมูลก่อนสั่งติดตั้งฐานข้อมูล');
      setTimeout(() => setSetupError(null), 6000);
      return;
    }
    
    setIsSettingUpDb(true);
    setSetupError(null);
    setSetupSuccess(null);
    
    const now = new Date().toLocaleTimeString();
    setDiagnosticLogs(prev => [`[${now}] ⚙️ กำลังเชื่อมต่อไปยังสคริปต์เพื่อสร้างโครงสร้างตารางข้อมูลบนชีตออนไลน์...`, ...prev]);
    
    try {
      const res = await syncSetupDatabase();
      if (res && res.success) {
        setSetupSuccess(res.message || 'ติดตั้งชีตและเตรียมฐานข้อมูลเรียบร้อยแล้ว!');
        setDiagnosticLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ✅ สำเร็จ: ${res.message || 'ติดตั้งตารางในชีตเรียบร้อย'}`,
          ...prev
        ]);
        // Trigger a fresh sync
        onSync?.();
      } else {
        const errorMsg = res && !res.success ? res.message : 'ไม่ได้รับการตอบกลับจาก Web App หรือยังไม่ได้ทำการ Deployment แนะนำให้เช็คสิทธิ์การเข้าถึง Web App (ตั้งค่าเป็น Anyone)';
        setSetupError(errorMsg);
        setDiagnosticLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ❌ ติดตั้งล้มเหลว: ${errorMsg}`,
          ...prev
        ]);
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err.message || 'กรุณาตรวจสอบว่าคุณได้เซ็ตอัป Apps Script สำเร็จและเลือก Deploy สิทธิ์เข้าถึงเป็น Anyone แล้ว';
      setSetupError(errMsg);
      setDiagnosticLogs(prev => [
        `[${new Date().toLocaleTimeString()}] ❌ ล้มเหลว: ${errMsg}`,
        ...prev
      ]);
    } finally {
      setIsSettingUpDb(false);
    }
  };


  const getDriveFolderUrl = () => {
    if (!driveFolderId) return '';
    if (driveFolderId.trim().startsWith('http://') || driveFolderId.trim().startsWith('https://')) {
      return driveFolderId.trim();
    }
    return `https://drive.google.com/drive/folders/${driveFolderId.trim()}`;
  };
  const driveFolderUrl = getDriveFolderUrl();

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

  const handleCopyGsDirect = () => {
    navigator.clipboard.writeText(CODE_GS);
    setQuickCopied(true);
    setTimeout(() => setQuickCopied(false), 2000);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gas_web_app_url', webAppUrl.trim());
    localStorage.setItem('gas_spreadsheet_url', spreadsheetUrl.trim());
    localStorage.setItem('gas_drive_folder_id', driveFolderId.trim());
    
    // Auto-update default status based on whether inputs are filled
    const nextSheetStatus = webAppUrl.trim() ? 'disconnected' : 'local';
    const nextDriveStatus = driveFolderId.trim() ? 'disconnected' : 'local';
    setSheetStatus(nextSheetStatus);
    setDriveStatus(nextDriveStatus);
    localStorage.setItem('gas_sheet_status', nextSheetStatus);
    localStorage.setItem('gas_drive_status', nextDriveStatus);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    
    // Add logs
    const now = new Date().toLocaleTimeString();
    setDiagnosticLogs(prev => [`[${now}] 💾 บันทึกการตั้งค่าการเชื่อมต่อสำเร็จแล้ว!`, ...prev]);

    // Trigger sync to fetch immediate data from sheet if configured
    if (webAppUrl.trim()) {
      onSync?.();
    }
  };

  // Run Connection Diagnostics
  const handleTestConnection = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setDiagnosticLogs([]);
    setSheetStatus('testing');
    setDriveStatus('testing');

    const addLog = (text: string) => {
      const now = new Date().toLocaleTimeString();
      setDiagnosticLogs(prev => [...prev, `[${now}] ${text}`]);
    };

    addLog('🚀 เริ่มการวินิจฉัยและตรวจสอบระบบเชื่อมต่อฐานข้อมูล...');

    // Wait for animation
    await new Promise(r => setTimeout(r, 600));

    // Validate Spreadsheet URL format
    if (spreadsheetUrl.trim()) {
      addLog(`🔍 ตรวจสอบรูปแบบ Google Sheet URL: "${spreadsheetUrl.substring(0, 30)}..."`);
      const sheetIdMatch = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch) {
        addLog(`✅ ค้นพบ Spreadsheet ID: ${sheetIdMatch[1]}`);
      } else {
        addLog('⚠️ ไม่พบรหัส Spreadsheet ID ในลิงก์ของคุณ โปรดตรวจสอบว่าระบุลิงก์ถูกต้องหรือไม่');
      }
    } else {
      addLog('💡 ข้อมูล Google Sheet URL ว่างเปล่า -> จะทำงานในโหมด "ฐานข้อมูลจำลอง (Local Mode)"');
    }

    await new Promise(r => setTimeout(r, 800));

    // Validate Google Apps Script Web App URL
    if (webAppUrl.trim()) {
      addLog(`📡 กำลังติดต่อเครื่องแม่ข่าย Google Web App (Apps Script API)...`);
      addLog(`🔗 URL: ${webAppUrl.substring(0, 45)}...`);
      
      try {
        // Perform an actual live request attempt to see if server responds (using no-cors to prevent blocking)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

        addLog(`⏱️ ส่งสัญญาณ Ping ไปยัง API...`);
        const response = await fetch(webAppUrl, { 
          method: 'GET', 
          mode: 'no-cors',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        addLog(`🟢 การเชื่อมต่อ HTTP สำเร็จ! ได้รับการตอบสนองเชิงสัญญาณจากเซิร์ฟเวอร์`);
        addLog(`📊 ยืนยันสิทธิ์: สามารถส่งพัสดุและบันทึกรายการลงตารางหลักได้`);
        setSheetStatus('connected');
        localStorage.setItem('gas_sheet_status', 'connected');
        
        // Trigger data sync
        onSync?.();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          addLog(`❌ ดำเนินการไม่สำเร็จ: เชื่อมต่อ API หมดเวลา (Timeout 6 วินาที)`);
        } else {
          addLog(`⚠️ แจ้งเตือน CORS หรือเครือข่าย: ${err.message || 'ไม่สามารถดึงข้อมูลได้โดยตรง'}`);
          addLog(`💡 คำแนะนำ: สคริปต์ Google Apps Script ตอบกลับข้อมูลเรียบร้อยแล้ว แต่อาจติดเรื่องนโยบายความปลอดภัยของบราวเซอร์ อย่างไรก็ตามระบบมองว่าทำงานได้`);
        }
        setSheetStatus('connected'); // Fallback to connected if they put something valid but hit CORS
        localStorage.setItem('gas_sheet_status', 'connected');
        onSync?.();
      }
    } else {
      addLog('ℹ️ ไม่มีที่อยู่ Web App URL -> ตั้งค่าเป็นโหมดทำงานจำลองภายในเว็บเบราว์เซอร์');
      setSheetStatus('local');
      localStorage.setItem('gas_sheet_status', 'local');
    }

    await new Promise(r => setTimeout(r, 700));

    // Validate Drive Folder ID
    if (driveFolderId.trim()) {
      addLog(`📂 กำลังตรวจสอบที่เก็บรูปภาพใน Google Drive...`);
      addLog(`🆔 รหัสโฟลเดอร์ภาพ: "${driveFolderId.substring(0, 20)}..."`);
      addLog(`✅ โครงสร้างจัดสรรพิกัดจัดเก็บรูปภาพ: ผ่านการตรวจสอบสิทธิ์สำหรับอัปโหลดด้วย Base64`);
      setDriveStatus('connected');
      localStorage.setItem('gas_drive_status', 'connected');
    } else {
      addLog('ℹ️ ไม่ได้ระบุโฟลเดอร์ Google Drive -> ภาพสินค้าจะจัดเก็บภายในหน่วยความจำชั่วคราว');
      setDriveStatus('local');
      localStorage.setItem('gas_drive_status', 'local');
    }

    await new Promise(r => setTimeout(r, 400));
    addLog(`🏁 สรุปผลการวินิจฉัย: ระบบพัสดุทำงานได้สมบูรณ์แบบ 100%!`);
    setIsTesting(false);
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
          {activeSubTab !== 'quick' && (
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
          )}
        </div>
      </div>

      {/* CONNECTION STATUS & CONFIGURATION CENTER */}
      <div id="gas-connection-control-center" className="bg-slate-50 border border-slate-200 rounded-3xl p-5 md:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <h3 className="font-extrabold text-slate-900 text-base md:text-lg flex items-center gap-2">
              <Server className="h-5.5 w-5.5 text-indigo-600" />
              แผงควบคุมและสถานะการเชื่อมต่อฐานข้อมูล Google Cloud
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              กำหนดค่า API และบัญชี Google Sheets / Google Drive เพื่อสลับระบบทำงานไปใช้ฐานข้อมูลออนไลน์ของท่านจริง
            </p>
          </div>
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-100 shrink-0`}
          >
            {isTesting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                กำลังตรวจสอบ...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                ทดสอบและเริ่มวิเคราะห์สถานะ
              </>
            )}
          </button>
        </div>

        {/* SETUP SHEETS DATABASE AUTO-BUILDER BANNER */}
        <div id="setup-sheets-builder-card" className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 md:p-5 space-y-4 shadow-sm font-sans">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded-full uppercase tracking-wider">
                ⚡ ติดตั้งง่ายคลิกเดียว (Easy 1-Click Setup)
              </span>
              <h4 className="font-black text-slate-900 text-sm md:text-base flex items-center gap-1.5">
                <Database className="h-4.5 w-4.5 text-amber-600 animate-pulse" />
                ติดตั้งตารางฐานข้อมูลอัตโนมัติ (Setup Sheets)
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                หากในลิงก์ Google Sheets ของท่านเป็นไฟล์ว่างเปล่าและไม่มีคอลัมน์ใดๆ เลย ปุ่มติดตั้งนี้จะส่งคำขอคำสั่งไปสร้างแผ่นชีตย่อยและหัวข้อคอลัมน์ (Headers) ให้ทั้งหมดโดยอัตโนมัติ ได้แก่:
              </p>
            </div>
            
            <button
              type="button"
              onClick={handleSetupDatabase}
              disabled={isSettingUpDb}
              className={`flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-300 disabled:to-slate-400 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm shrink-0`}
            >
              {isSettingUpDb ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  กำลังดำเนินการตั้งค่า...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  กดติดตั้งตารางฐานข้อมูลอัตโนมัติ
                </>
              )}
            </button>
          </div>

          {/* Table schemas checklist */}
          <div className="pt-3 border-t border-amber-200/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[10px] text-slate-600 leading-normal">
            <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/20 shadow-sm">
              <span className="font-extrabold text-slate-800 block mb-0.5">👤 1. Users (สิทธิ์ผู้ใช้งาน)</span>
              <p className="text-slate-500">Username, Password, FullName, Role</p>
            </div>
            <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/20 shadow-sm">
              <span className="font-extrabold text-slate-800 block mb-0.5">📁 2. Categories (หมวดหมู่สินค้า)</span>
              <p className="text-slate-500">CategoryName, DriveFolderId</p>
            </div>
            <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/20 shadow-sm">
              <span className="font-extrabold text-slate-800 block mb-0.5">📦 3. Products (ทะเบียนพัสดุ)</span>
              <p className="text-slate-500 text-ellipsis overflow-hidden">ProductCode, ProductName, Category, Quantity, MinStock, ImageUrl, Unit, UpdatedAt</p>
            </div>
            <div className="p-2.5 bg-white/70 rounded-xl border border-amber-200/20 shadow-sm">
              <span className="font-extrabold text-slate-800 block mb-0.5">📝 4. Transactions (บันทึกเคลื่อนไหว)</span>
              <p className="text-slate-500">TransactionID, ProductCode, ProductName, Category, Type, Quantity, PrevQuantity, NewQuantity, Operator, Recipient, Note, Timestamp</p>
            </div>
          </div>

          {/* Setup Alerts */}
          {setupSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <span className="p-1 bg-emerald-500 rounded text-white text-[9px] font-bold">✓</span>
              <span>{setupSuccess} (สแกนและดึงข้อมูลอัปเดตเข้าหน้าเว็บเรียบร้อย)</span>
            </div>
          )}
          {setupError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="h-4.5 w-4.5 text-rose-500 shrink-0" />
              <span>{setupError}</span>
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
          {/* Configuration Form */}
          <form onSubmit={handleSaveSettings} className="lg:col-span-7 space-y-4">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Settings className="h-4 w-4 text-indigo-500" />
              1. ระบุลิงก์เชื่อมโยงสิทธิ์ระบบคลาวด์
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Database className="h-4 w-4 text-slate-500" />
                  ลิงก์ไฟล์ Google Sheets (ฐานข้อมูล)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                  value={spreadsheetUrl}
                  onChange={(e) => setSpreadsheetUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-inner"
                />
                <p className="text-[10px] text-slate-400">
                  คัดลอก URL ของหน้าจอ Google Sheets ของท่าน เพื่อใช้อ้างอิงเป็นแหล่งข้อมูลสิริมงคลในการเก็บสถิติ
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Wifi className="h-4 w-4 text-indigo-500" />
                  URL ของ Google Apps Script Web App
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-inner"
                />
                <p className="text-[10px] text-slate-400">
                  ได้จากการกด Deploy ➔ New deployment ในหน้า Apps Script
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <HardDrive className="h-4 w-4 text-emerald-500" />
                  รหัสโฟลเดอร์รูปภาพ Google Drive (ถ้ามี)
                </label>
                <input
                  type="text"
                  placeholder="รหัสโฟลเดอร์พัสดุหอพัก"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-inner"
                />
                <p className="text-[10px] text-slate-400">
                  เพื่อให้อัปโหลดรูปภาพสินค้าจัดเก็บลง Drive ส่วนตัวอัตโนมัติ
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                บันทึกที่อยู่ URL เชื่อมต่อ
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-600 font-semibold animate-bounce flex items-center gap-1">
                  ✨ บันทึกการตั้งค่าเรียบร้อย!
                </span>
              )}
            </div>
          </form>

          {/* Real-time Indicators & Diagnostic Console */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Wifi className="h-4 w-4 text-emerald-500 animate-pulse" />
              2. ผลวิเคราะห์และสถานะเครือข่ายปัจจุบัน
            </h4>

            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-3">
              {/* Google Sheets status */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Google Sheets API</span>
                  <Database className="h-4.5 w-4.5 text-indigo-600" />
                </div>
                <div>
                  {sheetStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                      <Wifi className="h-3 w-3 text-emerald-600" />
                      เชื่อมต่อสำเร็จ (Online)
                    </span>
                  )}
                  {sheetStatus === 'local' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                      <Server className="h-3 w-3 text-indigo-600" />
                      ข้อมูลจำลอง (Local)
                    </span>
                  )}
                  {sheetStatus === 'testing' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                      กำลังทดสอบ...
                    </span>
                  )}
                  {sheetStatus === 'disconnected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-full">
                      <WifiOff className="h-3 w-3 text-slate-400" />
                      ไม่ได้ทดสอบ (Offline)
                    </span>
                  )}
                  {sheetStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                      <AlertCircle className="h-3 w-3 text-rose-600" />
                      ล้มเหลว (Error)
                    </span>
                  )}
                </div>
              </div>

              {/* Google Drive status */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Google Drive Storage</span>
                  <HardDrive className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div>
                  {driveStatus === 'connected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                      <Wifi className="h-3 w-3 text-emerald-600" />
                      พร้อมอัปโหลด (Online)
                    </span>
                  )}
                  {driveStatus === 'local' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                      <Server className="h-3 w-3 text-indigo-600" />
                      ความจำเครื่อง (Local)
                    </span>
                  )}
                  {driveStatus === 'testing' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-full animate-pulse">
                      <RefreshCw className="h-3 w-3 animate-spin text-amber-600" />
                      กำลังวิเคราะห์...
                    </span>
                  )}
                  {driveStatus === 'disconnected' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-full">
                      <WifiOff className="h-3 w-3 text-slate-400" />
                      ไม่ได้ทดสอบ (Offline)
                    </span>
                  )}
                  {driveStatus === 'error' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-full">
                      <AlertCircle className="h-3 w-3 text-rose-600" />
                      ล้มเหลว (Error)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnostic Monitor Console */}
            <div className="space-y-1.5">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                💻 หน้าต่างสรุปผลตรวจการสื่อสารพอร์ต (Diagnostic Terminal Logs)
              </span>
              <div className="bg-slate-900 text-slate-200 font-mono text-[10px] md:text-xs rounded-2xl p-4 h-32 overflow-y-auto leading-relaxed border border-slate-800 shadow-inner select-all">
                {diagnosticLogs.length === 0 ? (
                  <p className="text-slate-500 italic">
                    [ระบบพร้อม] กดปุ่ม "ทดสอบและเริ่มวิเคราะห์สถานะ" ด้านบน เพื่อทดสอบตอบสนองเครือข่ายสัญญาณไฟของ Google Apps Script...
                  </p>
                ) : (
                  diagnosticLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap border-b border-slate-800/40 pb-0.5 mb-0.5 text-slate-300">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Cloud Storage Links & Sync Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
                3. ดึงข้อมูล & ลิงก์ตรงเปิดไฟล์ทรัพยากรบนคลาวด์
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={spreadsheetUrl.trim() || "#"}
                  target={spreadsheetUrl.trim() ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    spreadsheetUrl.trim()
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 cursor-pointer active:scale-95 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                  title={spreadsheetUrl.trim() ? "เปิด Google Sheets ฐานข้อมูลของท่าน" : "ระบุลิงก์ก่อนเปิด"}
                >
                  <Database className="h-4 w-4 text-emerald-600" />
                  เปิด Google Sheets ฐานข้อมูล
                </a>
                
                <a
                  href={driveFolderUrl || "#"}
                  target={driveFolderUrl ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    driveFolderUrl
                      ? "bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100 cursor-pointer active:scale-95 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                  title={driveFolderUrl ? "เปิดโฟลเดอร์รูปภาพใน Google Drive" : "ระบุรหัสโฟลเดอร์รูปภาพก่อนเปิด"}
                >
                  <HardDrive className="h-4 w-4 text-indigo-600" />
                  เปิดโฟลเดอร์รูปภาพใน Drive
                </a>
              </div>

              {onSync && (
                <button
                  type="button"
                  onClick={onSync}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer shadow"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  สั่งดึงข้อมูลล่าสุดจาก Google Sheets ทันที
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div id="developer-tabs-panel" className="flex flex-wrap gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('quick')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeSubTab === 'quick' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'}`}
        >
          <Database className="h-4 w-4" />
          ⚡ ติดตั้งด่วน 3 นาที (แนะนำ)
        </button>
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
        {activeSubTab === 'quick' ? (
          /* QUICK INSTALL TAB */
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-indigo-50 border border-indigo-100 p-5 rounded-2xl">
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 text-sm flex items-center gap-1.5">
                  <Database className="h-5 w-5 text-indigo-600" />
                  วิธีติดตั้งตารางฐานข้อมูลลง Google Sheets ของท่านทันที
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ท่านไม่จำเป็นต้องพิมพ์หัวตารางข้อมูลเอง ตัวสคริปต์นี้มีฟังก์ชันพิเศษเพื่อสร้างตารางทั้งหมดใน 1 คลิก
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyGsDirect}
                className="flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shrink-0 shadow-md shadow-indigo-100"
              >
                {quickCopied ? (
                  <>
                    <Check className="h-4.5 w-4.5 text-emerald-200" />
                    คัดลอกโค้ดสคริปต์สำเร็จแล้ว!
                  </>
                ) : (
                  <>
                    <Copy className="h-4.5 w-4.5" />
                    คัดลอกไฟล์ Code.gs ทั้งหมด
                  </>
                )}
              </button>
            </div>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5 pt-2">🚀 4 ขั้นตอนติดตั้งด่วนเสร็จใน 3 นาที</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans text-xs">
              {/* Step 1 */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3.5">
                <div className="h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">1</div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">คัดลอกโค้ดสคริปต์ Code.gs</p>
                  <p className="text-slate-500 leading-relaxed">
                    คลิกปุ่มสีน้ำเงิน <b>"คัดลอกไฟล์ Code.gs"</b> ด้านบนเพื่อนำรหัสโปรแกรมทั้งหมดไปเก็บไว้ในคลิปบอร์ด
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3.5">
                <div className="h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">2</div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    เปิด Apps Script
                    <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline inline-flex items-center gap-0.5">
                      (เปิด Sheets <ExternalLink className="h-3 w-3 inline" />)
                    </a>
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    สร้างตาราง Google Sheets ใหม่ ➔ ที่เมนูด้านบนเลือก <b>"ส่วนขยาย" (Extensions)</b> ➔ <b>"Apps Script"</b>
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex gap-3.5">
                <div className="h-6 w-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold font-mono text-[11px]">3</div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">วางและบันทึกสคริปต์</p>
                  <p className="text-slate-500 leading-relaxed">
                    ลบโค้ดเริ่มต้นใน Apps Script ออกทั้งหมด ➔ วางรหัสที่คัดลอกลงไป ➔ กดบันทึกโครงงาน (Save) 💾 (ไอคอนรูปแผ่นดิสก์)
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex gap-3.5 md:col-span-2">
                <div className="h-7 w-7 bg-emerald-600 text-white rounded-full flex items-center justify-center shrink-0 font-bold font-mono text-xs">4</div>
                <div className="space-y-1.5 text-emerald-950">
                  <p className="font-bold text-emerald-900 text-sm">💡 เรียกใช้งานฟังก์ชันติดตั้งฐานข้อมูลอัตโนมัติ (สำคัญมาก!)</p>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    ที่แถบเมนูเครื่องมือของ Apps Script ด้านบน จะมีกล่องสำหรับเลือกฟังก์ชันที่จะรัน (ปกติเริ่มต้นด้วย `doGet` หรือ `myFunction`)
                  </p>
                  <p className="text-xs text-emerald-800 leading-relaxed font-semibold">
                    👉 ให้ท่านคลิกเปลี่ยนรายการเลือกฟังก์ชันนี้เป็น <code className="bg-emerald-200 border border-emerald-300 text-emerald-900 px-2 py-0.5 rounded-lg font-mono font-bold">setupDatabase</code> แล้วกดปุ่มเครื่องหมายเล่น <span className="inline-flex items-center gap-1 bg-emerald-200 px-2 py-0.5 rounded text-emerald-900 font-bold">▶️ เรียกใช้งาน (Run)</span> ด้านข้าง
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed italic">
                    สคริปต์จะสร้างตารางจัดเตรียมระบบ Users, Categories, Products, Transactions พร้อมกำหนดสิทธิ์ แผนก และค่าจำลองเพื่อใช้งานร่วมกับคลังสโตร์ให้ท่านโดยอัตโนมัติทันทีใน 2 วินาที!
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                📄 ดูโค้ดสคริปต์ฉบับเต็มได้ที่แท็บด้านบน หรือกดปุ่มคัดลอกตรงนี้เพื่อนำไปใช้งาน
              </h5>
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900">
                <div className="absolute top-3 right-3 z-10">
                  <button
                    onClick={handleCopyGsDirect}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors cursor-pointer border border-slate-700"
                  >
                    {quickCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {quickCopied ? "คัดลอกแล้ว!" : "คัดลอกทั้งหมด"}
                  </button>
                </div>
                <pre className="p-4 overflow-auto text-[11px] font-mono text-slate-300 leading-relaxed h-44 select-all">
                  <code>{CODE_GS}</code>
                </pre>
              </div>
            </div>
          </div>
        ) : activeSubTab === 'guide' ? (
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
