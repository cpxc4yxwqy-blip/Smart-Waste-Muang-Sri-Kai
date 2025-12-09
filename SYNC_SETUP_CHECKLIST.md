# Google Sheets Sync - Setup Checklist ✅

ระบบ Google Sheets Sync ต้องการการตั้งค่าในหลายขั้นตอน ตรวจสอบด้านล่างเพื่อแน่ใจว่าทุกขั้นตอนเสร็จสมบูรณ์:

---

## ขั้นตอนที่ 1: Google Sheets API (สำหรับการอ่านข้อมูล) ✓

- [ ] สร้าง Google Cloud Project
- [ ] Enable "Google Sheets API"
- [ ] สร้าง API Key
- [ ] กำหนด API Key ใน `.env` หรือ Environment Variables
  ```
  VITE_GOOGLE_SHEETS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
  ```

**ตรวจสอบ:**
- คลิก Settings → Google Sheets → ทดสอบการเชื่อมต่อ
- ถ้าแสดง ✓ สำเร็จ = API Key ถูกต้อง

---

## ขั้นตอนที่ 2: Google Sheets Document ✓

- [ ] สร้าง Google Sheets ใหม่
- [ ] ระบุชื่อ เช่น "Si Khai Waste Data"
- [ ] สร้างแท็บชื่อ `WasteData`
- [ ] สร้าง Header Row (แถวแรก) ดังนี้:

```
ID | Year | Month | General Waste (ton) | Organic Waste (ton) | Recyclable Waste (ton) | Hazardous Waste (ton) | Total Waste (ton) | Population | Category | Sub Category | Notes | Created At | Updated At | Created By | Updated By
```

- [ ] แชร์สเปรดชีต เป็น "Anyone with the link"
- [ ] คัดลอก **Spreadsheet ID** จาก URL
  ```
  https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
                                           ↑ คัดลอกส่วนนี้
  ```

**ตั้งค่าในแอป:**
1. ไปที่ Settings → Google Sheets
2. วาง Spreadsheet ID ในช่อง "Spreadsheet ID"
3. เพิ่มชื่อ Sheet: `WasteData` (ในช่อง "Sheet Name")
4. คลิก "บันทึกการตั้งค่า"

**ตรวจสอบ:**
- คลิก "ทดสอบการเชื่อมต่อ"
- ถ้าแสดงชื่อสเปรดชีต = Spreadsheet ID ถูกต้อง ✓

---

## ขั้นตอนที่ 3: Google Apps Script Web App (สำหรับการเขียนข้อมูล) 🔴 **สำคัญที่สุด**

**หากข้อมูลไม่ปรากฏใน Google Sheets หลังจากซิงค์ → ปัญหามักอยู่ที่นี่**

### สร้าง Web App:

1. เปิด Google Sheets ของคุณ
2. เมนู **Extensions** → **Apps Script**
3. วาง Code นี้:

