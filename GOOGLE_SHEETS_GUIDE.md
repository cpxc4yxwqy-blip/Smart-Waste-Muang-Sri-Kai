# Google Sheets Integration Guide

## ภาพรวม

ระบบ Smart Waste Dashboard รองรับการเชื่อมต่อกับ Google Sheets เพื่อ:
- **บันทึกข้อมูล** - บันทึกข้อมูลขยะไปยัง Google Sheets อัตโนมัติ
- **ดึงข้อมูล** - นำเข้าข้อมูลจาก Google Sheets มาแสดงใน Dashboard
- **ซิงค์ข้อมูล** - ผสานข้อมูลระหว่าง Local Storage และ Google Sheets

---

## การตั้งค่า Google Sheets

### ขั้นตอนที่ 1: สร้าง Google Sheets

1. ไปที่ [Google Sheets](https://sheets.google.com)
2. สร้างสเปรดชีตใหม่
3. ตั้งชื่อ เช่น "Si Khai Waste Data"
4. สร้างแท็บชื่อ `WasteData` (หรือชื่ือื่นตามต้องการ)

### ขั้นตอนที่ 2: สร้าง Header Row

ในแท็บ `WasteData` ให้สร้างแถวแรก (Header) ดังนี้:

| ID | Year | Month | General Waste (ton) | Organic Waste (ton) | Recyclable Waste (ton) | Hazardous Waste (ton) | Total Waste (ton) | Population | Category | Sub Category | Notes | Created At | Updated At | Created By | Updated By |
|----|------|-------|---------------------|---------------------|------------------------|----------------------|-------------------|------------|----------|--------------|-------|------------|------------|------------|------------|

**หมายเหตุ**: ต้องมีแถว Header นี้เพื่อให้ระบบสามารถอ่านข้อมูลได้ถูกต้อง

### ขั้นตอนที่ 3: คัดลอก Spreadsheet ID

จาก URL ของ Google Sheets:
```
https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                                      ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                      นี่คือ Spreadsheet ID
```

คัดลอกส่วน Spreadsheet ID (ระหว่าง `/d/` และ `/edit`)

### ขั้นตอนที่ 4: สร้าง Google Cloud Project และ API Key

#### 4.1 สร้าง Project

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่ หรือเลือก Project ที่มีอยู่
3. ตั้งชื่อ เช่น "Si Khai Waste Dashboard"

#### 4.2 Enable Google Sheets API

1. ไปที่ **APIs & Services** → **Library**
2. ค้นหา "Google Sheets API"
3. คลิก **Enable**

#### 4.3 สร้าง API Key

1. ไปที่ **APIs & Services** → **Credentials**
2. คลิก **Create Credentials** → **API Key**
3. คัดลอก API Key ที่สร้างขึ้น
4. (แนะนำ) คลิก **Restrict Key** เพื่อจำกัดการใช้งาน:
   - **Application restrictions**: HTTP referrers (websites)
   - เพิ่ม URL: `https://cpxc4yxwqy-blip.github.io/*`
   - **API restrictions**: เลือกเฉพาะ "Google Sheets API"

### ขั้นตอนที่ 5: แชร์สเปรดชีต

1. คลิกปุ่ม **Share** ที่มุมขวาบนของ Google Sheets
2. เลือก **Anyone with the link**
3. ตั้งค่าเป็น **Viewer** (สำหรับอ่านข้อมูล)
4. คัดลอกลิงก์

---

## การตั้งค่าในระบบ

### วิธีที่ 1: ตั้งค่าผ่าน UI (แนะนำ)

1. เปิดแอป Smart Waste Dashboard
2. คลิกเมนู **Settings** ใน Sidebar
3. เลือกแท็บ **Google Sheets**
4. กรอกข้อมูล:
   - **Spreadsheet ID**: ID ที่คัดลอกจาก URL
   - **Sheet Name**: `WasteData` (ชื่อแท็บใน Google Sheets)
   - **API Key Status**: ตรวจสอบว่ามีการตั้งค่า API Key แล้ว
5. คลิก **บันทึกการตั้งค่า**
6. คลิก **ทดสอบการเชื่อมต่อ** เพื่อตรวจสอบ

### วิธีที่ 2: ตั้งค่าผ่าน Environment Variables

1. สร้างไฟล์ `.env` ในโฟลเดอร์โปรเจกต์
2. เพิ่มค่า:
```bash
VITE_GOOGLE_SHEETS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
3. Restart dev server

---

## การใช้งาน

### 1. บันทึกข้อมูลไปยัง Google Sheets

เมื่อตั้งค่า Google Sheets Integration เรียบร้อย:

1. ไปที่หน้า **Data Entry**
2. กรอกข้อมูลขยะตามปกติ
3. คลิกปุ่ม **บันทึกข้อมูล**
4. ระบบจะบันทึกลง Local Storage และพยายามซิงค์ไปยัง Google Sheets อัตโนมัติ
5. ถ้าซิงค์สำเร็จ จะแสดงข้อความ "✓ บันทึกไปยัง Google Sheets สำเร็จ"

**หมายเหตุ**: 
- การเขียนข้อมูลต้องใช้ **Google Apps Script Web App** (ดูด้านล่าง)
- ถ้าไม่มี Web App ข้อมูลจะบันทึกเฉพาะใน Local Storage

### 2. ดึงข้อมูลจาก Google Sheets

1. ไปที่ **Settings** → **Google Sheets**
2. คลิกปุ่ม **ซิงค์ข้อมูลเดี๋ยวนี้**
3. ระบบจะดึงข้อมูลทั้งหมดจาก Google Sheets
4. ผสานกับข้อมูลที่มีใน Local Storage
5. แสดงข้อความจำนวนรายการที่ดึงได้

### 3. ทดสอบการเชื่อมต่อ

1. ไปที่ **Settings** → **Google Sheets**
2. คลิกปุ่ม **ทดสอบการเชื่อมต่อ**
3. ถ้าสำเร็จ จะแสดงชื่อสเปรดชีต
4. ถ้าล้มเหลว ตรวจสอบ:
   - Spreadsheet ID ถูกต้องหรือไม่
   - API Key ถูกต้องและมีสิทธิ์หรือไม่
   - Google Sheets API เปิดใช้งานหรือยัง
   - สเปรดชีตแชร์เป็น "Anyone with the link" หรือยัง

---

## การตั้งค่า Google Apps Script (สำหรับเขียนข้อมูล)

เนื่องจาก Google Sheets API แบบ API Key สามารถ**อ่านข้อมูล**ได้เท่านั้น  
หากต้องการ**เขียนข้อมูล**อัตโนมัติ ต้องสร้าง Google Apps Script Web App

### ขั้นตอนที่ 1: เปิด Script Editor

1. เปิด Google Sheets ของคุณ
2. เมนู **Extensions** → **Apps Script**

### ขั้นตอนที่ 2: เพิ่ม Code

วาง Code นี้ใน Script Editor:

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const spreadsheetId = data.spreadsheetId;
    const sheetName = 'WasteData';
    const rowData = data.data;
    
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        message: 'Sheet not found'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append row
    sheet.appendRow(rowData);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Data saved successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### ขั้นตอนที่ 3: Deploy as Web App

1. คลิก **Deploy** → **New deployment**
2. เลือก type: **Web app**
3. ตั้งค่า:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
4. คลิก **Deploy**
5. คัดลอก **Web app URL** (รูปแบบ: `https://script.google.com/macros/s/AKfycby.../exec`)

## Deploy Google Apps Script (ตัวอย่าง doPost)

วางตัวอย่างโค้ดนี้ใน Google Apps Script (Tools → Script editor) แล้ว Deploy as Web App:

```javascript
function doPost(e){
  try{
    const payload = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    // payload = { action: 'append', spreadsheetId: '...', data: [...] }
    const ss = SpreadsheetApp.openById(payload.spreadsheetId);
    const sheetName = payload.sheetName || 'WasteData';
    const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    if (Array.isArray(payload.data)) {
      sheet.appendRow(payload.data);
    }
    const result = { success: true, message: 'Appended' };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    const result = { success: false, error: err.message || String(err) };
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }
}
```

ขั้นตอนการ Deploy:

- Save โค้ด แล้วเลือก **Deploy → New deployment**
- Deployment type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone** หรือ **Anyone, even anonymous** (ถ้าต้องการให้เรียกจากเบราว์เซอร์โดยไม่ต้อง OAuth)
- กด **Deploy** แล้วคัดลอก **Web app URL** (URL จะลงท้ายด้วย `/exec`)

หมายเหตุการแก้ปัญหา:
- ถ้าเรียกแล้วได้รับ HTTP 401/403: ตรวจสอบการตั้งค่า Who has access และ redeploy
- ถ้าได้ HTML 404 หน้า 'ไฟล์ไม่พบ': ตรวจสอบว่านำ URL จากการ deploy ล่าสุด (ต้องเป็น `/exec`)
- ถ้าเรียกจากเบราว์เซอร์และได้ opaque response หรือไม่มี body: มักเป็นปัญหา CORS — ให้ deploy เป็น public หรือทดสอบจาก server-side (PowerShell/curl)

ตัวอย่างการทดสอบจาก PowerShell (ข้าม CORS):

```powershell
$body = @{
  action = 'append'
  spreadsheetId = 'YOUR_SPREADSHEET_ID'
  sheetName = 'WasteData'
  data = @('test-id','2025','12',0,0,0,0,0,0,'','','note',(Get-Date).ToString('o'),(Get-Date).ToString('o'),'Tester','Tester')
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'https://script.google.com/macros/s/AKfycbx.../exec' -Method Post -Body $body -ContentType 'application/json'
```

### ขั้นตอนที่ 4: ตั้งค่า Web App URL ในระบบ

1. ไปที่ **Settings** → **Google Sheets**
2. วาง URL ใน **Google Apps Script Web App URL**
3. คลิก **บันทึกการตั้งค่า**

ตอนนี้ระบบสามารถบันทึกข้อมูลไปยัง Google Sheets ได้แล้ว!

---

## โครงสร้างข้อมูลใน Google Sheets

### ตารางข้อมูล (WasteData)

| คอลัมน์ | ประเภท | คำอธิบาย |
|---------|--------|----------|
| ID | Text | รหัสอ้างอิงเฉพาะ |
| Year | Number | ปี ค.ศ. (เช่น 2024) |
| Month | Number | เดือน (1-12) |
| General Waste (ton) | Number | ขยะทั่วไป (ตัน) |
| Organic Waste (ton) | Number | ขยะอินทรีย์ (ตัน) |
| Recyclable Waste (ton) | Number | ขยะรีไซเคิล (ตัน) |
| Hazardous Waste (ton) | Number | ขยะอันตราย (ตัน) |
| Total Waste (ton) | Number | ขยะรวม (ตัน) |
| Population | Number | จำนวนประชากร |
| Category | Text | หมวดหมู่ (ถ้ามี) |
| Sub Category | Text | หมวดหมู่ย่อย (ถ้ามี) |
| Notes | Text | หมายเหตุ |
| Created At | Text | วันที่สร้าง (ISO 8601) |
| Updated At | Text | วันที่แก้ไขล่าสุด |
| Created By | Text | ผู้บันทึก |
| Updated By | Text | ผู้แก้ไขล่าสุด |

### ตัวอย่างข้อมูล

```
ID          | Year | Month | General Waste | Organic Waste | ...
1701234567  | 2024 | 10    | 22.0         | 13.2          | ...
1701234568  | 2024 | 11    | 25.5         | 15.0          | ...
```

---

## การแก้ไขปัญหา

### ❌ "ไม่สามารถเชื่อมต่อได้"

**สาเหตุที่เป็นไปได้:**
1. ❌ Spreadsheet ID ผิด → ตรวจสอบว่าคัดลอกถูกต้อง
2. ❌ API Key ผิด → ตรวจสอบว่ากรอกใน `.env` หรือยัง
3. ❌ Google Sheets API ไม่ได้เปิด → Enable ใน Cloud Console
4. ❌ สเปรดชีตไม่ได้แชร์ → ตั้งค่าเป็น "Anyone with the link"

### ❌ "อ่านข้อมูลได้ แต่เขียนไม่ได้"

**สาเหตุ:**
- ยังไม่ได้สร้าง Google Apps Script Web App

**วิธีแก้:**
- ทำตามขั้นตอน "การตั้งค่า Google Apps Script" ด้านบน

### ❌ "ข้อมูลไม่ตรงกับที่บันทึก"

**สาเหตุที่เป็นไปได้:**
1. Header row ไม่ตรงตามที่กำหนด
2. ลำดับคอลัมน์ไม่ถูกต้อง
3. ชื่อแท็บ (Sheet Name) ผิด

**วิธีแก้:**
- ตรวจสอบ Header row ให้ตรงตามที่กำหนด
- ใช้ชื่อแท็บ `WasteData` หรือระบุชื่อที่ถูกต้องใน Settings

### ❌ "Quota exceeded"

**สาเหตุ:**
- Google Sheets API มีข้อจำกัดการใช้งาน (Quota)

**Quota ฟรี:**
- Read requests: 60,000 ครั้ง/วัน/โปรเจกต์
- Write requests: 60,000 ครั้ง/วัน/โปรเจกต์

**วิธีแก้:**
- ลดความถี่ในการซิงค์
- พิจารณาใช้ Batch operations
- Upgrade เป็น Google Workspace (ถ้าจำเป็น)

---

## Security Best Practices

### ✅ ควรทำ

1. ✅ ใช้ API Key Restriction (จำกัดเฉพาะ URL และ API ที่ใช้)
2. ✅ ไม่ Commit API Key ลง Git (ใช้ `.env` และเพิ่มใน `.gitignore`)
3. ✅ แชร์สเปรดชีตเป็น "Viewer" สำหรับการอ่านข้อมูล
4. ✅ ใช้ Google Apps Script Web App สำหรับการเขียนข้อมูล
5. ✅ ตรวจสอบ Quota usage เป็นประจำ

### ❌ ไม่ควรทำ

1. ❌ ไม่แชร์ API Key สาธารณะ
2. ❌ ไม่ใช้ API Key แบบไม่จำกัดสิทธิ์
3. ❌ ไม่ให้สิทธิ์ "Editor" แก่ทุกคน
4. ❌ ไม่ Commit `.env` ลง Git

---

## ข้อจำกัดของ Google Sheets API

| ข้อจำกัด | ค่า | หมายเหตุ |
|----------|-----|----------|
| Cells per spreadsheet | 10 ล้านเซลล์ | รวมทุกแท็บ |
| Rows per sheet | 40,000 แถว | ต่อแท็บ |
| Columns per sheet | 18,278 คอลัมน์ | ต่อแท็บ |
| API calls (Read) | 60,000/วัน | ต่อโปรเจกต์ |
| API calls (Write) | 60,000/วัน | ต่อโปรเจกต์ |

สำหรับระบบที่มีข้อมูลเยอะมาก แนะนำให้ใช้ฐานข้อมูลจริง เช่น MongoDB/PostgreSQL แทน

---

## การ Backup และ Restore

### Backup จาก Google Sheets

1. ไปที่ **Settings** → **Google Sheets**
2. คลิก **ซิงค์ข้อมูลเดี๋ยวนี้**
3. ไปที่ Sidebar คลิก **Backup**
4. ไฟล์ JSON จะถูกดาวน์โหลด (มีข้อมูลจาก Google Sheets)

### Restore ไปยัง Google Sheets

1. Restore ไฟล์ JSON ผ่าน Sidebar → **Restore**
2. ข้อมูลจะถูกโหลดเข้า Local Storage
3. บันทึกข้อมูลแต่ละรายการผ่านหน้า **Data Entry**
4. ระบบจะซิงค์ไปยัง Google Sheets อัตโนมัติ

---

## สรุป

การใช้ Google Sheets Integration มีข้อดี:
- ✅ ฟรี ไม่มีค่าใช้จ่าย
- ✅ เข้าถึงง่าย ใช้ Google Account ธรรมดา
- ✅ แชร์ข้อมูลได้ง่าย
- ✅ มี UI ที่คุ้นเคย (Excel-like)
- ✅ Export/Import ได้สะดวก

ข้อจำกัด:
- ⚠️ Quota จำกัด (60K requests/วัน)
- ⚠️ Performance ช้ากว่าฐานข้อมูลจริง
- ⚠️ การเขียนข้อมูลต้องใช้ Apps Script
- ⚠️ ไม่เหมาะกับข้อมูลขนาดใหญ่มาก (> 10,000 แถว)

สำหรับองค์กรขนาดเล็กถึงกลาง (< 5,000 records/ปี) Google Sheets เพียงพอและสะดวกมาก!

---

## ติดต่อสอบถาม

หากมีปัญหาหรือข้อสงสัย:
1. ตรวจสอบ Console ใน Browser (F12)
2. ดู Error message ที่แสดง
3. อ่านเอกสาร Google Sheets API: https://developers.google.com/sheets/api
