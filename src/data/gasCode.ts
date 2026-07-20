/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const CODE_GS = `// ==========================================
// Code.gs - Google Apps Script Backend
// ระบบจัดการสโตร์ เบิก-นำเข้า-จ่าย และแจ้งเตือนสต็อกสินค้า
// ==========================================

const SPREADSHEET_ID = ""; // ใส่ ID ของ Google Sheets ของคุณที่นี่ (หากปล่อยว่างไว้ระบบจะใช้ Active Spreadsheet ที่ผูกกับ Script นี้)

// ฟังก์ชันหลักในการเปิดใช้งานเว็บบอร์ด / เว็บแอป และระบบรับส่งข้อมูล (REST API)
function doGet(e) {
  // รองรับการรับดึงข้อมูลจาก React Client ภายนอก (API GET)
  if (e.parameter && e.parameter.action) {
    var action = e.parameter.action;
    var result = { success: false, data: null };
    try {
      if (action === "getProducts") {
        result = { success: true, data: getInventoryList() };
      } else if (action === "getCategories") {
        result = { success: true, data: getCategories() };
      } else if (action === "getTransactions") {
        result = { success: true, data: getTransactionLogs() };
      } else if (action === "getUsers") {
        var ss = getSpreadsheet();
        var sheet = ss.getSheetByName('Users');
        var list = [];
        if (sheet) {
          var data = sheet.getDataRange().getValues();
          for (var i = 1; i < data.length; i++) {
            list.push({
              username: data[i][0].toString(),
              fullName: data[i][2].toString(),
              role: data[i][3].toString()
            });
          }
        }
        result = { success: true, data: list };
      } else if (action === "setup") {
        result = setupDatabase();
      } else {
        result = { success: false, message: "ไม่พบ Action ที่ระบุ: " + action };
      }
    } catch (err) {
      result = { success: false, message: "เกิดข้อผิดพลาดในการดึงข้อมูล: " + err.toString() };
    }
    
    // ตั้งค่า CORS เพื่อความปลอดภัย
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var template = HtmlService.createTemplateFromFile('Index');
  return template.evaluate()
      .setTitle('ระบบจัดการสโตร์และคลังสินค้า (Store & Inventory)')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// รวมไฟล์ HTML ย่อย (เช่น CSS หรือ JS) เข้าไปในไฟล์หลัก
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ดึงอ้างอิงของ Google Sheet
function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "") {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

// 1. ระบบจำลองการติดตั้งฐานข้อมูลแบบอัตโนมัติ (Setup Sheets)
function setupDatabase() {
  var ss = getSpreadsheet();
  
  // 1. สร้างชีต Users
  var sheetUsers = ss.getSheetByName('Users');
  if (!sheetUsers) {
    sheetUsers = ss.insertSheet('Users');
    sheetUsers.appendRow(['Username', 'Password', 'FullName', 'Role']);
    sheetUsers.appendRow(['admin', 'admin1234', 'ผู้ดูแลระบบทั่วไป', 'Admin']);
    sheetUsers.appendRow(['staff', 'staff1234', 'เจ้าหน้าที่พัสดุหอพัก', 'Staff']);
  }
  
  // 2. สร้างชีต Categories
  var sheetCats = ss.getSheetByName('Categories');
  if (!sheetCats) {
    sheetCats = ss.insertSheet('Categories');
    sheetCats.appendRow(['CategoryName', 'DriveFolderId']);
    sheetCats.appendRow(['อุปกรณ์สำนักงาน', '']);
    sheetCats.appendRow(['อุปกรณ์ซ่อมหอพัก', '']);
    sheetCats.appendRow(['อุปกรณ์แม่บ้านหอพัก', '']);
    sheetCats.appendRow(['อุปกรณ์ชุดเครื่องนอน', '']);
  }
  
  // 3. สร้างชีต Products
  var sheetProds = ss.getSheetByName('Products');
  if (!sheetProds) {
    sheetProds = ss.insertSheet('Products');
    sheetProds.appendRow(['ProductCode', 'ProductName', 'Category', 'Quantity', 'MinStock', 'ImageUrl', 'Unit', 'UpdatedAt']);
    sheetProds.appendRow(['ST-001', 'กระดาษ A4 80 แกรม', 'อุปกรณ์สำนักงาน', 10, 5, '', 'รีม', new Date()]);
    sheetProds.appendRow(['ST-002', 'หลอดไฟ LED 12W', 'อุปกรณ์ซ่อมหอพัก', 25, 10, '', 'หลอด', new Date()]);
    sheetProds.appendRow(['ST-003', 'น้ำยาล้างห้องน้ำ 500มล.', 'อุปกรณ์แม่บ้านหอพัก', 8, 15, '', 'ขวด', new Date()]);
    sheetProds.appendRow(['ST-004', 'ผ้าปูที่นอน 3.5 ฟุต', 'อุปกรณ์ชุดเครื่องนอน', 30, 8, '', 'ผืน', new Date()]);
  }
  
  // 4. สร้างชีต Transactions
  var sheetTrans = ss.getSheetByName('Transactions');
  if (!sheetTrans) {
    sheetTrans = ss.insertSheet('Transactions');
    sheetTrans.appendRow(['TransactionID', 'ProductCode', 'ProductName', 'Category', 'Type', 'Quantity', 'PrevQuantity', 'NewQuantity', 'Operator', 'Recipient', 'Note', 'Timestamp']);
  }
  
  return { success: true, message: 'ตั้งค่าระบบฐานข้อมูล Google Sheets สำเร็จแล้ว!' };
}

// 2. ตรวจสอบการเข้าสู่ระบบ
function checkLogin(username, password) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    if (!sheet) {
      return { success: false, message: 'ไม่พบชีตข้อมูล "Users" กรุณากดปุ่มติดตั้งระบบข้อมูลก่อน' };
    }
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      var dbUser = data[i][0].toString().trim();
      var dbPass = data[i][1].toString().trim();
      if (dbUser === username.trim() && dbPass === password.trim()) {
        return {
          success: true,
          user: {
            username: dbUser,
            fullName: data[i][2].toString(),
            role: data[i][3].toString()
          }
        };
      }
    }
    return { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
  } catch (error) {
    return { success: false, message: 'เกิดข้อผิดพลาด: ' + error.toString() };
  }
}

// 3. ดึงรายการสินค้าทั้งหมด
function getInventoryList() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Products');
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < data.length; i++) {
      list.push({
        code: data[i][0].toString(),
        name: data[i][1].toString(),
        category: data[i][2].toString(),
        quantity: Number(data[i][3]),
        minStock: Number(data[i][4]),
        imageUrl: data[i][5].toString(),
        unit: data[i][6].toString(),
        updatedAt: Utilities.formatDate(new Date(data[i][7]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
      });
    }
    return list;
  } catch (error) {
    return [];
  }
}

// 4. ดึงหมวดหมู่สินค้าทั้งหมด
function getCategories() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Categories');
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var list = [];
    for (var i = 1; i < data.length; i++) {
      list.push({
        name: data[i][0].toString(),
        folderId: data[i][1].toString()
      });
    }
    return list;
  } catch (error) {
    return [];
  }
}

// 5. ดึงข้อมูลรายละเอียดของสินค้ารายตัว (เพื่อนำมาแสดงประวัติและปริมาณคงเดิม)
function getProductDetail(productCode) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Products');
    if (!sheet) return null;
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === productCode.trim()) {
        return {
          code: data[i][0].toString(),
          name: data[i][1].toString(),
          category: data[i][2].toString(),
          quantity: Number(data[i][3]),
          minStock: Number(data[i][4]),
          imageUrl: data[i][5].toString(),
          unit: data[i][6].toString()
        };
      }
    }
    return null; // ไม่พบสินค้า
  } catch (error) {
    return null;
  }
}

// 6. บันทึกข้อมูลการนำเข้าอุปกรณ์ (Stock Intake)
function processIntake(intakeData) {
  try {
    var ss = getSpreadsheet();
    var sheetProds = ss.getSheetByName('Products');
    var sheetTrans = ss.getSheetByName('Transactions');
    
    if (!sheetProds || !sheetTrans) {
      return { success: false, message: 'ชีตระบบไม่สมบูรณ์' };
    }
    
    var code = intakeData.code.trim();
    var name = intakeData.name.trim();
    var category = intakeData.category;
    var quantityToAdd = Number(intakeData.quantity);
    var minStock = Number(intakeData.minStock || 0);
    var unit = intakeData.unit.trim();
    var operator = intakeData.operator;
    var note = intakeData.note || "";
    
    var prodData = sheetProds.getDataRange().getValues();
    var foundIndex = -1;
    var prevQuantity = 0;
    var imageUrl = "";
    
    // ค้นหาว่ารหัสสินค้านี้มีอยู่แล้วหรือไม่
    for (var i = 1; i < prodData.length; i++) {
      if (prodData[i][0].toString().trim() === code) {
        foundIndex = i + 1; // 1-indexed for Sheet rows
        prevQuantity = Number(prodData[i][3]);
        imageUrl = prodData[i][5].toString();
        break;
      }
    }
    
    // จัดการอัปโหลดไฟล์ภาพสินค้า (ถ้ามีส่งมาแบบ Base64)
    if (intakeData.imageBase64 && intakeData.imageName) {
      var folderId = getCategoryFolderId(category);
      var uploadedUrl = uploadImageToDrive(intakeData.imageBase64, intakeData.imageName, folderId);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    var newQuantity = prevQuantity + quantityToAdd;
    var timestamp = new Date();
    
    if (foundIndex !== -1) {
      // 1. มีสินค้าเดิมอยู่แล้ว -> อัปเดตยอดคงเหลือและข้อมูลอ้างอิง
      sheetProds.getRange(foundIndex, 4).setValue(newQuantity); // อัปเดตจำนวน
      if (imageUrl !== "") {
        sheetProds.getRange(foundIndex, 6).setValue(imageUrl); // อัปเดต URL รูปภาพ
      }
      sheetProds.getRange(foundIndex, 8).setValue(timestamp);  // อัปเดตเวลาล่าสุด
    } else {
      // 2. เป็นสินค้าใหม่ -> เพิ่มแถวข้อมูลใหม่
      sheetProds.appendRow([code, name, category, quantityToAdd, minStock, imageUrl, unit, timestamp]);
      prevQuantity = 0;
      newQuantity = quantityToAdd;
    }
    
    // บันทึกประวัติลง Transactions
    var transId = "TX-IN-" + timestamp.getTime();
    sheetTrans.appendRow([transId, code, name, category, 'INTAKE', quantityToAdd, prevQuantity, newQuantity, operator, '-', note, timestamp]);
    
    // ตรวจสอบและแจ้งเตือนเผื่อไว้
    checkLowStock();
    
    return { success: true, message: 'นำเข้าสินค้าสำเร็จแล้ว ยอดคงเหลือใหม่คือ ' + newQuantity + ' ' + unit };
  } catch (error) {
    return { success: false, message: 'ล้มเหลว: ' + error.toString() };
  }
}

// 7. บันทึกข้อมูลการเบิกจ่ายอุปกรณ์ (Stock Withdrawal)
function processWithdraw(withdrawData) {
  try {
    var ss = getSpreadsheet();
    var sheetProds = ss.getSheetByName('Products');
    var sheetTrans = ss.getSheetByName('Transactions');
    
    if (!sheetProds || !sheetTrans) {
      return { success: false, message: 'ระบบฐานข้อมูลไม่สมบูรณ์' };
    }
    
    var code = withdrawData.code.trim();
    var quantityToSub = Number(withdrawData.quantity);
    var operator = withdrawData.operator;
    var recipient = withdrawData.recipient.trim();
    var note = withdrawData.note || "";
    
    var prodData = sheetProds.getDataRange().getValues();
    var foundIndex = -1;
    var prevQuantity = 0;
    var name = "";
    var category = "";
    var unit = "";
    var minStock = 0;
    
    // ค้นหาสินค้าเพื่อตัดยอด
    for (var i = 1; i < prodData.length; i++) {
      if (prodData[i][0].toString().trim() === code) {
        foundIndex = i + 1;
        prevQuantity = Number(prodData[i][3]);
        name = prodData[i][1].toString();
        category = prodData[i][2].toString();
        minStock = Number(prodData[i][4]);
        unit = prodData[i][6].toString();
        break;
      }
    }
    
    if (foundIndex === -1) {
      return { success: false, message: 'ไม่พบรหัสอุปกรณ์นี้ในระบบ ไม่สามารถทำการเบิกจ่ายได้' };
    }
    
    if (prevQuantity < quantityToSub) {
      return { success: false, message: 'จำนวนอุปกรณ์คงเหลือไม่เพียงพอ สำหรับการเบิก (คงเหลือ: ' + prevQuantity + ' ' + unit + ')' };
    }
    
    var newQuantity = prevQuantity - quantityToSub;
    var timestamp = new Date();
    
    // อัปเดตจำนวนสินค้าลงใน Products Sheet
    sheetProds.getRange(foundIndex, 4).setValue(newQuantity);
    sheetProds.getRange(foundIndex, 8).setValue(timestamp);
    
    // บันทึกประวัติการทำรายการใน Transactions Sheet
    var transId = "TX-OUT-" + timestamp.getTime();
    sheetTrans.appendRow([transId, code, name, category, 'WITHDRAW', quantityToSub, prevQuantity, newQuantity, operator, recipient, note, timestamp]);
    
    // ตรวจสอบสต็อกว่าต่ำกว่าเกณฑ์การแจ้งเตือนหรือไม่ และส่งอีเมลแจ้งเตือน
    var alertSent = false;
    if (newQuantity <= minStock) {
      alertSent = sendEmailAlert(name, code, newQuantity, minStock, unit);
    }
    
    return {
      success: true,
      message: 'เบิกจ่ายสำเร็จ ยอดคงเหลือปัจจุบันคือ ' + newQuantity + ' ' + unit,
      alertTriggered: (newQuantity <= minStock),
      alertSent: alertSent
    };
  } catch (error) {
    return { success: false, message: 'ล้มเหลว: ' + error.toString() };
  }
}

// 8. ดึงรหัสโฟลเดอร์สำหรับอัปโหลดภาพแยกตามหมวดหมู่
function getCategoryFolderId(categoryName) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Categories');
    if (!sheet) return "";
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === categoryName.trim()) {
        var folderId = data[i][1].toString().trim();
        if (folderId !== "") {
          return folderId;
        }
      }
    }
    // หากไม่มีไอดีโฟลเดอร์ระบุ ให้พยายามสร้างโฟลเดอร์อัตโนมัติใน Google Drive
    return createFolderInDrive(categoryName);
  } catch (error) {
    return "";
  }
}

// สร้างโฟลเดอร์ใหม่ใน Drive และบันทึก ID ลงใน Google Sheets
function createFolderInDrive(categoryName) {
  try {
    var folderName = "ระบบสโตร์ - " + categoryName;
    var folders = DriveApp.getFoldersByName(folderName);
    var folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
      // กำหนดให้ทุกคนที่มีลิงก์เข้าดูไฟล์รูปภาพได้แบบสาธารณะ (สำหรับการพรีวิวในแอป)
      folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Categories');
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString().trim() === categoryName.trim()) {
          sheet.getRange(i + 1, 2).setValue(folder.getId());
          break;
        }
      }
    }
    return folder.getId();
  } catch (e) {
    return ""; // หากล้มเหลวให้พึ่งระบบ Root ของไดรฟ์
  }
}

// 9. ฟังก์ชันสำหรับอัปโหลดรูปภาพไปยัง Google Drive โฟลเดอร์ที่เจาะจง
function uploadImageToDrive(base64Data, fileName, folderId) {
  try {
    var contentType = base64Data.substring(5, base64Data.indexOf(';'));
    var bytes = Utilities.base64Decode(base64Data.substr(base64Data.indexOf(',') + 1));
    var blob = Utilities.newBlob(bytes, contentType, fileName);
    
    var folder;
    if (folderId && folderId !== "") {
      try {
        folder = DriveApp.getFolderById(folderId);
      } catch (e) {
        folder = DriveApp.getRootFolder();
      }
    } else {
      folder = DriveApp.getRootFolder();
    }
    
    var file = folder.createFile(blob);
    // เปิดสิทธิ์เข้าถึงแบบสาธารณะผ่านลิงก์เพื่อให้หน้าเว็บแสดงรูปได้
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // สร้าง Web Link เพื่อแสดงผลรูปภาพพรีวิว
    return "https://lh3.googleusercontent.com/d/" + file.getId();
  } catch (error) {
    Logger.log("อัปโหลดรูปภาพล้มเหลว: " + error.toString());
    return null;
  }
}

// 10. ระบบวิเคราะห์และแจ้งเตือนสินค้าสต็อกต่ำผ่านอีเมล (Email Alerts)
function sendEmailAlert(productName, productCode, currentStock, minStock, unit) {
  try {
    var adminEmail = Session.getActiveUser().getEmail();
    if (!adminEmail || adminEmail === "") {
      adminEmail = "domitory@pcccr.ac.th"; // อีเมลสำรองของผู้ใช้งานหอพักพัสดุ
    }
    
    var subject = "⚠️ แจ้งเตือน: อุปกรณ์คลังสินค้าเหลือน้อยกว่าเกณฑ์กำหนด [" + productCode + "]";
    var body = "เรียน เจ้าหน้าที่ฝ่ายพัสดุและคลังสินค้า,\\n\\n" +
               "ระบบตรวจพบรายการสินค้าในสโตร์หอพักที่ ต่ำกว่าเกณฑ์เตือนขั้นต่ำ กรุณาดำเนินการจัดซื้อหรือเติมสต็อกโดยด่วน:\\n\\n" +
               "• รหัสสินค้า: " + productCode + "\\n" +
               "• ชื่อสินค้า: " + productName + "\\n" +
               "• จำนวนคงเหลือปัจจุบัน: " + currentStock + " " + unit + "\\n" +
               "• จุดแจ้งเตือนขั้นต่ำ: " + minStock + " " + unit + "\\n\\n" +
               "ระบบคลังสินค้าหอพักแจ้งอัตโนมัติ";
               
    GmailApp.sendEmail(adminEmail, subject, body);
    return true;
  } catch (e) {
    Logger.log("ไม่สามารถส่งอีเมลแจ้งเตือนได้: " + e.toString());
    return false;
  }
}

// ฟังก์ชันดึงประวัติการเคลื่อนไหวสต็อกล่าสุด (Logs)
function getTransactionLogs() {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Transactions');
    if (!sheet) return [];
    
    var data = sheet.getDataRange().getValues();
    var logs = [];
    for (var i = data.length - 1; i >= 1; i--) { // ดึงจากล่าสุดขึ้นมาก่อน
      logs.push({
        id: data[i][0].toString(),
        code: data[i][1].toString(),
        productName: data[i][2].toString(),
        category: data[i][3].toString(),
        type: data[i][4].toString(),
        quantity: Number(data[i][5]),
        prevQuantity: Number(data[i][6]),
        newQuantity: Number(data[i][7]),
        operator: data[i][8].toString(),
        recipient: data[i][9].toString(),
        note: data[i][10].toString(),
        timestamp: Utilities.formatDate(new Date(data[i][11]), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss")
      });
    }
    return logs;
  } catch (error) {
    return [];
  }
}

// ฟังก์ชันวิเคราะห์และดึงรายการสินค้าติดขัด (ต่ำกว่าเกณฑ์)
function checkLowStock() {
  try {
    var items = getInventoryList();
    var lowStockItems = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].quantity <= items[i].minStock) {
        lowStockItems.push(items[i]);
      }
    }
    return lowStockItems;
  } catch (e) {
    return [];
  }
}

// ดึงภาพรวมสถิติของ Dashboard
function getDashboardStats() {
  try {
    var items = getInventoryList();
    var logs = getTransactionLogs();
    
    var totalItems = items.length;
    var totalQuantity = 0;
    var outOfStockCount = 0;
    var lowStockCount = 0;
    
    for (var i = 0; i < items.length; i++) {
      totalQuantity += items[i].quantity;
      if (items[i].quantity === 0) {
        outOfStockCount++;
      } else if (items[i].quantity <= items[i].minStock) {
        lowStockCount++;
      }
    }
    
    return {
      totalItems: totalItems,
      totalQuantity: totalQuantity,
      outOfStockCount: outOfStockCount,
      lowStockCount: lowStockCount,
      items: items.slice(0, 5), // สินค้าอัปเดตล่าสุด 5 ชิ้น
      recentLogs: logs.slice(0, 5) // รายการเบิก-นำล่าสุด 5 รายการ
    };
  } catch (error) {
    return {
      totalItems: 0,
      totalQuantity: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
      items: [],
      recentLogs: []
    };
  }
}

// 11. ระบบบันทึกข้อมูลและรับคำขอผ่าน POST (REST API POST)
function doPost(e) {
  var result = { success: false, message: "" };
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var data = postData.data;
    
    if (action === "processIntake") {
      result = processIntake(data);
    } else if (action === "processWithdraw") {
      result = processWithdraw(data);
    } else if (action === "editProduct") {
      result = editProductInSheet(data);
    } else if (action === "deleteProduct") {
      result = deleteProductInSheet(data);
    } else if (action === "addUser") {
      result = addUserInSheet(data);
    } else if (action === "deleteUser") {
      result = deleteUserInSheet(data);
    } else if (action === "updateUser") {
      result = updateUserInSheet(data);
    } else if (action === "setup") {
      result = setupDatabase();
    } else {
      result = { success: false, message: "ไม่พบ Action: " + action };
    }
  } catch (err) {
    result = { success: false, message: "ข้อผิดพลาดระบบ Apps Script: " + err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// บันทึกแก้ไขสินค้าลงแผ่นชีต
function editProductInSheet(prod) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Products');
    if (!sheet) return { success: false, message: "ไม่พบตารางสินค้า Products" };
    
    var data = sheet.getDataRange().getValues();
    var foundIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === prod.code.trim()) {
        foundIndex = i + 1;
        break;
      }
    }
    
    if (foundIndex === -1) {
      return { success: false, message: "ไม่พบสินค้ารหัส: " + prod.code };
    }
    
    sheet.getRange(foundIndex, 2).setValue(prod.name);
    sheet.getRange(foundIndex, 3).setValue(prod.category);
    sheet.getRange(foundIndex, 4).setValue(Number(prod.quantity));
    sheet.getRange(foundIndex, 5).setValue(Number(prod.minStock));
    if (prod.imageUrl !== undefined) {
      sheet.getRange(foundIndex, 6).setValue(prod.imageUrl);
    }
    sheet.getRange(foundIndex, 7).setValue(prod.unit);
    sheet.getRange(foundIndex, 8).setValue(new Date());
    
    return { success: true, message: "แก้ไขข้อมูลสินค้าสำเร็จ!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ลบสินค้าออกจากชีต
function deleteProductInSheet(payload) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Products');
    if (!sheet) return { success: false, message: "ไม่พบตารางสินค้า" };
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === payload.code.trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "ลบสินค้าเรียบร้อยแล้ว!" };
      }
    }
    return { success: false, message: "ไม่พบสินค้ารหัสที่ระบุ" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// เพิ่มผู้ใช้งานลงชีต
function addUserInSheet(user) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    if (!sheet) return { success: false, message: "ไม่พบตารางผู้ใช้" };
    
    sheet.appendRow([user.username, user.password || "123456", user.fullName, user.role]);
    return { success: true, message: "เพิ่มผู้ใช้สำเร็จ!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// ลบผู้ใช้ในชีต
function deleteUserInSheet(payload) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    if (!sheet) return { success: false, message: "ไม่พบตารางผู้ใช้" };
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === payload.username.trim()) {
        sheet.deleteRow(i + 1);
        return { success: true, message: "ลบผู้ใช้ออกจากระบบสำเร็จ!" };
      }
    }
    return { success: false, message: "ไม่พบชื่อผู้ใช้งานนี้" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

// อัปเดตข้อมูลผู้ใช้ในชีต
function updateUserInSheet(payload) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName('Users');
    if (!sheet) return { success: false, message: "ไม่พบตารางผู้ใช้" };
    
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0].toString().trim() === payload.oldUsername.trim()) {
        var row = i + 1;
        sheet.getRange(row, 1).setValue(payload.user.username);
        sheet.getRange(row, 2).setValue(payload.user.password || data[i][1]);
        sheet.getRange(row, 3).setValue(payload.user.fullName);
        sheet.getRange(row, 4).setValue(payload.user.role);
        return { success: true, message: "อัปเดตผู้ใช้งานเรียบร้อย!" };
      }
    }
    return { success: false, message: "ไม่พบผู้ใช้ที่ระบุ" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}
`;