```javascript
function doPost(e) {
  try {
    const payload = e.postData && e.postData.contents 
      ? JSON.parse(e.postData.contents) 
      : {};
    
    // payload = { action: 'append', spreadsheetId: '...', sheetName: '...', data: [...] }
    if (!payload.spreadsheetId || !payload.data) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Missing spreadsheetId or data'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.openById(payload.spreadsheetId);
    const sheetName = payload.sheetName || 'WasteData';
    const sheet = ss.getSheetByName(sheetName) || ss.getSheets()[0];
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Sheet not found: ' + sheetName
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Append the row
    if (Array.isArray(payload.data)) {
      sheet.appendRow(payload.data);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Row appended successfully'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.message || String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. บันทึก (Ctrl+S)
5. คลิก **Deploy** → **New deployment**
6. เลือก **Type: Web app**
7. ตั้งค่า:
   - **Execute as:** ใส่อีเมลของคุณ
   - **Who has access:** "Anyone" หรือ "Anyone, even anonymous"
8. คลิก **Deploy**
9. **คัดลอก Web App URL** (ซ้ำสำคัญ!) - ลงท้ายด้วย `/exec`
   ```
   https://script.google.com/macros/s/AKfycby.../exec
   ```

### ตั้งค่า Web App URL ในแอป:

1. ไปที่ Settings → Google Sheets
2. วาง URL ใน **"Google Apps Script Web App URL"**
3. คลิก **"บันทึกการตั้งค่า"**

**ตรวจสอบ:**

บันทึกข้อมูลใหม่ (Data Entry → บันทึก):
- ถ้าได้ข้อความ "ซิงค์สำเร็จ" = Web App ทำงานถูกต้อง ✓
- ตรวจสอบ Google Sheets ว่ามีแถวข้อมูลใหม่หรือไม่

---

## ขั้นตอนที่ 4: Auto-Sync Settings (ตัวเลือก)

1. ไปที่ Settings → Google Sheets → "Auto-sync Configuration"
2. ตั้งค่า:
   - **Enable Auto-sync**: เปิด ✓
   - **Interval (minutes)**: 15 (ซิงค์ทุก 15 นาที)
   - **Max Retries**: 3 (ลองซิงค์สูงสุด 3 ครั้ง)
   - **Base Delay (ms)**: 1000 (รอ 1 วินาที ก่อน retry)
   - **Backoff Policy**: exponential (เพิ่มเวลารอแบบเลขชี้กำลัง)
3. คลิก **"Save Auto-sync"**

---

## 🔴 Troubleshooting

### ❌ "ไม่มีข้อมูลปรากฏใน Google Sheets"

**ขั้นตอนการแก้ไข:**

1. ✅ ตรวจสอบ **Web App URL ถูกตั้งค่า** หรือไม่
   - ไปที่ Settings → Google Sheets
   - ดู **"Google Apps Script Web App URL"** มีค่า หรือว่าง?
   - ถ้าว่าง → วาง URL ตามขั้นตอนที่ 3

2. ✅ ตรวจสอบ **Header Row ใน Google Sheets** ถูกต้อง หรือไม่
   - เปิด Google Sheets
   - ตรวจสอบแถวแรก (Header) มีคำว่า: ID, Year, Month, General Waste, etc.
   - ถ้าไม่มี → สร้าง Header Row ตามขั้นตอนที่ 2

3. ✅ ตรวจสอบ **Spreadsheet ID และ Sheet Name** ถูกต้อง หรือไม่
   - ไปที่ Settings → Google Sheets
   - ตรวจสอบ "Spreadsheet ID" ตรงกับ URL หรือไม่
   - ตรวจสอบ "Sheet Name" คือ `WasteData` (หรือชื่อแท็บที่สร้าง)

4. ✅ ทดสอบ Web App ด้วย PowerShell:
   ```powershell
   $body = @{
     action = 'append'
     spreadsheetId = 'YOUR_SPREADSHEET_ID'
     sheetName = 'WasteData'
     data = @('test-id','2025','12',0,0,0,0,0,0,'','','test note','2025-12-04T00:00:00Z','2025-12-04T00:00:00Z','Tester','Tester')
   } | ConvertTo-Json

   Invoke-RestMethod -Uri 'https://script.google.com/macros/s/YOUR_WEB_APP_ID/exec' -Method Post -Body $body -ContentType 'application/json'
   ```
   - ถ้าได้ `success: true` = Web App ทำงานถูกต้อง ✓

### ❌ "ทดสอบการเชื่อมต่อ" ล้มเหลว

- **API Key ผิด?** → ตรวจสอบใน `.env` หรือ Environment Variables
- **Spreadsheet ID ผิด?** → คัดลอกจาก URL ใหม่
- **API ไม่ enabled?** → เปิด Google Cloud Console → Enable Google Sheets API

### ✅ ถ้า "ทดสอบการเชื่อมต่อ" สำเร็จ แต่ไม่มีข้อมูลปรากฏ

→ **Web App URL ยังไม่ได้ตั้งค่า** ตามขั้นตอนที่ 3

---

## ✅ Verification Checklist

ตรวจสอบทั้งหมด:

- [ ] `.env` มี `VITE_GOOGLE_SHEETS_API_KEY=AIzaSyXXX...`
- [ ] Settings → Google Sheets มี "Spreadsheet ID"
- [ ] Settings → Google Sheets มี "Sheet Name" = `WasteData`
- [ ] Settings → Google Sheets มี "Google Apps Script Web App URL" (ลงท้ายด้วย `/exec`)
- [ ] "ทดสอบการเชื่อมต่อ" แสดง ✓ สำเร็จ
- [ ] Google Sheets มี Header Row ในแถวแรก
- [ ] Google Sheets แชร์เป็น "Anyone with the link"
- [ ] บันทึกข้อมูลใหม่ → รอ 2 วินาที → เปิด Google Sheets → เห็นแถวข้อมูลใหม่ ✓

---

## 📞 ต้องการความช่วยเหลือเพิ่มเติม?

ดูไฟล์ `GOOGLE_SHEETS_GUIDE.md` สำหรับรายละเอียดเพิ่มเติม
