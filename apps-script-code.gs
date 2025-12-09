/**
 * Google Apps Script Web App สำหรับ Smart Waste Dashboard
 * ใช้รับข้อมูลจากแอปและบันทึกลง Google Sheets อัตโนมัติ
 * 
 * วิธีการติดตั้ง:
 * 1. เปิด Google Sheets ของคุณ
 * 2. เมนู Extensions → Apps Script
 * 3. คัดลอกโค้ดนี้ทั้งหมดวางลงไป
 * 4. บันทึก (Ctrl+S)
 * 5. Deploy → New deployment → Type: Web app
 * 6. Execute as: Me
 * 7. Who has access: Anyone
 * 8. Deploy แล้วคัดลอก Web App URL
 */

/**
 * ฟังก์ชันสร้าง Header Row อัตโนมัติ
 * เรียกใช้งาน: เลือกฟังก์ชันนี้แล้วกด Run (หรือเรียกผ่าน doGet)
 */
function createHeaderRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('WasteData');
  
  // ถ้ายังไม่มี sheet ชื่อ WasteData ให้สร้างใหม่
  if (!sheet) {
    sheet = ss.insertSheet('WasteData');
  }
  
  // ตรวจสอบว่ามี header แล้วหรือยัง
  const firstRow = sheet.getRange(1, 1, 1, 16).getValues()[0];
  if (firstRow[0] && firstRow[0].toString().includes('ลำดับ')) {
    Logger.log('Header row already exists');
    return { success: true, message: 'Header row already exists' };
  }
  
  // สร้าง Header Row
  const headers = [
    'ลำดับ',                    // 1. ลำดับ (Auto-increment)
    'ID',                       // 2. รหัสอ้างอิง (Unique ID)
    'ปี (ค.ศ.)',                // 3. ปี
    'เดือน',                    // 4. เดือน (1-12)
    'ขยะทั่วไป (ตัน)',         // 5. General Waste
    'ขยะอินทรีย์ (ตัน)',        // 6. Organic Waste
    'ขยะรีไซเคิล (ตัน)',        // 7. Recyclable Waste
    'ขยะอันตราย (ตัน)',         // 8. Hazardous Waste
    'ปริมาณขยะรวม (ตัน)',       // 9. Total Waste
    'จำนวนประชากร',             // 10. Population
    'หมวดหมู่',                 // 11. Category
    'หมวดหมู่ย่อย',             // 12. Sub Category
    'หมายเหตุ',                 // 13. Notes
    'วันที่บันทึก',             // 14. Created At
    'วันที่แก้ไข',              // 15. Updated At
    'ผู้บันทึกข้อมูล'           // 16. Created By / Updated By
  ];
  
  // เขียน Header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // จัดรูปแบบ Header
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4CAF50'); // สีเขียว
  headerRange.setFontColor('#FFFFFF');  // ตัวอักษรสีขาว
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  
  // ตั้งความกว้างคอลัมน์
  sheet.setColumnWidth(1, 80);   // ลำดับ
  sheet.setColumnWidth(2, 150);  // ID
  sheet.setColumnWidth(3, 80);   // ปี
  sheet.setColumnWidth(4, 80);   // เดือน
  sheet.setColumnWidth(5, 140);  // ขยะทั่วไป
  sheet.setColumnWidth(6, 140);  // ขยะอินทรีย์
  sheet.setColumnWidth(7, 140);  // ขยะรีไซเคิล
  sheet.setColumnWidth(8, 140);  // ขยะอันตราย
  sheet.setColumnWidth(9, 150);  // ปริมาณขยะรวม
  sheet.setColumnWidth(10, 120); // จำนวนประชากร
  sheet.setColumnWidth(11, 100); // หมวดหมู่
  sheet.setColumnWidth(12, 120); // หมวดหมู่ย่อย
  sheet.setColumnWidth(13, 200); // หมายเหตุ
  sheet.setColumnWidth(14, 150); // วันที่บันทึก
  sheet.setColumnWidth(15, 150); // วันที่แก้ไข
  sheet.setColumnWidth(16, 150); // ผู้บันทึก
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('Header row created successfully');
  return { success: true, message: 'Header row created successfully' };
}

/**
 * ฟังก์ชันรับข้อมูลจากแอป (HTTP POST)
 */
