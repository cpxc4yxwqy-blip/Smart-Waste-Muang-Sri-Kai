# 🖥️ Desktop App (.exe) สำหรับ Windows

แปลง Web App เป็น Desktop Application ด้วย Electron

## 📦 วิธีที่ 1: Electron App (แนะนำ)

### ติดตั้ง Electron Dependencies

```powershell
# ติดตั้ง Electron
cd electron
npm install
cd ..
```

### รัน Desktop App (Development)

```powershell
npm run electron:dev
```

จะเปิดหน้าต่าง desktop app ขึ้นมา!

### Build เป็นไฟล์ .exe (Windows)

```powershell
npm run electron:build
```

ไฟล์ .exe จะอยู่ที่:
- `electron/release/Smart Waste Dashboard Setup.exe` (installer)
- `electron/release/Smart Waste Dashboard.exe` (portable)

### Build สำหรับ OS อื่น

```powershell
# macOS (.dmg)
cd electron
npm run build:mac

# Linux (.AppImage, .deb)
cd electron
npm run build:linux
```

---

## 🌐 วิธีที่ 2: PWA Install (ง่ายที่สุด)

ใช้ PWA ที่มีอยู่แล้ว - ไม่ต้อง build อะไรเพิ่ม!

### ขั้นตอน:

1. **เปิดเว็บใน Chrome/Edge**
   ```
   https://cpxc4yxwqy-blip.github.io/Smart-Waste-Muang-Sri-Kai/
   ```

2. **คลิกปุ่ม Install**
   - Chrome: คลิกไอคอน ⊕ (Install) ที่ address bar
   - Edge: คลิกไอคอน 📱 (App available)

3. **ติดตั้ง**
   - คลิก "Install" → จะสร้างแอปบน Desktop
   - เปิดได้จาก Start Menu หรือ Desktop shortcut

### ข้อดี PWA:
- ✅ ไม่ต้อง build .exe
- ✅ Auto-update ทุกครั้งที่ deploy
- ✅ ใช้พื้นที่น้อย (~5 MB)
- ✅ รองรับทั้ง Windows, Mac, Linux

---

## 🔧 วิธีที่ 3: Tauri (เบาที่สุด - ขั้นสูง)

Alternative ของ Electron ที่เบากว่า (ใช้ Rust + WebView)

### ติดตั้ง Tauri

```powershell
# ต้องติดตั้ง Rust ก่อน
winget install Rustlang.Rust.GNU

# เพิ่ม Tauri
npm install -D @tauri-apps/cli
npx tauri init
```

### Build Tauri App

```powershell
npm run tauri build
```

ไฟล์ .exe จะเล็กกว่า Electron ~10 เท่า!

---

## 📊 เปรียบเทียบ

| วิธี | ขนาดไฟล์ | ความยาก | Auto-Update |
|------|----------|---------|-------------|
| **PWA Install** | ~5 MB | ⭐ ง่าย | ✅ Auto |
| **Electron** | ~150 MB | ⭐⭐ ปานกลาง | ⚠️ Manual |
| **Tauri** | ~15 MB | ⭐⭐⭐ ยาก | ⚠️ Manual |

---

## 🚀 คำแนะนำ

**สำหรับผู้ใช้ทั่วไป:**
→ ใช้ **PWA Install** (วิธีที่ 2) - ง่ายที่สุด ไม่ต้อง build

**สำหรับ IT ที่ต้อง deploy ในองค์กร:**
→ ใช้ **Electron** (วิธีที่ 1) - สร้าง .exe ติดตั้งได้

**สำหรับ advanced users:**
→ ใช้ **Tauri** (วิธีที่ 3) - เบาที่สุด แต่ต้องติดตั้ง Rust

---

## ✅ Next Steps

ต้องการให้ build .exe เลยหรือไม่?

```powershell
# ติดตั้ง Electron dependencies
npm run electron:install

# สร้าง .exe
npm run electron:build
```

หรือต้องการทดลองรัน desktop app ก่อน?

```powershell
npm run electron:dev
```
