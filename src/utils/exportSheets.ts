/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Transaction, User } from '../types';

/**
 * Format a Date object to Thai display string (e.g., "20 กรกฎาคม 2569 19:48 น.")
 */
export const formatThaiExportDate = (date: Date): string => {
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543;
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day} ${month} พ.ศ. ${year} เวลา ${hours}:${minutes}:${seconds} น.`;
};

/**
 * Common CSS Styles for Google Sheets emulation in Excel
 */
const getExcelStyles = () => `
  <style>
    body {
      font-family: 'Sarabun', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 30px;
    }
    th, td {
      border: 1px solid #cbd5e1 !important;
      padding: 10px 12px;
      font-size: 13px;
      vertical-align: middle;
    }
    th {
      background-color: #0F9D58 !important;
      color: #ffffff !important;
      font-weight: bold;
      text-align: left;
    }
    .header-banner {
      background-color: #1b4332 !important;
      color: #ffffff !important;
      font-size: 18px;
      font-weight: bold;
      padding: 15px;
      text-align: center;
      border: 1px solid #1b4332 !important;
    }
    .meta-row {
      background-color: #f8fafc !important;
      font-size: 12px;
      color: #475569 !important;
      padding: 8px 12px;
      font-weight: bold;
    }
    .zebra-even {
      background-color: #f8fafc !important;
    }
    .text-center {
      text-align: center !important;
    }
    .text-right {
      text-align: right !important;
    }
    .font-mono {
      font-family: 'Courier New', Courier, monospace !important;
      font-weight: bold;
    }
    .badge-intake {
      color: #15803d !important;
      font-weight: bold;
    }
    .badge-withdraw {
      color: #b45309 !important;
      font-weight: bold;
    }
    .title-cell {
      font-size: 16px;
      font-weight: bold;
      color: #0f9d58;
      padding: 10px 0;
    }
  </style>
`;

/**
 * Trigger file download for generated spreadsheet content
 */
const downloadExcelFile = (htmlContent: string, fileName: string) => {
  const bom = '\uFEFF'; // UTF-8 Byte Order Mark for Excel Thai language support
  const blob = new Blob([bom + htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * 1. Export All Database Tables (Products, Transactions, Users) to a single Google Sheets styled spreadsheet
 */
export const exportAllDatabaseToSheets = (
  products: Product[],
  transactions: Transaction[],
  users: User[]
) => {
  const exportTimeStr = formatThaiExportDate(new Date());
  
  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      ${getExcelStyles()}
    </head>
    <body>
      <!-- Global Banner -->
      <table>
        <tr>
          <td colspan="9" class="header-banner">
            แผ่นงานจำลองฐานข้อมูลหอพัก (Google Sheets Format Backup)
          </td>
        </tr>
        <tr>
          <td colspan="9" class="meta-row">
            วันที่ส่งออกข้อมูลหลัก: ${exportTimeStr} | บัญชีผู้ใช้งานระบบ: สปอนเซอร์หอพักกลาง
          </td>
        </tr>
      </table>

      <!-- TABLE 1: PRODUCTS INVENTORY -->
      <div class="title-cell">📊 รายการพัสดุทั้งหมดในคลัง (Inventory Stock)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">ลำดับ</th>
            <th class="text-center" style="width: 100px;">รหัสอุปกรณ์</th>
            <th style="width: 250px;">ชื่ออุปกรณ์พัสดุ</th>
            <th style="width: 150px;">หมวดหมู่อุปกรณ์</th>
            <th class="text-center" style="width: 120px;">อาคารสถานที่จัดเก็บ</th>
            <th class="text-center" style="width: 100px;">จุดวางพัสดุ</th>
            <th class="text-right" style="width: 100px;">คงเหลือปัจจุบัน</th>
            <th class="text-center" style="width: 80px;">หน่วยนับ</th>
            <th class="text-right" style="width: 100px;">เกณฑ์แจ้งเตือน</th>
          </tr>
        </thead>
        <tbody>
          ${products.map((p, idx) => `
            <tr class="${idx % 2 === 1 ? 'zebra-even' : ''}">
              <td class="text-center">${idx + 1}</td>
              <td class="text-center font-mono">${p.code}</td>
              <td style="font-weight: bold;">${p.name}</td>
              <td>${p.category}</td>
              <td class="text-center">${p.building || '-'}</td>
              <td class="text-center">${p.location || '-'}</td>
              <td class="text-right font-mono" style="color: ${p.quantity === 0 ? '#dc2626' : p.quantity <= p.minStock ? '#d97706' : '#0f172a'}">${p.quantity}</td>
              <td class="text-center">${p.unit}</td>
              <td class="text-right font-mono" style="color: #64748b;">${p.minStock}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TABLE 2: TRANSACTION HISTORY -->
      <div class="title-cell">🔄 ประวัติธุรกรรมเคลื่อนไหวล่าสุด (Transaction Logs)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">ลำดับ</th>
            <th class="text-center" style="width: 150px;">วัน-เวลาบันทึกรายการ</th>
            <th class="text-center" style="width: 100px;">รหัสพัสดุ</th>
            <th style="width: 200px;">ชื่ออุปกรณ์พัสดุ</th>
            <th style="width: 120px;">หมวดหมู่</th>
            <th class="text-center" style="width: 80px;">ประเภท</th>
            <th class="text-right" style="width: 80px;">จำนวน</th>
            <th class="text-center" style="width: 100px;">ผู้ทำรายการ</th>
            <th style="width: 150px;">ผู้รับอุปกรณ์ / หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map((tx, idx) => `
            <tr class="${idx % 2 === 1 ? 'zebra-even' : ''}">
              <td class="text-center">${idx + 1}</td>
              <td class="text-center font-mono">${tx.timestamp}</td>
              <td class="text-center font-mono">${tx.code}</td>
              <td style="font-weight: bold;">${tx.productName}</td>
              <td>${tx.category}</td>
              <td class="text-center font-mono ${tx.type === 'INTAKE' ? 'badge-intake' : 'badge-withdraw'}">
                ${tx.type === 'INTAKE' ? 'นำเข้า' : 'เบิกจ่าย'}
              </td>
              <td class="text-right font-mono ${tx.type === 'INTAKE' ? 'badge-intake' : 'badge-withdraw'}">
                ${tx.type === 'INTAKE' ? '+' : '-'}${tx.quantity}
              </td>
              <td>${tx.operator}</td>
              <td>${tx.recipient ? `ผู้รับ: ${tx.recipient}` : ''} ${tx.note ? `(${tx.note})` : ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- TABLE 3: USERS LIST -->
      <div class="title-cell">👥 สมาชิกผู้ดูแลระบบและเจ้าหน้าที่ (System Users)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 50px;">ลำดับ</th>
            <th style="width: 150px;">ชื่อผู้ใช้งาน (Username)</th>
            <th style="width: 250px;">ชื่อ-นามสกุลเต็ม</th>
            <th class="text-center" style="width: 150px;">ตำแหน่ง (Role)</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u, idx) => `
            <tr class="${idx % 2 === 1 ? 'zebra-even' : ''}">
              <td class="text-center">${idx + 1}</td>
              <td class="font-mono">${u.username}</td>
              <td style="font-weight: bold;">${u.fullName}</td>
              <td class="text-center font-mono">${u.role}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const fileName = `ฐานข้อมูลหอพักสัญชาติ_GoogleSheets_${new Date().toISOString().substring(0, 10)}.xls`;
  downloadExcelFile(html, fileName);
};

