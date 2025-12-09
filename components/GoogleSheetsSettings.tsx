import React, { useState, useEffect } from 'react';
import { Database, Check, X, RefreshCw, ExternalLink, Settings, Shield, Upload } from 'lucide-react';
import {
  isGoogleSheetsConfigured,
  setSpreadsheetId,
  getSpreadsheetId,
  setWebAppUrl,
  getWebAppUrl,
  setSheetName,
  getSheetName,
  testConnection,
  fetchRecordsFromSheets,
  testWriteToWebApp,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_WEB_APP_URL
} from '../services/googleSheetsService';

interface GoogleSheetsSettingsProps {
  onSync?: (records: any[]) => void;
}

export default function GoogleSheetsSettings({ onSync }: GoogleSheetsSettingsProps) {
  const [spreadsheetId, setSpreadsheetIdLocal] = useState('');
  const [webAppUrl, setWebAppUrlLocal] = useState('');
  const [sheetName, setSheetNameLocal] = useState('WasteData');
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem('googleSheetsAutoSyncEnabled');
    return v === 'true';
  });
  const [autoSyncInterval, setAutoSyncInterval] = useState<number>(() => {
    const v = localStorage.getItem('googleSheetsAutoSyncIntervalMinutes');
    return v ? parseInt(v) : 15; // default 15 minutes
  });
  const [autoSyncMaxRetries, setAutoSyncMaxRetries] = useState<number>(() => {
    const v = localStorage.getItem('googleSheetsAutoSyncMaxRetries');
    return v ? parseInt(v) : 3;
  });
  const [autoSyncBaseDelayMs, setAutoSyncBaseDelayMs] = useState<number>(() => {
    const v = localStorage.getItem('googleSheetsAutoSyncBaseDelayMs');
    return v ? parseInt(v) : 1000;
  });
  const [backoffPolicy, setBackoffPolicy] = useState<string>(() => {
    const v = localStorage.getItem('googleSheetsAutoSyncBackoff');
    return v || 'exponential';
  });
  const [silentMode, setSilentMode] = useState<boolean>(() => {
    const v = localStorage.getItem('googleSheetsSyncSilentMode');
    return v === 'true';
  });
  const [sheetIdValid, setSheetIdValid] = useState<boolean>(true);
  const [webAppValid, setWebAppValid] = useState<boolean>(true);
  const [defaultWarning, setDefaultWarning] = useState<{ sheetId: boolean; webApp: boolean }>({ sheetId: false, webApp: false });

  useEffect(() => {
    setSpreadsheetIdLocal(getSpreadsheetId());
    setWebAppUrlLocal(getWebAppUrl());
    setSheetNameLocal(getSheetName());
    const apiKeyValue = (import.meta.env as any).VITE_GOOGLE_SHEETS_API_KEY || '';
    setApiKey(apiKeyValue);
  }, []);

  useEffect(() => {
    const sheetOk = /^[A-Za-z0-9-_]{30,}$/.test(spreadsheetId.trim());
    const webOk = webAppUrl.trim() === '' || /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(webAppUrl.trim());
    setSheetIdValid(sheetOk);
    setWebAppValid(webOk);
    setDefaultWarning({
      sheetId: !!spreadsheetId && spreadsheetId === DEFAULT_SPREADSHEET_ID,
      webApp: !!webAppUrl && webAppUrl === DEFAULT_WEB_APP_URL
    });
  }, [spreadsheetId, webAppUrl]);

  const handleSaveSettings = () => {
    setSpreadsheetId(spreadsheetId);
    setWebAppUrl(webAppUrl);
    setSheetName(sheetName);
    setTestResult({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ' });
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testConnection();
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const records = await fetchRecordsFromSheets();
      if (onSync) {
        onSync(records);
      }
      setTestResult({
        success: true,
        message: `ดึงข้อมูล ${records.length} รายการสำเร็จ`
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการซิงค์'
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleTestWrite = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const web = webAppUrl || getWebAppUrl();
      if (!web) throw new Error('กรุณาใส่ Web App URL ก่อนทดสอบ');
      const result = await fetch('/__test-proxy__', { method: 'POST' });
      // Call service directly (CORS may still apply if Web App not public)
      const r = await testWriteToWebApp(web, spreadsheetId || undefined);
      setTestResult({ success: true, message: `Write test success: ${JSON.stringify(r)}` });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAutoSync = () => {
    localStorage.setItem('googleSheetsAutoSyncEnabled', autoSyncEnabled ? 'true' : 'false');
    localStorage.setItem('googleSheetsAutoSyncIntervalMinutes', String(autoSyncInterval));
    localStorage.setItem('googleSheetsAutoSyncMaxRetries', String(autoSyncMaxRetries));
    localStorage.setItem('googleSheetsAutoSyncBaseDelayMs', String(autoSyncBaseDelayMs));
    localStorage.setItem('googleSheetsAutoSyncBackoff', backoffPolicy);
    localStorage.setItem('googleSheetsSyncSilentMode', silentMode ? 'true' : 'false');
    setTestResult({ success: true, message: `Auto-sync ${autoSyncEnabled ? 'เปิด' : 'ปิด'} (ทุก ${autoSyncInterval} นาที)${silentMode ? ' - Silent Mode' : ''}` });
  };

  const isConfigured = isGoogleSheetsConfigured();

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Google Sheets Integration</h3>
            <p className="text-sm text-gray-600">เชื่อมต่อและซิงค์ข้อมูลกับ Google Sheets</p>
          </div>
        </div>
        {isConfigured && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">เชื่อมต่อแล้ว</span>
          </div>
        )}
      </div>

      {/* Instructions Toggle */}
      <button
        onClick={() => setShowInstructions(!showInstructions)}
        className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-900">
            คู่มือการตั้งค่า (คลิกเพื่อ{showInstructions ? 'ซ่อน' : 'แสดง'})
          </span>
        </div>
        <ExternalLink className="w-4 h-4 text-blue-600" />
      </button>

      {/* ⚠️ WARNING: No Web App URL */}
      {isConfigured && !webAppUrl && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start gap-3">
          <div className="text-red-600 text-2xl flex-shrink-0">⚠️</div>
          <div>
            <h5 className="font-semibold text-red-900 mb-1">ข้อมูลจะไม่ถูกส่งไปยัง Google Sheets</h5>
            <p className="text-sm text-red-800 mb-2">
              คุณได้ตั้งค่า Spreadsheet ID แล้ว แต่ยังไม่ได้ตั้งค่า <strong>Google Apps Script Web App URL</strong>
            </p>
            <p className="text-xs text-red-700 mb-2">
              หากต้องการให้ข้อมูลถูกบันทึกอัตโนมัติไปยัง Google Sheets คุณต้อง:
            </p>
            <ol className="text-xs text-red-700 list-decimal list-inside space-y-1">
              <li>สร้าง Google Apps Script Web App (ดูคู่มือด้านล่าง)</li>
              <li>วาง Web App URL ที่นี่</li>
              <li>บันทึกการตั้งค่า</li>
            </ol>
            <p className="text-xs text-red-600 mt-2 font-medium">
              📘 ดูไฟล์ <code className="bg-red-100 px-1 rounded">SYNC_SETUP_CHECKLIST.md</code> สำหรับคำแนะนำทั้งหมด
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      {showInstructions && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 space-y-3 border border-blue-200">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            ขั้นตอนการตั้งค่า Google Sheets
          </h4>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>
              <strong>สร้าง Google Sheets:</strong> ไปที่{' '}
              <a href="https://sheets.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Google Sheets
              </a>{' '}
              และสร้างสเปรดชีตใหม่
            </li>
            <li>
              <strong>คัดลอก Spreadsheet ID:</strong> จาก URL (ส่วน{' '}
              <code className="bg-white px-1 py-0.5 rounded text-xs">
                /d/[SPREADSHEET_ID]/
              </code>
              )
            </li>
            <li>
              <strong>สร้าง API Key:</strong>{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Cloud Console
              </a>{' '}
              → APIs & Services → Credentials → Create API Key
            </li>
            <li>
              <strong>Enable Google Sheets API:</strong> ไปที่ APIs & Services → Library → ค้นหา "Google Sheets API" → Enable
            </li>
            <li>
              <strong>ตั้งค่า API Key ใน .env:</strong> เพิ่ม{' '}
              <code className="bg-white px-1 py-0.5 rounded text-xs">
                VITE_GOOGLE_SHEETS_API_KEY=your_api_key
              </code>
            </li>
            <li>
              <strong>แชร์สเปรดชีต:</strong> Share → Anyone with the link → Viewer (สำหรับอ่านข้อมูล)
            </li>
            <li>
              <strong>(ตัวเลือก) สร้าง Google Apps Script:</strong> สำหรับเขียนข้อมูล - Tools → Script editor → Deploy as Web App
            </li>
          </ol>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
            <p className="text-xs text-yellow-800">
              <strong>หมายเหตุ:</strong> Google Sheets API แบบ Read-only ใช้ API Key เพียงอย่างเดียว 
              แต่ถ้าต้องการเขียนข้อมูล ต้องสร้าง Google Apps Script Web App เพิ่มเติม
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-4">
        {/* Spreadsheet ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spreadsheet ID *
          </label>
          <input
            type="text"
            value={spreadsheetId}
            onChange={(e) => setSpreadsheetIdLocal(e.target.value)}
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>คัดลอกจาก URL ของ Google Sheets (ส่วน /d/[SPREADSHEET_ID]/)</p>
            {!sheetIdValid && <div className="text-red-600">รูปแบบ Spreadsheet ID ไม่ถูกต้อง (ควรเป็น A-Z,a-z,0-9,-,_ ความยาว ≥30)</div>}
            {defaultWarning.sheetId && <div className="text-amber-600">กำลังใช้ค่าเริ่มต้นของระบบ แนะนำให้เปลี่ยนเป็นสเปรดชีตของคุณ</div>}
          </div>
        </div>

        {/* Sheet Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sheet Name (ชื่อแท็บ)
          </label>
          <input
            type="text"
            value={sheetName}
            onChange={(e) => setSheetNameLocal(e.target.value)}
            placeholder="WasteData"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            ชื่อของแท็บใน Google Sheets (ค่าเริ่มต้น: WasteData)
          </p>
        </div>

        {/* API Key Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key Status
          </label>
          <div className={`px-4 py-2 rounded-lg border ${
            apiKey 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {apiKey ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span className="text-sm">API Key ตั้งค่าแล้ว (****{apiKey.slice(-4)})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <X className="w-4 h-4" />
                <span className="text-sm">ยังไม่ได้ตั้งค่า API Key ใน .env</span>
              </div>
            )}
          </div>
        </div>

        {/* Web App URL (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google Apps Script Web App URL (ตัวเลือก - สำหรับเขียนข้อมูล)
          </label>
          <input
            type="text"
            value={webAppUrl}
            onChange={(e) => setWebAppUrlLocal(e.target.value)}
            placeholder="https://script.google.com/macros/s/AKfycby.../exec"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>จำเป็นเฉพาะเมื่อต้องการบันทึกข้อมูลไปยัง Google Sheets</p>
            {!webAppValid && <div className="text-red-600">รูปแบบ Web App URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย https://script.google.com/macros/s/.../exec)</div>}
            {defaultWarning.webApp && <div className="text-amber-600">กำลังใช้ Web App URL เริ่มต้นของระบบ ควรเปลี่ยนเป็นของคุณเอง</div>}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSaveSettings}
          disabled={!sheetIdValid || !webAppValid}
          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5" />
          บันทึกการตั้งค่า
        </button>
        <button
          onClick={handleTestConnection}
          disabled={testing || !spreadsheetId || !apiKey || !sheetIdValid}
          className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              กำลังทดสอบ...
            </>
          ) : (
            <>
              <ExternalLink className="w-5 h-5" />
              ทดสอบการเชื่อมต่อ
            </>
          )}
        </button>
        <button
          onClick={handleSyncNow}
          disabled={syncing || !isConfigured || !sheetIdValid}
          className="flex-1 bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {syncing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              กำลังซิงค์...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              ซิงค์ข้อมูลเดี๋ยวนี้
            </>
          )}
        </button>
        <button
          onClick={handleTestWrite}
          disabled={testing || !webAppUrl || !webAppValid}
          className="flex-1 bg-indigo-500 text-white py-2 px-4 rounded-lg hover:bg-indigo-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {testing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              กำลังทดสอบเขียน...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              ทดสอบเขียน (Test Write)
            </>
          )}
        </button>
        <button
          onClick={handleSaveAutoSync}
          disabled={syncing}
          className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-lg hover:bg-emerald-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          บันทึก Auto-sync
        </button>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`p-4 rounded-lg border ${
          testResult.success
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <Check className="w-5 h-5" />
            ) : (
              <X className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Header Row Instructions */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          <Database className="w-5 h-5 text-orange-600" />
          โครงสร้างข้อมูลใน Google Sheets
        </h4>
        {/* Apps Script Snippet */}
        <div className="mt-4 p-4 border rounded-lg bg-white">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-800">Google Apps Script (doPost) — ตัวอย่าง</h4>
            <button
              onClick={() => {
                const snippet = `function doPost(e){\n  try{\n    const payload = JSON.parse(e.postData.contents);\n    // TODO: append to sheet using payload.spreadsheetId and payload.data\n    const result = { success: true, message: 'Appended' };\n    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);\n  }catch(err){\n    const result = { success: false, error: err.message };\n    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);\n  }\n}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(snippet).then(()=> alert('Copied Apps Script snippet to clipboard'));
                } else {
                  alert('Clipboard not available');
                }
              }}
              className="px-3 py-1.5 text-xs bg-emerald-600 text-white rounded-lg"
            >
              Copy Snippet
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-2">วางโค้ดนี้ใน Google Apps Script (Tools → Script editor) แล้ว Deploy as Web App. ให้ตั้ง <strong>Execute as: Me</strong> และ <strong>Who has access: Anyone, even anonymous</strong>.</p>
          <div className="bg-slate-50 p-3 rounded text-xs overflow-x-auto border border-slate-100">
            <code className="text-xs text-gray-800 whitespace-nowrap">
              ID | Year | Month | General Waste (ton) | Organic Waste (ton) | Recyclable Waste (ton) | Hazardous Waste (ton) | Total Waste (ton) | Population | Category | Sub Category | Notes | Created At | Updated At | Created By | Updated By
            </code>
          </div>
          <div className="mt-2 text-xs text-slate-500">ถ้าถูกบล็อกด้วย CORS ให้แน่ใจว่า Web App ถูก deploy แบบ public หรือเรียกจากเซิร์ฟเวอร์ (เช่น PowerShell/curl) แทน</div>
        </div>
      </div>
      {/* Auto-sync Controls */}
      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50">
        <h4 className="font-semibold text-gray-800 mb-2">Auto-sync</h4>
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="autosync" checked={autoSyncEnabled} onChange={(e) => setAutoSyncEnabled(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="autosync" className="text-sm">เปิดการซิงค์อัตโนมัติ</label>
        </div>
        <div className="flex items-center gap-3 mb-3">
          <input type="checkbox" id="silent" checked={silentMode} onChange={(e) => setSilentMode(e.target.checked)} className="w-4 h-4" />
          <label htmlFor="silent" className="text-sm">Silent Mode (ไม่แสดงการแจ้งเตือน)</label>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm">ช่วงเวลา (นาที)</label>
          <input type="number" min={1} value={autoSyncInterval} onChange={(e) => setAutoSyncInterval(parseInt(e.target.value || '0'))} className="w-24 px-2 py-1 border rounded" />
          <div className="text-xs text-slate-500">(ค่าเริ่มต้น 15 = 15 นาที)</div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm">Max Retries</label>
            <input type="number" min={0} value={autoSyncMaxRetries} onChange={(e) => setAutoSyncMaxRetries(parseInt(e.target.value || '0'))} className="w-32 px-2 py-1 border rounded" />
            <div className="text-xs text-slate-500">จำนวนครั้งสูงสุดในการลองใหม่ (เริ่มต้น 3)</div>
          </div>
          <div>
            <label className="text-sm">Base Delay (ms)</label>
            <input type="number" min={100} value={autoSyncBaseDelayMs} onChange={(e) => setAutoSyncBaseDelayMs(parseInt(e.target.value || '0'))} className="w-32 px-2 py-1 border rounded" />
            <div className="text-xs text-slate-500">เวลาเริ่มต้นสำหรับ backoff (มิลลิวินาที)</div>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <label className="text-sm">Backoff Policy</label>
        <select value={backoffPolicy} onChange={(e) => setBackoffPolicy(e.target.value)} className="ml-3 px-2 py-1 border rounded">
          <option value="exponential">Exponential (ค่าเริ่มต้น)</option>
          <option value="linear">Linear</option>
        </select>
        <div className="text-xs text-slate-500 mt-1">เลือกนโยบายการหน่วงเวลาเมื่อ retry (Exponential หรือ Linear)</div>
      </div>
    </div>
  );
}
