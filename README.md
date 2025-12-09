<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Smart Waste Dashboard - Muang Si Khai

> 🌱 ระบบจัดการข้อมูลขยะชุมชนแบบ Smart PWA พร้อม AI Analysis และ Google Sheets Integration

[![PWA](https://img.shields.io/badge/PWA-Enabled-green)](https://cpxc4yxwqy-blip.github.io/Smart-Waste-Muang-Sri-Kai/)
[![Version](https://img.shields.io/badge/version-0.0.1-blue)](package.json)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

**Live Demo:** https://cpxc4yxwqy-blip.github.io/Smart-Waste-Muang-Sri-Kai/

---

## ✨ คุณสมบัติหลัก

### 📊 Data Management
- ✅ **บันทึกข้อมูลขยะ** - รายเดือน พร้อมแยกประเภท (ทั่วไป/อินทรีย์/รีไซเคิล/อันตราย)
- ✅ **Import/Export** - นำเข้า CSV และสำรองข้อมูล JSON
- ✅ **Google Sheets Integration** - บันทึกและซิงค์ข้อมูลกับ Google Sheets
- ✅ **Local Storage** - เก็บข้อมูลในเครื่องอัตโนมัติ
- ✅ **ตรวจสอบค่าผิดปกติ (Outlier Detection)** - เตือนเมื่อข้อมูลผิดปกติ

### 📈 Data Visualization
- ✅ **Dashboard แบบ Real-time** - แสดงสถิติและแนวโน้ม
- ✅ **กราฟหลากหลายรูปแบบ**:
  - 📊 Monthly Trend Chart (เส้นแนวโน้มรายเดือน)
  - 🥧 Composition Pie Chart (สัดส่วนประเภทขยะ)
  - 📊 Waste Bar Chart (แท่งเปรียบเทียบรายเดือน)
  - 📉 Per Capita Chart (ขยะต่อคนต่อวัน)
  - 📈 Comparison Line Chart (เปรียบเทียบปี)
  - 🎯 Composition Radar Chart (วิเคราะห์องค์ประกอบ)
- ✅ **เปรียบเทียบปี** - วิเคราะห์แนวโน้มระหว่างปี

### 🤖 AI-Powered Features
- ✅ **AI Analysis** - วิเคราะห์ข้อมูลด้วย Google Gemini API
- ✅ **Executive Report Generator** - สร้างรายงานผู้บริหารอัตโนมัติ
- ✅ **Insights & Recommendations** - คำแนะนำจาก AI

### 📱 Progressive Web App (PWA)
- ✅ **ติดตั้งได้** - Install เป็นแอปบนมือถือ/Desktop
- ✅ **Offline Support** - ใช้งานได้แม้ไม่มีอินเทอร์เน็ต
- ✅ **Background Sync** - ซิงค์ข้อมูลอัตโนมัติเมื่อมีเน็ต
- ✅ **Push Notifications** - รับการแจ้งเตือนแบบ Real-time

### 👥 User Management
- ✅ **Staff Registry** - ทะเบียนบุคลากร
- ✅ **Role-based Access** - จัดการสิทธิ์ (Admin/Staff/Viewer)
- ✅ **Audit Logs** - บันทึกประวัติการแก้ไข
- ✅ **Identity Profiles** - บันทึกผู้บันทึกข้อมูล

### 🔔 Push Notifications
- ✅ **Admin Panel** - ส่งการแจ้งเตือนแบบ Role-based
- ✅ **VAPID Integration** - ระบบ Push แบบมาตรฐาน
- ✅ **Service Worker** - รองรับ Notification แม้แอปปิด

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm หรือ yarn

### Installation

1. **Clone repository**
\`\`\`bash
git clone https://github.com/cpxc4yxwqy-blip/Smart-Waste-Muang-Sri-Kai.git
cd Smart-Waste-Muang-Sri-Kai
\`\`\`

2. **Install dependencies**
\`\`\`bash
npm install
\`\`\`

3. **Set up environment variables**
\`\`\`bash
cp .env.example .env
\`\`\`

แก้ไขไฟล์ \`.env\`:
\`\`\`bash
# Google Sheets API (Optional)
VITE_GOOGLE_SHEETS_API_KEY=your_api_key_here

# Gemini AI (Optional - can set via UI)
GEMINI_API_KEY=your_gemini_key

# Web Push (Optional)
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
\`\`\`

4. **Run development server**
\`\`\`bash
npm run dev
\`\`\`

เปิดเบราว์เซอร์ที่ http://localhost:3000

---

## 📦 Build & Deploy

### Build Production
\`\`\`bash
npm run build
\`\`\`

### Deploy to GitHub Pages
\`\`\`bash
npm run deploy
\`\`\`

### Preview Production Build
\`\`\`bash
npm run preview
\`\`\`

---

## 🔧 Configuration

### Google Sheets Setup
ดูคู่มือฉบับเต็มที่ [GOOGLE_SHEETS_GUIDE.md](GOOGLE_SHEETS_GUIDE.md)

**สรุป:**
1. สร้าง Google Sheets และคัดลอก Spreadsheet ID
2. สร้าง API Key ใน Google Cloud Console
3. Enable Google Sheets API
4. ตั้งค่าใน Settings → Google Sheets

### Gemini AI Setup
1. รับ API Key ฟรีที่ https://aistudio.google.com/app/apikey
2. ตั้งค่าใน Settings → ทั่วไป

### Push Notifications Setup
ดูคู่มือที่ [DEPLOYMENT.md](DEPLOYMENT.md) หัวข้อ "Web Push Configuration"

---

## 📁 Project Structure

\`\`\`
si-khai-waste-smart-dashboard/
├── components/              # React Components
│   ├── Dashboard.tsx       # หน้าหลัก + กราฟ
│   ├── DataEntryForm.tsx   # ฟอร์มบันทึกข้อมูล
│   ├── AnalysisReport.tsx  # รายงาน AI
│   ├── StaffRegistry.tsx   # ทะเบียนบุคลากร
│   ├── AdminPushPanel.tsx  # ส่งการแจ้งเตือน
│   ├── GoogleSheetsSettings.tsx  # ตั้งค่า Google Sheets
│   └── ...                 # Chart components
├── services/               # Business Logic
│   ├── googleSheetsService.ts   # Google Sheets API
│   ├── geminiService.ts    # Gemini AI
│   ├── pushSubscription.ts # Web Push
│   └── analytics.ts        # Tracking
├── src/
│   └── sw.ts              # Service Worker (PWA)
├── types.ts               # TypeScript Types
├── App.tsx                # Main App
└── vite.config.ts         # Build Config
\`\`\`

---

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **PWA:** vite-plugin-pwa + Workbox
- **Charts:** Recharts
- **UI:** Tailwind CSS (CDN) + Lucide Icons
- **AI:** Google Gemini API
- **Storage:** LocalStorage + Google Sheets API
- **Push:** Web Push API + VAPID

---

## 📖 Documentation

- 📘 [Google Sheets Integration Guide](GOOGLE_SHEETS_GUIDE.md)
- 📘 [Deployment Guide](DEPLOYMENT.md)
- 📘 [Desktop App Guide](DESKTOP_APP.md)
- 📘 [PWA Install Guide](PWA_INSTALL_GUIDE.md)

---

## 🎯 Features Roadmap

- [x] Google Sheets Integration
- [x] Multiple Chart Types
- [x] PWA Install Prompt
- [x] Web Push Notifications
- [ ] Multi-language Support (EN/TH)
- [ ] Dark Mode
- [ ] Export to PDF
- [ ] Advanced Analytics Dashboard
- [ ] Mobile App (React Native)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Si Khai Waste Management Team**

- 📧 Email: admin@example.com
- 🌐 Website: https://cpxc4yxwqy-blip.github.io/Smart-Waste-Muang-Sri-Kai/

---

## 🙏 Acknowledgments

- Google Gemini API
- Recharts Library
- Vite PWA Plugin
- Lucide Icons
- Tailwind CSS

---

<div align="center">
Made with ❤️ for sustainable waste management
</div>
