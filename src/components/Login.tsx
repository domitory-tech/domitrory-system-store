/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Warehouse, Lock, User as UserIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  users: User[];
}

export default function Login({ onLoginSuccess, users }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // จำลองการดึงชีตและตรวจสอบสิทธิ์
    setTimeout(() => {
      const u = username.trim().toLowerCase();
      const p = password.trim();

      const foundUser = users.find(user => user.username.toLowerCase() === u);

      if (foundUser && (foundUser.password === p || (!foundUser.password && p === '1234'))) {
        onLoginSuccess(foundUser);
      } else {
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง');
        setIsLoading(false);
      }
    }, 600);
  };

  return (
    <div id="login-screen" className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans selection:bg-indigo-500 selection:text-white">
      <div id="login-container" className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Decorator */}
        <div id="login-header-banner" className="bg-gradient-to-r from-slate-800 to-indigo-900 p-8 text-white text-center relative">
          <div className="absolute top-0 right-0 left-0 bottom-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
          <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-4 border border-white/10">
            <Warehouse className="h-10 w-10 text-indigo-300" />
          </div>
          <h1 id="login-title" className="text-2xl font-bold tracking-tight">ระบบสโตร์หอพัก</h1>
          <p id="login-subtitle" className="text-sm text-indigo-200 mt-1 font-light">เบิก-นำเข้า-จ่าย และแจ้งเตือนสต็อกสินค้า</p>
        </div>

        {/* Content Panel */}
        <div className="p-8">
          {error && (
            <div id="login-error-alert" className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="input-username" className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-5 w-5" />
                </div>
                <input
                  id="input-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน..."
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-password" className="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่าน (Password)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="กรอกรหัสผ่าน..."
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all text-sm"
                />
              </div>
            </div>

            <button
              id="btn-submit-login"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-300 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 text-sm"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Details */}
        <div id="login-footer" className="bg-slate-50 p-4 text-center border-t border-slate-100 text-[11px] text-slate-400">
          จำลองฐานข้อมูลผ่าน Google Sheets & Drive API
        </div>
      </div>
    </div>
  );
}