/**
 * 2. Export A Custom Report (Intake / Withdraw / Remaining) styled as Google Sheets with export date
 */
export const exportReportToGoogleSheets = (
  reportType: 'INTAKE' | 'WITHDRAW' | 'REMAINING',
  reportTitle: string,
  subtitle: string,
  headers: string[],
  rows: string[][],
  unitColIndex?: number,
  quantityColIndex?: number
) => {
  const exportTimeStr = formatThaiExportDate(new Date());

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      ${getExcelStyles()}
    </head>
    <body>
      <table>
        <tr>
          <td colspan="${headers.length}" class="header-banner">
            ${reportTitle}
          </td>
        </tr>
        <tr>
          <td colspan="${headers.length}" class="meta-row">
            ${subtitle} | วันที่ส่งออกรายงาน: ${exportTimeStr}
          </td>
        </tr>
      </table>

      <table>
        <thead>
          <tr>
            ${headers.map((h, idx) => {
              const alignClass = idx === 0 ? 'text-center' : (h.includes('จำนวน') || h.includes('คงเหลือ') || h.includes('เกณฑ์') ? 'text-right' : '');
              return `<th class="${alignClass}">${h}</th>`;
            }).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, rIdx) => `
            <tr class="${rIdx % 2 === 1 ? 'zebra-even' : ''}">
              ${row.map((cell, cIdx) => {
                let cellClass = '';
                let cellStyle = '';
                
                // Alignments
                if (cIdx === 0) cellClass = 'text-center';
                else if (headers[cIdx].includes('รหัส') || headers[cIdx].includes('วัน-เวลา')) cellClass = 'font-mono text-center';
                else if (headers[cIdx].includes('จำนวน') || headers[cIdx].includes('คลังก่อนหน้า') || headers[cIdx].includes('คลังล่าสุด') || headers[cIdx].includes('คงเหลือ') || headers[cIdx].includes('เกณฑ์')) {
                  cellClass = 'text-right font-mono';
                  // Add beautiful text colors for report transactions
                  if (reportType === 'INTAKE' && headers[cIdx].includes('จำนวนนำเข้า')) {
                    cellStyle = 'color: #15803d; font-weight: bold;';
                  } else if (reportType === 'WITHDRAW' && headers[cIdx].includes('จำนวนเบิก')) {
                    cellStyle = 'color: #b45309; font-weight: bold;';
                  }
                }

                return `<td class="${cellClass}" style="${cellStyle}">${cell}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const safeTitle = reportTitle.replace(/\s+/g, '_');
  const fileName = `รายงาน_${safeTitle}_${new Date().toISOString().substring(0, 10)}.xls`;
  downloadExcelFile(html, fileName);
};