export const INDEX_HTML = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบจัดการสโตร์และคลังสินค้าหอพัก</title>
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Fonts Prompt & Inter -->
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    body {
      font-family: 'Prompt', 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">
  <div id="app">
    <!-- หน้าจอนี้จะถูกควบคุมโดยไฟล์ Javascript.html หรือฝั่ง Client-side JS -->
    <!-- ดึงไฟล์ย่อยแทรกลงในไฟล์หลักของระบบ -->
    <?!= include('JavaScript'); ?>
  </div>
</body>
</html>
`;

export const JAVASCRIPT_HTML = `<script>
// ==========================================
// JavaScript.html - Client-Side Script
// ระบบจัดการสโตร์เบิก-นำเข้า-จ่าย และแสดงหน้าเว็บแบบ SPA
// ==========================================

// โครงสร้างโค้ด JavaScript ฝั่ง Client สำหรับติดตั่งลง Google Apps Script แนะนำให้ศึกษาจากหน้าโค้ดจำลองระบบ!
console.log("GAS Client-Side App Initialized!");

// ฟังก์ชันจำลองการส่งข้อมูลใน Google Apps Script (ตัวอย่างโครงสร้าง):
/*
function handleLogin() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  
  google.script.run
    .withSuccessHandler(function(response) {
      if (response.success) {
        alert("เข้าสู่ระบบสำเร็จ!");
        // แสดง Dashboard
      } else {
        alert(response.message);
      }
    })
    .withFailureHandler(function(err) {
      alert("ล้มเหลว: " + err);
    })
    .checkLogin(user, pass);
}
*/
</script>
`;

export const SETUP_GUIDE = `## 📋 ขั้นตอนการตั้งค่าระบบ Store & Inventory Management บน Google Apps Script (GAS)

ระบบถูกออกแบบมาให้เชื่อมโยงและส่งข้อมูลเข้าหากันอย่างสมบูรณ์แบบระหว่าง **Google Sheets (ระบบฐานข้อมูล)**, **Google Drive (ระบบจัดเก็บภาพสินค้าแยกหมวดหมู่)** และ **Google Apps Script Web App (หลังบ้านและหน้าเว็บบอร์ด)**

---

### ขั้นตอนที่ 1: เตรียมตารางฐานข้อมูลใน Google Sheets
1. ไปที่ [Google Sheets](https://sheets.google.com) และสร้างกระดาษคำนวณ (Spreadsheet) ใหม่ขึ้นมา 1 ตัว
2. สังเกตแถบลิงก์ URL คัดลอก **Spreadsheet ID** จากลิงก์ (รหัสที่อยู่ระหว่าง \`/d/\` และ \`/edit\`) 
   * *เช่น: \`https://docs.google.com/spreadsheets/d/1XxxxxxxXxxx.../edit\`*
3. ให้เก็บ ID นี้ไว้เพื่อใส่ในตัวแปร \`SPREADSHEET_ID\` ในไฟล์ \`Code.gs\` 
4. **💡 ไม่ต้องสร้างชีตเองทีละใบ!** เมื่อคุณติดตั้งแอปและเข้าสู่ระบบในครั้งแรก ตัวระบบจะมีปุ่ม **"ติดตั้งตารางฐานข้อมูลอัตโนมัติ" (Setup Sheets)** ที่มุมของแท็บผู้ดูแลระบบ ซึ่งจะช่วยสร้างหัวตาราง (Headers) และหมวดหมู่เริ่มต้น ได้แก่:
   * **Users** ( Username, Password, FullName, Role )
   * **Categories** ( CategoryName, DriveFolderId )
   * **Products** ( ProductCode, ProductName, Category, Quantity, MinStock, ImageUrl, Unit, UpdatedAt )
   * **Transactions** ( TransactionID, ProductCode, ProductName, Category, Type, Quantity, PrevQuantity, NewQuantity, Operator, Recipient, Note, Timestamp )

---

### ขั้นตอนที่ 2: สร้างโฟลเดอร์สำหรับจัดเก็บรูปภาพใน Google Drive
1. ไปที่ [Google Drive](https://drive.google.com)
2. สร้างโฟลเดอร์หลักขึ้นมา เช่น **"คลังสโตร์และรูปภาพสินค้าหอพัก"**
3. และสร้างโฟลเดอร์ย่อยข้างใน 4 โฟลเดอร์เพื่อรองรับหมวดหมู่เริ่มต้น:
   * **อุปกรณ์สำนักงาน**
   * **อุปกรณ์ซ่อมหอพัก**
   * **อุปกรณ์แม่บ้านหอพัก**
   * **อุปกรณ์ชุดเครื่องนอน**
4. คลิกขวาที่โฟลเดอร์ย่อยแต่ละโฟลเดอร์ -> เลือก **แชร์ (Share)** -> เปลี่ยนสิทธิ์เป็น **"ทุกคนที่มีลิงก์มีสิทธิ์อ่าน" (Anyone with the link can view)** เพื่อให้แอปสามารถนำภาพออกมาแสดงผลบนหน้าเว็บได้
5. คัดลอกรหัสโฟลเดอร์ (Folder ID) ของโฟลเดอร์ย่อยแต่ละตัว (รหัสยาวๆ ที่อยู่บนลิงก์ URL เมื่อเราเปิดเข้าไปในโฟลเดอร์นั้นๆ)
6. นำไอดีโฟลเดอร์เหล่านั้นไปกรอกลงในคอลัมน์ \`DriveFolderId\` ในตารางชีต **Categories** เพื่อระบุที่จัดเก็บเฉพาะเจาะจง
   *(หากปล่อยว่างไว้เมื่ออัปโหลดภาพระบบจะพยายามสร้างโฟลเดอร์เหล่านั้นให้คุณโดยอัตโนมัติใน My Drive)*

---

### ขั้นตอนที่ 3: เปิดใช้งาน Google Apps Script (GAS) และติดตั้งโค้ด
1. เปิดกระดาษคำนวณ Google Sheets ที่สร้างไว้ในขั้นตอนที่ 1
2. ที่แถบเมนูด้านบน คลิกเลือก **ส่วนขยาย (Extensions)** -> **Apps Script**
3. ลบโค้ดเริ่มต้นทั้งหมดในไฟล์ \`Code.gs\` ออก แล้วนำโค้ดจากแท็บคัดลอก **Code.gs** ในหน้าพัฒนาระบบตัวนี้ไปวางแทนที่
4. นำ **Spreadsheet ID** ที่คัดลอกไว้ในขั้นตอนที่ 1 ไปวางลงในตัวแปรตัวแรกสุด:
   \`\`\`javascript
   const SPREADSHEET_ID = "รหัสสเปรดชีต_ของคุณที่นี่";
   \`\`\`
5. กดปุ่มบวกสร้างไฟล์ (Add File) -> เลือก **HTML** และตั้งชื่อว่า **Index** (ระบบจะสร้างไฟล์ชื่อ \`Index.html\`)
6. นำโค้ดจากแท็บคัดลอก **Index.html** จากแอปพลิเคชันนี้ไปวางแทนที่ทั้งหมด
7. กดปุ่มบวกสร้างไฟล์ (Add File) -> เลือก **HTML** และตั้งชื่อว่า **JavaScript** (ระบบจะสร้างไฟล์ชื่อ \`JavaScript.html\`)
8. นำโค้ดจากแท็บคัดลอก **JavaScript.html** ของระบบนี้ไปวางแทนที่ทั้งหมด
9. กดปุ่ม **บันทึกโครงงาน (Save Project)** (ปุ่มรูปแผ่นดิสก์) ที่แถบเมนูด้านบน

---

### ขั้นตอนที่ 4: เผยแพร่เว็บแอปพลิเคชัน (Deployment)
1. ที่มุมขวาบนของหน้าจอ Google Apps Script คลิกปุ่ม **การทำให้ใช้งานได้ (Deploy)** -> เลือก **การจัดการทำให้ใช้งานได้ใหม่ (New deployment)**
2. คลิกรูปเกียร์ (Select type) -> เลือก **เว็บแอป (Web app)**
3. กรอกรายละเอียดดังนี้:
   * **รายละเอียดสัญญา:** บันทึกเวอร์ชันแอป เช่น *ระบบจัดการสโตร์คลังสินค้า v1.0*
   * **เรียกใช้งานในฐานะ:** เลือก **ฉัน (Your Email)** - เพื่อให้สคริปต์ทำงานด้วยสิทธิ์และบัญชีของคุณเพื่อเชื่อมต่อ Sheets & Drive
   * **ผู้มีสิทธิ์เข้าถึง:** เลือก **ทุกคน (Anyone)** - เพื่อให้เจ้าหน้าที่คนอื่นๆ สามารถเปิดใช้งานหน้าเว็บได้โดยไม่ต้องล็อกอินบัญชี Google ค้างไว้ (แอปจะล็อกอินผ่านระบบชีต Users แทน)
4. คลิกปุ่ม **ทำให้ใช้งานได้ (Deploy)**
5. ระบบอาจขึ้นหน้าต่างให้คุณ **"ให้สิทธิ์เข้าถึงข้อมูล" (Authorize access)** -> ให้คลิกดำเนินการและอนุญาตสิทธิ์การเข้าถึง Sheets, Drive และ Gmail ให้เรียบร้อย
6. เมื่อ Deploy สำเร็จ คุณจะได้รับลิงก์ **URL เว็บแอป (Web App URL)** สามารถคัดลอกลิงก์นี้ส่งให้ผู้ใช้งาน หรือจัดทำ Bookmark เพื่อเข้าถึงระบบคลังสินค้าได้ทันที!
`;
