/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  AlertTriangle, 
  Building, 
  UserCheck, 
  X, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCcw,
  Sparkles,
  Info
} from 'lucide-react';
import { Product, Transaction } from '../types';

interface ReportsProps {
  products: Product[];
  transactions: Transaction[];
  categories: string[];
}

type ReportType = 'INTAKE' | 'WITHDRAW' | 'REMAINING';
type ExportFormat = 'EXCEL' | 'PDF';

export default function Reports({ products, transactions, categories }: ReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('INTAKE');
  
  // Confirmation Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [pendingExportType, setPendingExportType] = useState<ReportType | null>(null);

  // Common filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Withdrawal specific filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBuilding, setSelectedBuilding] = useState('ALL');
  const [operatorSearch, setOperatorSearch] = useState('');

  // Remaining specific filters
  const [remainingThreshold, setRemainingThreshold] = useState<number>(10);
  const [remainingCategory, setRemainingCategory] = useState('ALL');

  // Set default date range on mount (start of this month to today)
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Format YYYY-MM-DD for input type="date"
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setStartDate(formatDate(firstDay));
    setEndDate(formatDate(today));
  }, []);

  // Dynamically extract unique buildings from products
  const uniqueBuildings = Array.from(
    new Set(products.map(p => p.building).filter(Boolean))
  ) as string[];

  // 1. Filtered data for INTAKE report
  const filteredIntakes = transactions.filter(tx => {
    if (tx.type !== 'INTAKE') return false;
    
    // Date filter
    const dateStr = tx.timestamp.substring(0, 10); // 'YYYY-MM-DD'
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
    
    return true;
  });

  // 2. Filtered data for WITHDRAW report
  const filteredWithdrawals = transactions.filter(tx => {
    if (tx.type !== 'WITHDRAW') return false;
    
    // Date filter
    const dateStr = tx.timestamp.substring(0, 10);
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;

    // Category filter
    if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;

    // Building filter (lookup building of the product)
    if (selectedBuilding !== 'ALL') {
      const pItem = products.find(p => p.code === tx.code);
      if (!pItem || pItem.building !== selectedBuilding) return false;
    }

    // Operator/Recipient text filter
    if (operatorSearch.trim() !== '') {
      const query = operatorSearch.toLowerCase();
      const matchesOperator = tx.operator.toLowerCase().includes(query);
      const matchesRecipient = tx.recipient ? tx.recipient.toLowerCase().includes(query) : false;
      if (!matchesOperator && !matchesRecipient) return false;
    }

    return true;
  });

  // 3. Filtered data for REMAINING stock report
  const filteredRemaining = products.filter(p => {
    // Threshold filter
    if (p.quantity > remainingThreshold) return false;

    // Category filter
    if (remainingCategory !== 'ALL' && p.category !== remainingCategory) return false;

    return true;
  });

  // Export Confirmation Dialog Trigger
  const triggerExportConfirmation = (reportType: ReportType) => {
    setPendingExportType(reportType);
    setIsExportModalOpen(true);
  };

  // Execute export based on selection
  const handleExportConfirm = (format: ExportFormat) => {
    setIsExportModalOpen(false);
    if (!pendingExportType) return;

    if (format === 'EXCEL') {
      exportToExcel(pendingExportType);
    } else {
      exportToPdf(pendingExportType);
    }
  };

  // Helper: Format Thai Date for Reports
  const formatThaiDate = (dateStr: string) => {
    try {
      const [datePart] = dateStr.split(' ');
      const [y, m, d] = datePart.split('-');
      return `${d}/${m}/${parseInt(y) + 543}`;
    } catch {
      return dateStr;
    }
  };

  // Function to Export CSV (Excel compatible) with UTF-8 BOM
  const exportToExcel = (type: ReportType) => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = '';

    const bom = '\uFEFF';

    if (type === 'INTAKE') {
      filename = `รายงานการนำเข้าอุปกรณ์_${startDate}_ถึง_${endDate}.csv`;
      headers = [
        'ลำดับ',
        'วัน-เวลาทำรายการ',
        'รหัสอุปกรณ์',
        'ชื่ออุปกรณ์',
        'หมวดหมู่อุปกรณ์',
        'จำนวนที่นำเข้า',
        'หน่วยนับ',
        'ยอดคลังก่อนหน้า',
        'ยอดคลังล่าสุด',
        'ผู้ทำรายการ',
        'หมายเหตุ'
      ];
      rows = filteredIntakes.map((tx, idx) => [
        String(idx + 1),
        tx.timestamp,
        tx.code,
        tx.productName,
        tx.category,
        String(tx.quantity),
        products.find(p => p.code === tx.code)?.unit || 'ชิ้น',
        String(tx.prevQuantity),
        String(tx.newQuantity),
        tx.operator,
        tx.note || '-'
      ]);
    } else if (type === 'WITHDRAW') {
      filename = `รายงานการเบิกจ่ายอุปกรณ์_${startDate}_ถึง_${endDate}.csv`;
      headers = [
        'ลำดับ',
        'วัน-เวลาทำรายการ',
        'รหัสอุปกรณ์',
        'ชื่ออุปกรณ์',
        'หมวดหมู่อุปกรณ์',
        'อาคารสถานที่จัดเก็บ',
        'จำนวนที่เบิกจ่าย',
        'หน่วยนับ',
        'ผู้ทำรายการเบิกจ่าย',
        'ผู้รับอุปกรณ์',
        'วัตถุประสงค์ / หมายเหตุ'
      ];
      rows = filteredWithdrawals.map((tx, idx) => {
        const pItem = products.find(p => p.code === tx.code);
        return [
          String(idx + 1),
          tx.timestamp,
          tx.code,
          tx.productName,
          tx.category,
          pItem?.building ? `${pItem.building} (${pItem.location || '-'})` : '-',
          String(tx.quantity),
          pItem?.unit || 'ชิ้น',
          tx.operator,
          tx.recipient || '-',
          tx.note || '-'
        ];
      });
    } else if (type === 'REMAINING') {
      filename = `รายงานอุปกรณ์คงเหลือต่ำกว่า_${remainingThreshold}_ชิ้น.csv`;
      headers = [
        'ลำดับ',
        'รหัสอุปกรณ์',
        'ชื่ออุปกรณ์',
        'หมวดหมู่อุปกรณ์',
        'อาคารสถานที่เก็บ',
        'จุดเก็บพัสดุ',
        'จำนวนคงเหลือปัจจุบัน',
        'หน่วยนับ',
        'เกณฑ์ขั้นต่ำเตือนภัย',
        'อัปเดตล่าสุด'
      ];
      rows = filteredRemaining.map((p, idx) => [
        String(idx + 1),
        p.code,
        p.name,
        p.category,
        p.building || '-',
        p.location || '-',
        String(p.quantity),
        p.unit,
        String(p.minStock),
        p.updatedAt
      ]);
    }

    // Map rows into clean CSV
    const csvContent = bom + [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map(r => r.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to Export PDF via browser Print Panel with elegant CSS
  const exportToPdf = (type: ReportType) => {
    let title = '';
    let subtitle = '';
    let tableHtml = '';

    if (type === 'INTAKE') {
      title = 'รายงานสรุปการนำเข้าอุปกรณ์พัสดุหอพัก';
      subtitle = `ช่วงวันที่เลือกทำรายการ: ${startDate ? formatThaiDate(startDate) : 'เริ่มต้น'} ถึง ${endDate ? formatThaiDate(endDate) : 'ปัจจุบัน'}`;
      
      const tableRows = filteredIntakes.map((tx, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td>${tx.timestamp}</td>
          <td style="font-family: monospace; font-weight: bold;">${tx.code}</td>
          <td style="font-weight: bold;">${tx.productName}</td>
          <td>${tx.category}</td>
          <td style="text-align: right; font-weight: bold; color: #15803d;">+${tx.quantity}</td>
          <td style="text-align: right; color: #64748b;">${tx.prevQuantity}</td>
          <td style="text-align: right; font-weight: bold;">${tx.newQuantity}</td>
          <td>${tx.operator}</td>
          <td>${tx.note || '-'}</td>
        </tr>
      `).join('');

      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">ลำดับ</th>
              <th style="width: 15%;">วัน-เวลาทำรายการ</th>
              <th style="width: 10%;">รหัสอุปกรณ์</th>
              <th style="width: 25%;">ชื่ออุปกรณ์พัสดุ</th>
              <th style="width: 15%;">หมวดหมู่อุปกรณ์</th>
              <th style="width: 8%; text-align: right;">นำเข้า</th>
              <th style="width: 8%; text-align: right;">คลังก่อนหน้า</th>
              <th style="width: 8%; text-align: right;">คลังล่าสุด</th>
              <th style="width: 12%;">ผู้ทำรายการ</th>
              <th style="width: 10%;">หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="10" style="text-align: center; padding: 20px;">ไม่พบรายการนำเข้าในช่วงเวลาดังกล่าว</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (type === 'WITHDRAW') {
      title = 'รายงานสรุปการเบิกจ่ายอุปกรณ์พัสดุหอพัก';
      
      const filtersDesc = [];
      if (selectedCategory !== 'ALL') filtersDesc.push(`หมวดหมู่: ${selectedCategory}`);
      if (selectedBuilding !== 'ALL') filtersDesc.push(`อาคาร: ${selectedBuilding}`);
      if (operatorSearch.trim() !== '') filtersDesc.push(`ผู้เบิก/ผู้จ่าย: "${operatorSearch}"`);
      const filtersStr = filtersDesc.length > 0 ? ` (${filtersDesc.join(', ')})` : '';

      subtitle = `ช่วงวันที่เบิกจ่าย: ${startDate ? formatThaiDate(startDate) : 'เริ่มต้น'} ถึง ${endDate ? formatThaiDate(endDate) : 'ปัจจุบัน'}${filtersStr}`;
      
      const tableRows = filteredWithdrawals.map((tx, idx) => {
        const pItem = products.find(p => p.code === tx.code);
        return `
          <tr>
            <td style="text-align: center;">${idx + 1}</td>
            <td>${tx.timestamp}</td>
            <td style="font-family: monospace; font-weight: bold;">${tx.code}</td>
            <td style="font-weight: bold;">${tx.productName}</td>
            <td>${tx.category}</td>
            <td>${pItem?.building ? `${pItem.building} (${pItem.location || '-'})` : '-'}</td>
            <td style="text-align: right; font-weight: bold; color: #b45309;">-${tx.quantity}</td>
            <td>${pItem?.unit || 'ชิ้น'}</td>
            <td>${tx.operator}</td>
            <td>${tx.recipient || '-'}</td>
            <td>${tx.note || '-'}</td>
          </tr>
        `;
      }).join('');

      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">ลำดับ</th>
              <th style="width: 13%;">วัน-เวลาเบิกจ่าย</th>
              <th style="width: 10%;">รหัสอุปกรณ์</th>
              <th style="width: 20%;">ชื่ออุปกรณ์พัสดุ</th>
              <th style="width: 12%;">หมวดหมู่อุปกรณ์</th>
              <th style="width: 13%;">อาคารสถานที่เก็บ</th>
              <th style="width: 8%; text-align: right;">จำนวนเบิก</th>
              <th style="width: 5%;">หน่วย</th>
              <th style="width: 10%;">ผู้บันทึกเบิก</th>
              <th style="width: 10%;">ผู้รับพัสดุ</th>
              <th style="width: 10%;">วัตถุประสงค์</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="11" style="text-align: center; padding: 20px;">ไม่พบรายการเบิกจ่ายในช่วงเวลาหรือการกรองดังกล่าว</td></tr>'}
          </tbody>
        </table>
      `;
    } else if (type === 'REMAINING') {
      title = 'รายงานสรุปปริมาณอุปกรณ์พัสดุคงเหลือในคลัง';
      subtitle = `เงื่อนไขสินค้าคงเหลือน้อยกว่าหรือเท่ากับ: ${remainingThreshold} ชิ้น (หมวดหมู่: ${remainingCategory === 'ALL' ? 'ทุกหมวดหมู่' : remainingCategory})`;

      const tableRows = filteredRemaining.map((p, idx) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: bold;">${p.code}</td>
          <td style="font-weight: bold;">${p.name}</td>
          <td>${p.category}</td>
          <td>${p.building || '-'}</td>
          <td>${p.location || '-'}</td>
          <td style="text-align: right; font-weight: bold; color: ${p.quantity === 0 ? '#e11d48' : p.quantity <= p.minStock ? '#b45309' : '#1e293b'};">
            ${p.quantity} ${p.unit}
          </td>
          <td style="text-align: right; color: #64748b;">${p.minStock} ${p.unit}</td>
          <td style="text-align: center;">
            <span style="padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background-color: ${p.quantity === 0 ? '#ffe4e6; color: #be123c;' : p.quantity <= p.minStock ? '#fef3c7; color: #b45309;' : '#f1f5f9; color: #475569;'}">
              ${p.quantity === 0 ? 'สินค้าหมดเกลี้ยง' : p.quantity <= p.minStock ? 'ต่ำกว่าเกณฑ์เตือน' : 'ปกติ'}
            </span>
          </td>
          <td>${p.updatedAt}</td>
        </tr>
      `).join('');

      tableHtml = `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">ลำดับ</th>
              <th style="width: 10%;">รหัสอุปกรณ์</th>
              <th style="width: 25%;">ชื่ออุปกรณ์พัสดุ</th>
              <th style="width: 15%;">หมวดหมู่อุปกรณ์</th>
              <th style="width: 12%;">อาคารสถานที่เก็บ</th>
              <th style="width: 8%;">จุดเก็บพัสดุ</th>
              <th style="width: 12%; text-align: right;">จำนวนคงเหลือ</th>
              <th style="width: 12%; text-align: right;">เกณฑ์ขั้นต่ำสั่งซื้อ</th>
              <th style="width: 13%; text-align: center;">สถานะ</th>
              <th style="width: 13%;">อัปเดตล่าสุด</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="10" style="text-align: center; padding: 20px;">ไม่พบรายการพัสดุคงเหลือที่ตรงตามเงื่อนไขด้านบน</td></tr>'}
          </tbody>
        </table>
      `;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('กรุณาเปิดการอนุญาต Pop-up บนเบราว์เซอร์ของคุณเพื่อเรียกดูรายงาน PDF');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap');
            body { 
              font-family: 'Sarabun', 'Inter', sans-serif; 
              padding: 40px; 
              color: #1e293b; 
              font-size: 11px;
              line-height: 1.5;
            }
            .header-container {
              border-bottom: 2px solid #334155;
              padding-bottom: 12px;
              margin-bottom: 24px;
            }
            .title { 
              font-size: 18px; 
              font-weight: 800; 
              color: #1e293b; 
              text-align: center; 
              margin: 0 0 4px 0;
            }
            .subtitle { 
              font-size: 11px; 
              color: #475569; 
              text-align: center; 
              margin: 0;
              font-weight: 600;
            }
            .meta-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 16px;
              color: #64748b;
              font-size: 10px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 10px; 
              font-size: 10.5px; 
            }
            th, td { 
              border: 1px solid #cbd5e1; 
              padding: 8px 10px; 
              text-align: left; 
              word-break: break-word;
            }
            th { 
              background-color: #f1f5f9; 
              font-weight: 700; 
              color: #1e293b; 
              text-transform: uppercase;
              font-size: 11px;
            }
            tr:nth-child(even) { 
              background-color: #f8fafc; 
            }
            .footer-signature {
              margin-top: 60px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              font-size: 11px;
            }
            .signature-box {
              text-align: center;
              width: 250px;
            }
            .signature-line {
              border-bottom: 1px dashed #94a3b8;
              margin-bottom: 8px;
              height: 40px;
            }
            .system-credit {
              margin-top: 40px;
              text-align: center;
              font-size: 9px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
            }
            @media print {
              body { padding: 10px; }
              thead { display: table-header-group; }
              tr { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1 class="title">${title}</h1>
            <p class="subtitle">${subtitle}</p>
          </div>
          
          <div class="meta-info">
            <div><strong>หน่วยงาน:</strong> สำนักงานหอพักและคลังพัสดุสโตร์</div>
            <div><strong>วันที่พิมพ์รายงาน:</strong> ${new Date().toLocaleDateString('th-TH')} เวลา ${new Date().toLocaleTimeString('th-TH')} น.</div>
          </div>

          ${tableHtml}

          <div class="footer-signature">
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>ลงชื่อ........................................................................</p>
              <p>( ผู้ตรวจสอบรายงาน )</p>
              <p>ตำแหน่ง: ..............................................................</p>
            </div>
            
            <div class="signature-box">
              <div class="signature-line"></div>
              <p>ลงชื่อ........................................................................</p>
              <p>( ผู้ลงบันทึกข้อมูลคลังพัสดุ )</p>
              <p>ตำแหน่ง: ..............................................................</p>
            </div>
          </div>

          <div class="system-credit">
            จัดทำและอนุมัติพิมพ์โดยระบบจัดการฐานข้อมูลสโตร์หอพักกลาง
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="reports-tab-content" className="space-y-6">
      
      {/* 1. Header Overview Tab Section */}
      <div id="reports-header" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">ระบบรายงานสถิติคลังและพิมพ์เอกสาร (Stock Reports & Exports)</h2>
          <p className="text-sm text-slate-500 mt-1">
            สร้างสรุปรายงานวิเคราะห์พัสดุแยกตามความต้องการ กรองวันที่ ข้อมูล และเขียนส่งออกไปยัง Excel หรือพิมพ์ PDF สำหรับลงนามรับรอง
          </p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setActiveReport('INTAKE')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeReport === 'INTAKE' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📥 รายงานนำเข้าอุปกรณ์
          </button>
          <button
            onClick={() => setActiveReport('WITHDRAW')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeReport === 'WITHDRAW' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📤 รายงานเบิกจ่ายอุปกรณ์
          </button>
          <button
            onClick={() => setActiveReport('REMAINING')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeReport === 'REMAINING' ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' : 'text-slate-600 hover:text-slate-900'}`}
          >
            📦 รายงานอุปกรณ์คงเหลือ
          </button>
        </div>
      </div>

      {/* 2. Primary Filters Block & Main Table for Active Report */}
      
      {/* REPORT TYPE 1: INTAKE */}
      {activeReport === 'INTAKE' && (
        <div id="report-intake-section" className="space-y-6 animate-in fade-in duration-200">
          
          {/* Filters Area */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar className="h-4.5 w-4.5 text-indigo-600" /> ค้นหาและกรองข้อมูลรายงานนำเข้า
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ถึงวันที่</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                />
              </div>
              <div>
                <button
                  onClick={() => triggerExportConfirmation('INTAKE')}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
                >
                  <Download className="h-4 w-4" /> ส่งออกรายงานนำเข้า
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนครั้งที่บันทึกนำเข้า</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{filteredIntakes.length} รายการ</p>
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">ยอดจำนวนรวมที่นำเข้าคลัง</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {filteredIntakes.reduce((acc, curr) => acc + curr.quantity, 0)} ชิ้น/หน่วย
                </p>
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">อุปกรณ์ต่างชนิดที่นำเข้า</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {new Set(filteredIntakes.map(tx => tx.code)).size} รายการ
                </p>
              </div>
            </div>
          </div>

          {/* Beautiful Main Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">ตารางข้อมูลรายการนำเข้าทั้งหมด</h4>
              <span className="text-xs text-slate-400 font-semibold">พบข้อมูล {filteredIntakes.length} รายการ</span>
            </div>
            {filteredIntakes.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Info className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold">ไม่พบข้อมูลรายงานนำเข้าอุปกรณ์ตามเงื่อนไขวันที่เลือก</p>
                <p className="text-xs text-slate-400 mt-1">กรุณาเลือกช่วงเวลาใหม่อีกครั้ง</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 text-center w-14">ลำดับ</th>
                      <th className="p-4">วัน-เวลาบันทึก</th>
                      <th className="p-4">รหัสอุปกรณ์</th>
                      <th className="p-4">ชื่ออุปกรณ์พัสดุ</th>
                      <th className="p-4">หมวดหมู่อุปกรณ์</th>
                      <th className="p-4 text-right">จำนวนนำเข้า</th>
                      <th className="p-4 text-right">ยอดก่อนหน้า</th>
                      <th className="p-4 text-right">ยอดล่าสุด</th>
                      <th className="p-4 pl-6">ผู้บันทึกรายการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIntakes.map((tx, idx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-4 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                        <td className="p-4 text-xs font-semibold text-slate-600 font-mono">{tx.timestamp}</td>
                        <td className="p-4"><span className="text-xs bg-slate-100 text-slate-600 font-bold font-mono px-1.5 py-0.5 rounded">{tx.code}</span></td>
                        <td className="p-4 font-bold text-slate-800">{tx.productName}</td>
                        <td className="p-4 text-xs text-slate-500 font-semibold">{tx.category}</td>
                        <td className="p-4 text-right font-bold text-emerald-600">+{tx.quantity}</td>
                        <td className="p-4 text-right text-slate-400 font-semibold">{tx.prevQuantity}</td>
                        <td className="p-4 text-right font-bold text-slate-700">{tx.newQuantity}</td>
                        <td className="p-4 pl-6 text-xs text-slate-500 font-semibold">{tx.operator}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT TYPE 2: WITHDRAW */}
      {activeReport === 'WITHDRAW' && (
        <div id="report-withdraw-section" className="space-y-6 animate-in fade-in duration-200">
          
          {/* Filters Area */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Filter className="h-4.5 w-4.5 text-indigo-600" /> ค้นหาและกรองรายงานประวัติการเบิกจ่าย
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ถึงวันที่</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">หมวดหมู่อุปกรณ์</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium cursor-pointer"
                >
                  <option value="ALL">ทุกหมวดหมู่สินค้าอุปกรณ์</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">อาคารที่เก็บอุปกรณ์</label>
                <select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium cursor-pointer"
                >
                  <option value="ALL">ทุกอาคารสถานที่</option>
                  {uniqueBuildings.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">ชื่อผู้ดำเนินการเบิก หรือ ผู้รับอุปกรณ์</label>
                <div className="relative">
                  <input
                    type="text"
                    value={operatorSearch}
                    onChange={(e) => setOperatorSearch(e.target.value)}
                    placeholder="พิมพ์ชื่อค้นหา (เช่น สมศรี, สตาฟ)..."
                    className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="h-4.5 w-4.5" />
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => triggerExportConfirmation('WITHDRAW')}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
                >
                  <Download className="h-4 w-4" /> ส่งออกรายงานเบิกจ่าย
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนครั้งการเบิกจ่าย</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">{filteredWithdrawals.length} รายการ</p>
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                <ArrowDownRight className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนชิ้นรวมที่ตัดออกจากคลัง</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {filteredWithdrawals.reduce((acc, curr) => acc + curr.quantity, 0)} ชิ้น/หน่วย
                </p>
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">อาคารจัดส่งพัสดุ</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {new Set(filteredWithdrawals.map(tx => products.find(p => p.code === tx.code)?.building).filter(Boolean)).size} อาคาร
                </p>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">ตารางสรุปรายงานการเบิกจ่ายอุปกรณ์</h4>
              <span className="text-xs text-slate-400 font-semibold">พบข้อมูลทั้งหมด {filteredWithdrawals.length} รายการ</span>
            </div>
            {filteredWithdrawals.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Info className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold">ไม่พบข้อมูลประวัติเบิกจ่ายตามเงื่อนไขที่ค้นหา</p>
                <p className="text-xs text-slate-400 mt-1">ทดลองเปลี่ยนการกรอง วันที่ หรืออาคารสถานที่ใหม่อีกครั้ง</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 text-center w-14">ลำดับ</th>
                      <th className="p-4">วัน-เวลาเบิกจ่าย</th>
                      <th className="p-4">รหัสพัสดุ</th>
                      <th className="p-4">ชื่ออุปกรณ์พัสดุ</th>
                      <th className="p-4">หมวดหมู่</th>
                      <th className="p-4">อาคารสถานที่</th>
                      <th className="p-4 text-right">จำนวนเบิก</th>
                      <th className="p-4">หน่วย</th>
                      <th className="p-4">ผู้สตาฟบันทึก</th>
                      <th className="p-4">ผู้รับอุปกรณ์</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWithdrawals.map((tx, idx) => {
                      const pItem = products.find(p => p.code === tx.code);
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                          <td className="p-4 text-xs font-semibold text-slate-600 font-mono">{tx.timestamp}</td>
                          <td className="p-4"><span className="text-xs bg-slate-100 text-slate-600 font-bold font-mono px-1.5 py-0.5 rounded">{tx.code}</span></td>
                          <td className="p-4 font-bold text-slate-800">{tx.productName}</td>
                          <td className="p-4 text-xs text-slate-400 font-semibold">{tx.category}</td>
                          <td className="p-4 text-xs font-medium text-slate-500">
                            {pItem?.building ? `${pItem.building} (${pItem.location || '-'})` : '-'}
                          </td>
                          <td className="p-4 text-right font-bold text-amber-600">-{tx.quantity}</td>
                          <td className="p-4 text-xs text-slate-400 font-medium">{pItem?.unit || 'ชิ้น'}</td>
                          <td className="p-4 text-xs text-slate-500 font-semibold">{tx.operator}</td>
                          <td className="p-4 text-xs font-bold text-indigo-700">{tx.recipient || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REPORT TYPE 3: REMAINING STOCK */}
      {activeReport === 'REMAINING' && (
        <div id="report-remaining-section" className="space-y-6 animate-in fade-in duration-200">
          
          {/* Filters Area */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertTriangle className="h-4.5 w-4.5 text-rose-500 animate-pulse" /> ตรวจสอบอุปกรณ์พัสดุและวิเคราะห์ยอดคงเหลือต่ำ
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  ระบุยอดจำนวนพัสดุคงเหลือต่ำกว่าหรือเท่ากับ (Threshold)
                </label>
                <input
                  type="number"
                  min="0"
                  value={remainingThreshold}
                  onChange={(e) => setRemainingThreshold(Number(e.target.value))}
                  placeholder="ระบุตัวเลขจำนวน..."
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">หมวดหมู่อุปกรณ์</label>
                <select
                  value={remainingCategory}
                  onChange={(e) => setRemainingCategory(e.target.value)}
                  className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-medium cursor-pointer"
                >
                  <option value="ALL">ทุกหมวดหมู่สินค้าอุปกรณ์</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  onClick={() => triggerExportConfirmation('REMAINING')}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer active:scale-98"
                >
                  <Download className="h-4 w-4" /> ส่งออกรายงานคงเหลือ
                </button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-red-50 text-red-600 rounded-lg shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">จำนวนอุปกรณ์ที่เหลือน้อย</p>
                <p className="text-xl font-bold text-red-700 mt-0.5">{filteredRemaining.length} รายการ</p>
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                <X className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">ของหมดคลังทั้งหมด (Out-of-Stock)</p>
                <p className="text-xl font-bold text-rose-800 mt-0.5">
                  {filteredRemaining.filter(p => p.quantity === 0).length} รายการ
                </p>
              </div>
            </div>
            <div className="bg-white p-4.5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">ของพร้อมใช้งานรวมในคลัง</p>
                <p className="text-xl font-bold text-emerald-800 mt-0.5">
                  {filteredRemaining.reduce((acc, curr) => acc + curr.quantity, 0)} ชิ้น
                </p>
              </div>
            </div>
          </div>

          {/* Table Area */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-sm">ตารางข้อมูลพัสดุและสต็อกคงเหลือระดับต่ำกว่าเกณฑ์กำหนด</h4>
              <span className="text-xs text-slate-400 font-semibold">ตรงตามเงื่อนไข {filteredRemaining.length} อุปกรณ์</span>
            </div>
            {filteredRemaining.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Info className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-semibold">ไม่มีอุปกรณ์ใดที่มีจำนวนคงเหลือน้อยกว่าเงื่อนไขที่กำหนด</p>
                <p className="text-xs text-slate-400 mt-1">คลังมีความปลอดภัยในส่วนของเกณฑ์ขั้นต่ำนี้</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                      <th className="p-4 text-center w-14">ลำดับ</th>
                      <th className="p-4">รหัสพัสดุ</th>
                      <th className="p-4">ชื่ออุปกรณ์พัสดุ</th>
                      <th className="p-4">หมวดหมู่อุปกรณ์</th>
                      <th className="p-4">อาคารจัดเก็บ</th>
                      <th className="p-4">จุดเก็บพัสดุ</th>
                      <th className="p-4 text-right">จำนวนคงเหลือ</th>
                      <th className="p-4 text-right">เกณฑ์ขั้นต่ำแจ้งสั่งซื้อ</th>
                      <th className="p-4 text-center">สถานะสต็อก</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRemaining.map((p, idx) => {
                      const isOutOfStock = p.quantity === 0;
                      const isWarning = p.quantity <= p.minStock;
                      return (
                        <tr key={p.code} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                          <td className="p-4"><span className="text-xs bg-slate-100 text-slate-600 font-bold font-mono px-1.5 py-0.5 rounded">{p.code}</span></td>
                          <td className="p-4 font-bold text-slate-800">{p.name}</td>
                          <td className="p-4 text-xs text-slate-500 font-semibold">{p.category}</td>
                          <td className="p-4 text-xs text-slate-400 font-medium">{p.building || '-'}</td>
                          <td className="p-4 text-xs text-slate-400 font-mono font-medium">{p.location || '-'}</td>
                          <td className="p-4 text-right font-extrabold text-slate-800">{p.quantity} {p.unit}</td>
                          <td className="p-4 text-right text-slate-400 font-bold text-xs">{p.minStock} {p.unit}</td>
                          <td className="p-4 text-center">
                            {isOutOfStock ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                                สินค้าหมดเกลี้ยง
                              </span>
                            ) : isWarning ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
                                ต่ำกว่าเกณฑ์เตือน
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                ปกติ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PREMIUM MODERN CONFIRMATION MODAL FOR EXPORT */}
      {isExportModalOpen && pendingExportType && (
        <div id="export-confirmation-modal" className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-250">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-6 text-white relative">
              <button 
                onClick={() => setIsExportModalOpen(false)}
                className="absolute top-4 right-4 p-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-extrabold text-lg flex items-center gap-2">
                <Download className="h-5 w-5 animate-bounce" /> เลือกรูปแบบการส่งออกรายงาน
              </h3>
              <p className="text-xs text-indigo-100 mt-1">
                คุณกำลังจะดึงรายงาน: <span className="font-bold underline">
                  {pendingExportType === 'INTAKE' ? 'รายงานการนำเข้าพัสดุ' : pendingExportType === 'WITHDRAW' ? 'รายงานการเบิกจ่ายพัสดุ' : 'รายงานอุปกรณ์พัสดุคงเหลือ'}
                </span>
              </p>
            </div>

            {/* Modal Content - Elegant Choice Cards */}
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-500">กรุณาเลือกรูปแบบเอกสารที่คุณต้องการเพื่อจัดทำสถิติหรือจัดพริ้นต์ลงนาม:</p>
              
              <div className="grid grid-cols-1 gap-3">
                
                {/* Format 1: EXCEL (CSV) */}
                <button
                  type="button"
                  onClick={() => handleExportConfirm('EXCEL')}
                  className="flex items-center gap-4 p-4 border border-slate-200 hover:border-emerald-300 bg-slate-50 hover:bg-emerald-50/40 rounded-2xl text-left transition-all cursor-pointer group active:scale-98"
                >
                  <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl group-hover:scale-105 transition-all">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-emerald-900 transition-colors">ส่งออกไฟล์ข้อมูล Excel (.csv)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">รองรับสูตร คัดลอกเปิดใน Excel/Sheets ภาษาไทยสมบูรณ์แบบไม่เพี้ยน</p>
                  </div>
                </button>

                {/* Format 2: PDF (Print) */}
                <button
                  type="button"
                  onClick={() => handleExportConfirm('PDF')}
                  className="flex items-center gap-4 p-4 border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50/40 rounded-2xl text-left transition-all cursor-pointer group active:scale-98"
                >
                  <div className="p-3 bg-rose-100 text-rose-700 rounded-xl group-hover:scale-105 transition-all">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-rose-900 transition-colors">ส่งออกพิมพ์เอกสาร PDF (.pdf)</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">จัดรูปแบบรายงานทางการสวยงาม จัดหน้าสำหรับการเซ็นรับรองและสั่งพิมพ์</p>
                  </div>
                </button>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex gap-2 justify-end border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
