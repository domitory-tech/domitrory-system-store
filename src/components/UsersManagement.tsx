/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserPlus, Users, Trash2, Shield, User as UserIcon, Lock, Key, Edit2, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface UsersManagementProps {
  users: User[];
  onAddUser: (newUser: User) => void;
  onDeleteUser: (username: string) => void;
  onUpdateUser: (oldUsername: string, updatedUser: User) => void;
  currentUser: User;
}

export default function UsersManagement({ users, onAddUser, onDeleteUser, onUpdateUser, currentUser }: UsersManagementProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Staff');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit User Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('Staff');
  const [editOldPassword, setEditOldPassword] = useState('');
  const [editNewPassword, setEditNewPassword] = useState('');
  const [editConfirmNewPassword, setEditConfirmNewPassword] = useState('');
  const [editErrorMsg, setEditErrorMsg] = useState<string | null>(null);
  
  // Visibility states for password inputs
  const [revealPasswords, setRevealPasswords] = useState(false); // Global toggle in user list
  const [showAddPass, setShowAddPass] = useState(false); // Add User password eye
  const [showOldPass, setShowOldPass] = useState(false); // Edit Modal: old pass eye
  const [showNewPass, setShowNewPass] = useState(false); // Edit Modal: new pass eye
  const [showConfirmPass, setShowConfirmPass] = useState(false); // Edit Modal: confirm pass eye

  const handleOpenEditUser = (user: User) => {
    setTargetUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditOldPassword('');
    setEditNewPassword('');
    setEditConfirmNewPassword('');
    setEditErrorMsg(null);
    setIsEditModalOpen(true);
  };

  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg(null);

    if (!targetUser) return;

    const newU = editUsername.trim().toLowerCase();
    const newF = editFullName.trim();

    if (!newU || !newF) {
      setEditErrorMsg('กรุณากรอกชื่อจริง และชื่อผู้ใช้งาน');
      return;
    }

    // Check username conflict (except current)
    const exists = users.some(u => u.username.toLowerCase() === newU && u.username !== targetUser.username);
    if (exists) {
      setEditErrorMsg(`ชื่อผู้ใช้งาน "${editUsername}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น`);
      return;
    }

    let finalPassword = targetUser.password || '1234';

    // If attempting to change password
    if (editOldPassword || editNewPassword || editConfirmNewPassword) {
      const currentPass = targetUser.password || '1234';
      if (editOldPassword !== currentPass) {
        setEditErrorMsg('รหัสผ่านเดิมไม่ถูกต้อง');
        return;
      }
      if (!editNewPassword) {
        setEditErrorMsg('กรุณากรอกรหัสผ่านใหม่');
        return;
      }
      if (editNewPassword.length < 4) {
        setEditErrorMsg('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
        return;
      }
      if (editNewPassword !== editConfirmNewPassword) {
        setEditErrorMsg('การยืนยันรหัสผ่านใหม่ไม่ตรงกัน');
        return;
      }
      finalPassword = editNewPassword;
    }

    const updatedUser: User = {
      username: newU,
      fullName: newF,
      role: editRole,
      password: finalPassword
    };

    onUpdateUser(targetUser.username, updatedUser);
    setIsEditModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const u = username.trim().toLowerCase();
    const f = fullName.trim();
    const p = password.trim();

    if (!u || !f || !p) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบทุกช่อง');
      return;
    }

    // Check for existing username
    const exists = users.some(user => user.username.toLowerCase() === u);
    if (exists) {
      setErrorMsg(`ชื่อผู้ใช้งาน "${username}" มีอยู่ในระบบแล้ว กรุณาใช้ชื่ออื่น`);
      return;
    }

    if (p.length < 4) {
      setErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }

    onAddUser({
      username: u,
      fullName: f,
      role: role,
      password: p
    });

    setSuccessMsg(`เพิ่มผู้ใช้งาน "${f}" เข้าสู่ระบบเรียบร้อยแล้ว`);
    
    // Clear inputs
    setUsername('');
    setPassword('');
    setFullName('');
    setRole('Staff');

    setTimeout(() => {
      setSuccessMsg(null);
    }, 4000);
  };

  return (
    <div id="users-management-tab-content" className="space-y-6">
      {/* Description Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">จัดการข้อมูลผู้ใช้งานระบบ (User Management)</h2>
          <p className="text-sm text-slate-500 mt-1">เพิ่ม ลบ และกำหนดสิทธิ์ของเจ้าหน้าที่หรือผู้ดูแลระบบในการทำรายการเบิกจ่าย</p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200">
          <Users className="h-4 w-4" /> จำนวนผู้ใช้งานปัจจุบัน: {users.length} คน
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to Add User */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm h-fit">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-5 text-white">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" /> เพิ่มผู้ใช้งานใหม่
            </h3>
            <p className="text-xs text-indigo-100 mt-1">กรอกข้อมูลบัญชีใหม่เพื่ออนุญาตสิทธิ์การใช้งานระบบคลัง</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                {successMsg}
              </div>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="user-fullname" className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุลจริง</label>
              <div className="relative">
                <input
                  id="user-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="เช่น นายมานะ ยินดี"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="user-username" className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative">
                <input
                  id="user-username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ภาษาอังกฤษเท่านั้น เช่น mana"
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="h-4 w-4" />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="user-password" className="block text-xs font-semibold text-slate-600 mb-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                <input
                  id="user-password"
                  type={showAddPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่านเข้าใช้งาน (4 ตัวขึ้นไป)"
                  className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPass(!showAddPass)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  title={showAddPass ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showAddPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Role selection */}
            <div>
              <label htmlFor="user-role" className="block text-xs font-semibold text-slate-600 mb-1">บทบาทสิทธิ์ (Role)</label>
              <div className="relative">
                <select
                  id="user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer"
                >
                  <option value="Staff">เจ้าหน้าที่ทั่วไป (Staff)</option>
                  <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                </select>
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
            </div>

            <button
              id="btn-add-user"
              type="submit"
              className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all cursor-pointer text-sm"
            >
              เพิ่มรายชื่อผู้ใช้งาน
            </button>
          </form>
        </div>

        {/* Users List Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/75 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm">รายชื่อผู้ใช้งานทั้งหมดในระบบ</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setRevealPasswords(!revealPasswords)}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-all cursor-pointer"
              >
                {revealPasswords ? <EyeOff className="h-3 w-3 text-slate-500" /> : <Eye className="h-3 w-3 text-slate-500" />}
                {revealPasswords ? "ซ่อนรหัสผ่านทั้งหมด" : "แสดงรหัสผ่านทั้งหมด"}
              </button>
              <span className="text-xs text-slate-400 font-medium hidden md:inline">สิทธิ์ปัจจุบัน: {currentUser.fullName} ({currentUser.role})</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {users.map((user) => {
              const isAdmin = user.role === 'Admin';
              const isSelf = user.username === currentUser.username;
              return (
                <div key={user.username} className="p-4 flex items-center justify-between hover:bg-slate-50/40 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${isAdmin ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {user.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm">{user.fullName}</p>
                        {isSelf && (
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.2 rounded">บัญชีของคุณ</span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                        <span>Username: <span className="font-mono font-semibold text-slate-600">{user.username}</span></span>
                        <span>•</span>
                        <span>สิทธิ์: <span className={`font-semibold ${isAdmin ? 'text-indigo-600' : 'text-slate-600'}`}>{user.role}</span></span>
                        <span>•</span>
                        <span>รหัสผ่าน: <span className="font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{revealPasswords ? user.password : '••••••••'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Option */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditUser(user)}
                      className="p-2 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl transition-all cursor-pointer"
                      title="แก้ไขข้อมูลผู้ใช้ / เปลี่ยนรหัสผ่าน"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    {isSelf ? (
                      <span className="text-[10px] text-slate-400 italic bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">ตัวเอง</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${user.fullName}" ออกจากระบบ?`)) {
                            onDeleteUser(user.username);
                          }
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition-all cursor-pointer"
                        title="ลบผู้ใช้รายนี้"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ADMIN EDIT USER MODAL */}
      {isEditModalOpen && targetUser && (
        <div id="admin-edit-user-modal" className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-250">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Edit2 className="h-5 w-5" /> แก้ไขข้อมูลบัญชีผู้ใช้
              </h3>
              <p className="text-xs text-blue-100 mt-1">
                กำลังแก้ไขบัญชีของ: <span className="font-mono font-bold bg-white/20 px-1.5 py-0.5 rounded">{targetUser.username}</span>
              </p>
            </div>

            <form onSubmit={handleSaveUserEdit} className="p-6 space-y-4">
              {editErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {editErrorMsg}
                </div>
              )}

              {/* Edit Full Name */}
              <div>
                <label htmlFor="edit-user-fullname" className="block text-xs font-semibold text-slate-600 mb-1">ชื่อ-นามสกุลจริง</label>
                <div className="relative">
                  <input
                    id="edit-user-fullname"
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-semibold"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Edit Username */}
              <div>
                <label htmlFor="edit-user-username" className="block text-xs font-semibold text-slate-600 mb-1">ชื่อผู้ใช้งาน (Username)</label>
                <div className="relative">
                  <input
                    id="edit-user-username"
                    type="text"
                    required
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-mono font-semibold"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Key className="h-4 w-4" />
                  </div>
                </div>
              </div>

              {/* Edit Role */}
              <div>
                <label htmlFor="edit-user-role" className="block text-xs font-semibold text-slate-600 mb-1">บทบาทสิทธิ์ (Role)</label>
                <div className="relative">
                  <select
                    id="edit-user-role"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm cursor-pointer appearance-none"
                    disabled={targetUser.username === currentUser.username}
                  >
                    <option value="Staff">เจ้าหน้าที่ทั่วไป (Staff)</option>
                    <option value="Admin">ผู้ดูแลระบบ (Admin)</option>
                  </select>
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Shield className="h-4 w-4" />
                  </div>
                </div>
                {targetUser.username === currentUser.username && (
                  <p className="text-[10px] text-slate-400 mt-1">ไม่สามารถเปลี่ยนระดับสิทธิ์ของตัวเองได้เพื่อป้องกันการตัดสิทธิ์</p>
                )}
              </div>

              {/* Change Password Area */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                  <Lock className="h-3.5 w-3.5 text-indigo-500" /> เปลี่ยนรหัสผ่านความปลอดภัย (เว้นว่างไว้หากไม่เปลี่ยน)
                </p>

                {/* Old Password */}
                <div>
                  <label htmlFor="edit-user-old-pass" className="block text-[11px] font-semibold text-slate-500 mb-1">รหัสผ่านเดิม</label>
                  <div className="relative">
                    <input
                      id="edit-user-old-pass"
                      type={showOldPass ? "text" : "password"}
                      value={editOldPassword}
                      onChange={(e) => setEditOldPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านเดิมของบัญชีนี้"
                      className="block w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showOldPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* New Password & Confirm New Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-user-new-pass" className="block text-[11px] font-semibold text-slate-500 mb-1">รหัสผ่านใหม่ (4 ตัวขึ้นไป)</label>
                    <div className="relative">
                      <input
                        id="edit-user-new-pass"
                        type={showNewPass ? "text" : "password"}
                        value={editNewPassword}
                        onChange={(e) => setEditNewPassword(e.target.value)}
                        placeholder="รหัสผ่านใหม่"
                        className="block w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="edit-user-confirm-pass" className="block text-[11px] font-semibold text-slate-500 mb-1">ยืนยันรหัสผ่านใหม่</label>
                    <div className="relative">
                      <input
                        id="edit-user-confirm-pass"
                        type={showConfirmPass ? "text" : "password"}
                        value={editConfirmNewPassword}
                        onChange={(e) => setEditConfirmNewPassword(e.target.value)}
                        placeholder="ยืนยันรหัสผ่านใหม่"
                        className="block w-full pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-3.5 w-3.5" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showConfirmPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
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
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
