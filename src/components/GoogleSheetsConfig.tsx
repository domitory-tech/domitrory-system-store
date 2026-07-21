/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, FileSpreadsheet, RefreshCcw, CheckCircle2, AlertTriangle, ExternalLink, LogOut, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react';
import { Product, Transaction, User } from '../types';
import { googleSignIn, googleSignOut, findOrCreateSpreadsheet, pushDataToSpreadsheet, pullDataFromSpreadsheet } from '../utils/googleSheets';

interface GoogleSheetsConfigProps {
  products: Product[];
  transactions: Transaction[];
  users: User[];
  onSyncSuccess: (pulledProducts: Product[], pulledTransactions: Transaction[], pulledUsers: User[]) => void;
  currentUser: User;
}

export default function GoogleSheetsConfig({
  products,
  transactions,
  users,
  onSyncSuccess,
  currentUser
}: GoogleSheetsConfigProps) {
  const [googleUserEmail, setGoogleUserEmail] = useState<string | null>(() => localStorage.getItem('google_logged_in_email'));
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(() => localStorage.getItem('google_spreadsheet_id'));
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | null>(() => localStorage.getItem('google_spreadsheet_url'));
  
  const [isBusy, setIsBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign in with Google
  const handleGoogleLogin = async () => {
    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setStatusMessage('กำลังลงชื่อเข้าใช้งานด้วย Google...');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUserEmail(result.user.email);
        setSuccessMessage('ลงชื่อเข้าใช้ Google สำเร็จ!');
        
        // Auto check or create spreadsheet
        setStatusMessage('กำลังตรวจหาไฟล์ "คลังสโตร์หอพัก (Dormitory Inventory Store)" บน Google Drive ของคุณ...');
        const sheetDetails = await findOrCreateSpreadsheet(result.accessToken, products, transactions, users);
        setSpreadsheetId(sheetDetails.spreadsheetId);
        setSpreadsheetUrl(sheetDetails.url);
        
        if (sheetDetails.createdNew) {
          setSuccessMessage('เชื่อมต่อสำเร็จ! สร้างไฟล์ระบบใหม่บน Google Sheets เรียบร้อยแล้ว พร้อมส่งข้อมูลเริ่มต้นขึ้นสู่ไฟล์');
        } else {
          setSuccessMessage('เชื่อมต่อกับไฟล์ Google Sheets เดิมในระบบเรียบร้อยแล้ว!');
          // Prompt to sync
          const confirmPull = window.confirm('พบไฟล์คลังสโตร์เดิมใน Google Sheets ของคุณ! คุณต้องการนำเข้าข้อมูลสินค้าและรายการเคลื่อนไหวจากชีตลงมาใช้งานในแอปพลิเคชันหรือไม่? \n\n(กด ตกลง เพื่อดึงข้อมูลจากชีต / กด ยกเลิก หากต้องการใช้ข้อมูลปัจจุบันในเครื่อง)');
          if (confirmPull) {
            setStatusMessage('กำลังดึงข้อมูลพัสดุและรายการเคลื่อนไหวจาก Google Sheets...');
            const data = await pullDataFromSpreadsheet(result.accessToken, sheetDetails.spreadsheetId);
            onSyncSuccess(data.products, data.transactions, data.users);
            setSuccessMessage('ดึงข้อมูลและประสานงานร่วมกับ Google Sheets สำเร็จเรียบร้อยแล้ว!');
          }
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'การเชื่อมต่อบัญชี Google ผิดพลาด');
    } finally {
      setIsBusy(false);
      setStatusMessage('');
    }
  };

  // Logout Google
  const handleGoogleLogout = async () => {
    if (window.confirm('⚠️ คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการเชื่อมต่อ Google Sheets? ข้อมูลจะยังคงถูกจัดเก็บในเครื่องตามปกติ')) {
      setIsBusy(true);
      try {
        await googleSignOut();
        setGoogleUserEmail(null);
        setSpreadsheetId(null);
        setSpreadsheetUrl(null);
        setSuccessMessage('ยกเลิกการเชื่อมต่อ Google Sheets เรียบร้อยแล้ว');
      } catch (err: any) {
        setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อ');
      } finally {
        setIsBusy(false);
      }
    }
  };

  // Manual Sync: Pull from Spreadsheet (Overwrite Local)
  const handlePullData = async () => {
    const token = (await import('../utils/googleSheets')).getAccessToken();
    if (!token || !spreadsheetId) {
      alert('เซสชันของท่านหมดอายุ กรุณาลงชื่อเข้าใช้ใหม่อีกครั้ง');
      handleGoogleLogin();
      return;
    }

    if (window.confirm('⚠️ คำเตือน: การกระทำนี้จะดึงข้อมูลจาก Google Sheets และ "เขียนทับข้อมูลในเครื่องทั้งหมด" คุณต้องการดำเนินการต่อหรือไม่?')) {
      setIsBusy(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setStatusMessage('กำลังดึงข้อมูลพัสดุล่าสุดจาก Google Sheets...');
      try {
        const data = await pullDataFromSpreadsheet(token, spreadsheetId);
        onSyncSuccess(data.products, data.transactions, data.users);
        setSuccessMessage('ดึงข้อมูลพัสดุจาก Google Sheets ลงสู่ระบบเรียบร้อยแล้ว!');
      } catch (err: any) {
        setErrorMessage(err.message || 'การดึงข้อมูลผิดพลาด');
      } finally {
        setIsBusy(false);
        setStatusMessage('');
      }
    }
  };

  // Manual Sync: Push to Spreadsheet (Overwrite Sheet)
  const handlePushData = async () => {
    const token = (await import('../utils/googleSheets')).getAccessToken();
    if (!token || !spreadsheetId) {
      alert('เซสชันของท่านหมดอายุ กรุณาลงชื่อเข้าใช้ใหม่อีกครั้ง');
      handleGoogleLogin();
      return;
    }

    if (window.confirm('⚠️ คำเตือน: การกระทำนี้จะนำข้อมูลปัจจุบันทั้งหมดในเครื่อง "เขียนทับข้อมูลบนไฟล์ Google Sheets เดิม" คุณต้องการดำเนินการต่อหรือไม่?')) {
      setIsBusy(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setStatusMessage('กำลังส่งข้อมูลในเครื่องขึ้นเขียนทับบน Google Sheets...');
      try {
        await pushDataToSpreadsheet(token, spreadsheetId, products, transactions, users);
        setSuccessMessage('อัปโหลดและเขียนทับข้อมูลบน Google Sheets สำเร็จเรียบร้อยแล้ว!');
      } catch (err: any) {
        setErrorMessage(err.message || 'การส่งข้อมูลขึ้นชีตผิดพลาด');
      } finally {
        setIsBusy(false);
        setStatusMessage('');
      }
    }
  };

  return (
    <div id="google-sheets-panel" className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
          ระบบฐานข้อมูล Google Sheets & Google Drive
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          เชื่อมต่อคลังพัสดุของคุณเข้ากับ Google Sheets โดยตรง ปลอดภัย ไม่ต้องตั้งค่า Script ไม่ต้องเขียนสูตร ระบบจะคัดลอกและบันทึกข้อมูลแบบเรียลไทม์ไว้ในบัญชี Google ไดรฟ์ของคุณเอง
        </p>
      </div>

      {/* Connection Status & Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Connection Widget Card */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">สถานะการเชื่อมต่อ</span>
            {googleUserEmail ? (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    เชื่อมต่อแล้ว
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-600 truncate mt-1" title={googleUserEmail}>
                  📧 {googleUserEmail}
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 bg-slate-300 rounded-full"></span>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    โหมดจัดเก็บในเครื่องชั่วคราว
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ระบบบันทึกพัสดุในเครื่องเบราว์เซอร์นี้ ข้อมูลจะหายหากล้างประวัติ (Local Storage)
                </p>
              </div>
            )}
          </div>

          <div className="pt-4">
            {googleUserEmail ? (
              <button
                onClick={handleGoogleLogout}
                disabled={isBusy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                ยกเลิกการเชื่อมต่อบัญชี
              </button>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isBusy}
                className="gsi-material-button w-full flex items-center justify-center cursor-pointer"
                style={{
                  background: 'white',
                  border: '1px solid #dadce0',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  color: '#3c4043',
                  fontSize: '13px',
                  fontWeight: '500',
                  fontFamily: 'Roboto, arial, sans-serif'
                }}
              >
                <div className="flex items-center gap-3">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>เชื่อมต่อกับ Google Account</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Database Spreadsheet File Details */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ไฟล์คลังพัสดุในระบบ</span>
                <h3 className="font-bold text-slate-800 text-sm md:text-base mt-2 flex items-center gap-1.5">
                  <Database className="h-4.5 w-4.5 text-indigo-600" />
                  คลังสโตร์หอพัก (Dormitory Inventory Store)
                </h3>
              </div>
              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 transition-all hover:scale-105"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  เปิด Google Sheets
                </a>
              )}
            </div>

            {spreadsheetId ? (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Spreadsheet ID:</span>
                    <span className="font-mono text-slate-600 block truncate">{spreadsheetId}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">แผ่นงาน (Tabs):</span>
                    <span className="font-bold text-slate-700 block">Products, Transactions, Users</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-400">
                  กรุณาลงชื่อเข้าใช้ Google เพื่อเชื่อมโยงหรือสร้างไฟล์ระบบฐานข้อมูลพัสดุโดยอัตโนมัติ
                </p>
              </div>
            )}
          </div>

          {/* Sync Operations Controls */}
          {spreadsheetId && (
            <div className="pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handlePullData}
                disabled={isBusy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-amber-200 hover:border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                title="ดึงข้อมูลล่าสุดจาก Sheets มาทับเครื่อง"
              >
                <ArrowDownRight className="h-4 w-4 text-amber-600" />
                📥 ดึงข้อมูลลงเครื่อง (Pull)
              </button>
              <button
                onClick={handlePushData}
                disabled={isBusy}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                title="อัปโหลดข้อมูลในเครื่องเขียนทับลง Sheets"
              >
                <ArrowUpRight className="h-4 w-4 text-indigo-600" />
                📤 อัปโหลดขึ้น Google Sheets (Push)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress & Toast Notification Panels */}
      {(statusMessage || errorMessage || successMessage) && (
        <div className="space-y-3">
          {statusMessage && (
            <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-3 text-xs text-blue-800 font-medium">
              <RefreshCcw className="h-4 w-4 text-blue-500 animate-spin shrink-0" />
              <div>{statusMessage}</div>
            </div>
          )}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800 font-medium">
              <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
              <div>{errorMessage}</div>
            </div>
          )}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}
        </div>
      )}

      {/* Information Guide Card */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-sm border border-emerald-950">
        <div className="absolute top-0 right-0 left-0 bottom-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/10 shrink-0">
            <Sparkles className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-sm md:text-base text-emerald-100">
              💡 คุณประโยชน์ของการเชื่อมโยง Google Sheets
            </h4>
            <ul className="text-xs text-emerald-200 leading-relaxed font-light space-y-1.5 list-disc pl-4">
              <li><strong>บันทึกเรียลไทม์:</strong> เมื่อเชื่อมต่อแล้ว ทุกรายการนำเข้า เบิกจ่าย แก้ไขสินค้า หรือผู้ใช้จะซิงค์ส่งเข้าชีตทันที</li>
              <li><strong>จัดเก็บถาวร:</strong> มั่นใจว่าข้อมูลสินค้าไม่สูญหายแม้จะเปลี่ยนเครื่อง เคลียร์คุกกี้ หรือปิดเบราว์เซอร์</li>
              <li><strong>ทำงานร่วมกัน:</strong> เจ้าหน้าที่และผู้บริหารคนอื่นสามารถทำงานบนคลังพัสดุพร้อมกันได้ โดยใช้ Google Account ร่วมกัน</li>
              <li><strong>วิเคราะห์ข้อมูล:</strong> นำข้อมูลใน Google Sheets ไปสร้างรายงาน แผนภูมิกระดานแดชบอร์ด (Looker Studio) หรือจัดเรียงต่อใน Excel ได้ทันที</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