function doPost(e) {
  try {
    // Parse JSON payload
    const payload = e.postData && e.postData.contents 
      ? JSON.parse(e.postData.contents) 
      : {};
    
    Logger.log('Received payload: ' + JSON.stringify(payload));
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!payload.spreadsheetId) {
      return createResponse(false, 'Missing spreadsheetId');
    }
    
    if (!payload.data || !Array.isArray(payload.data)) {
      return createResponse(false, 'Missing or invalid data array');
    }
    
    // เปิด Spreadsheet
    const ss = SpreadsheetApp.openById(payload.spreadsheetId);
    const sheetName = payload.sheetName || 'WasteData';
    let sheet = ss.getSheetByName(sheetName);
    
    // ถ้ายังไม่มี sheet ให้สร้างใหม่
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // สร้าง header row อัตโนมัติ
      createHeaderRowForSheet(sheet);
    }
    
    // ตรวจสอบว่ามี header row หรือยัง
    const firstRow = sheet.getRange(1, 1, 1, 1).getValue();
    if (!firstRow || firstRow.toString().trim() === '') {
      createHeaderRowForSheet(sheet);
    }
    
    // เตรียมข้อมูลสำหรับบันทึก
    const rowData = payload.data;
    
    // คำนวณลำดับ (Auto-increment)
    const lastRow = sheet.getLastRow();
    const sequenceNumber = lastRow; // แถว 1 = header, แถว 2 = ลำดับที่ 1, etc.
    
    // แทรกลำดับที่ตำแหน่งแรก
    const dataWithSequence = [sequenceNumber, ...rowData];
    
    // Append row
    sheet.appendRow(dataWithSequence);
    
    // จัดรูปแบบแถวที่เพิ่ม
    const newRowNumber = sheet.getLastRow();
    const newRowRange = sheet.getRange(newRowNumber, 1, 1, dataWithSequence.length);
    
    // ตั้งค่าจัดชิดกลางสำหรับคอลัมน์ตัวเลข
    sheet.getRange(newRowNumber, 1, 1, 1).setHorizontalAlignment('center');  // ลำดับ
    sheet.getRange(newRowNumber, 3, 1, 1).setHorizontalAlignment('center');  // ปี
    sheet.getRange(newRowNumber, 4, 1, 1).setHorizontalAlignment('center');  // เดือน
    sheet.getRange(newRowNumber, 5, 1, 5).setHorizontalAlignment('right');   // ปริมาณขยะ (5-9)
    sheet.getRange(newRowNumber, 10, 1, 1).setHorizontalAlignment('right');  // ประชากร
    
    // สลับสีแถว (Zebra striping)
    if (newRowNumber % 2 === 0) {
      newRowRange.setBackground('#F5F5F5');
    }
    
    Logger.log('Data appended successfully at row ' + newRowNumber);
    
    return createResponse(true, 'Data saved successfully at row ' + newRowNumber, {
      rowNumber: newRowNumber,
      sequenceNumber: sequenceNumber
    });
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, error.toString());
  }
}

/**
 * ฟังก์ชันสร้าง Header สำหรับ Sheet ที่ระบุ
 */
function createHeaderRowForSheet(sheet) {
  const headers = [
    'ลำดับ',
    'ID',
    'ปี (ค.ศ.)',
    'เดือน',
    'ขยะทั่วไป (ตัน)',
    'ขยะอินทรีย์ (ตัน)',
    'ขยะรีไซเคิล (ตัน)',
    'ขยะอันตราย (ตัน)',
    'ปริมาณขยะรวม (ตัน)',
    'จำนวนประชากร',
    'หมวดหมู่',
    'หมวดหมู่ย่อย',
    'หมายเหตุ',
    'วันที่บันทึก',
    'วันที่แก้ไข',
    'ผู้บันทึกข้อมูล'
  ];
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4CAF50');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  
  sheet.setFrozenRows(1);
}

/**
 * ฟังก์ชันตอบกลับ HTTP Response
 */
function createResponse(success, message, data) {
  const response = {
    success: success,
    message: message
  };
  
  if (data) {
    response.data = data;
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ฟังก์ชันทดสอบการทำงาน (เรียกผ่าน HTTP GET)
 */
function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'createHeader') {
    const result = createHeaderRow();
    return createResponse(result.success, result.message);
  }
  
  return createResponse(true, 'Smart Waste Dashboard - Google Apps Script Web App is running!', {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    availableActions: ['createHeader']
  });
}

/**
 * ฟังก์ชันสำหรับทดสอบการ append ข้อมูล (เรียกใช้ใน Apps Script Editor)
 */
function testAppendData() {
  const testPayload = {
    spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
    sheetName: 'WasteData',
    data: [
      'test-id-' + new Date().getTime(),  // ID
      2025,                                 // Year
      12,                                   // Month
      25.5,                                 // General Waste
      15.2,                                 // Organic Waste
      8.3,                                  // Recyclable Waste
      1.2,                                  // Hazardous Waste
      50.2,                                 // Total Waste
      5420,                                 // Population
      'ทดสอบ',                              // Category
      '',                                   // Sub Category
      'ข้อมูลทดสอบจาก Apps Script',        // Notes
      new Date().toISOString(),             // Created At
      new Date().toISOString(),             // Updated At
      'System Test'                         // Created By
    ]
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(testPayload)
    }
  };
  
  const result = doPost(mockEvent);
  Logger.log(result.getContent());
}
