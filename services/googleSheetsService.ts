import type { WasteRecord } from '../types';

const CIRCUIT_THRESHOLD = 3;
const CIRCUIT_COOLDOWN_MS = 2 * 60 * 1000; // 2 minutes
const LOCK_TTL_MS = 2 * 60 * 1000; // 2 minutes
const PENDING_MAX = 200;

const SYNC_STATUS_KEY = 'googleSheetsSyncStatus';
const CIRCUIT_KEY = 'googleSheetsCircuitBreaker';
const LOCK_KEY = 'googleSheetsSyncLock';
const WEB_HEALTH_KEY = 'googleSheetsWebHealth';

export const DEFAULT_SPREADSHEET_ID = '1234567890abcdef'; // placeholder
export const DEFAULT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzlKvxGHVocLnSzBtu2Vuvb0uAbZVYYKVWki1sPq7ksNvfCwVwxjOxBYoRp4L9cdog/exec';

interface SheetConfig {
  spreadsheetId: string;
  apiKey: string;
  sheetName?: string;
}

interface SyncStatus {
  lastStatus: 'success' | 'fail' | 'idle';
  lastMessage?: string;
  lastAt?: number;
  lastDurationMs?: number;
  failureStreak?: number;
  circuitOpenUntil?: number;
}

interface PendingItem {
  record: WasteRecord;
  reason?: string;
  storedAt?: number;
  lastError?: string;
}

export interface WebHealth {
  ok: boolean;
  status?: number;
  latencyMs?: number;
  checkedAt: number;
  message?: string;
}

export function getSyncStatus(): SyncStatus {
  try {
    const raw = localStorage.getItem(SYNC_STATUS_KEY);
    return raw ? JSON.parse(raw) as SyncStatus : { lastStatus: 'idle', failureStreak: 0 };
  } catch {
    return { lastStatus: 'idle', failureStreak: 0 };
  }
}
function setSyncStatus(status: Partial<SyncStatus>) {
  const current = getSyncStatus();
  const merged: SyncStatus = { ...current, ...status };
  localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify(merged));
}

function readCircuit() {
  try {
    const raw = localStorage.getItem(CIRCUIT_KEY);
    return raw ? JSON.parse(raw) as { failureStreak: number; circuitOpenUntil?: number } : { failureStreak: 0 };
  } catch {
    return { failureStreak: 0 };
  }
}

function writeCircuit(data: { failureStreak: number; circuitOpenUntil?: number }) {
  localStorage.setItem(CIRCUIT_KEY, JSON.stringify(data));
}

function ensureCircuitAvailable() {
  const circuit = readCircuit();
  const now = Date.now();
  if (circuit.circuitOpenUntil && circuit.circuitOpenUntil > now) {
    const waitMs = circuit.circuitOpenUntil - now;
    throw new Error(`พักการซิงค์ชั่วคราว (circuit open) กรุณาลองใหม่ภายใน ${Math.ceil(waitMs / 1000)} วินาที`);
  }
  if (circuit.circuitOpenUntil && circuit.circuitOpenUntil <= now) {
    // cool-down finished, reset streak but keep info
    writeCircuit({ failureStreak: 0 });
    setSyncStatus({ circuitOpenUntil: undefined, failureStreak: 0 });
  }
}

function recordSuccess(durationMs: number, message: string) {
  writeCircuit({ failureStreak: 0 });
  setSyncStatus({ lastStatus: 'success', lastMessage: message, lastAt: Date.now(), lastDurationMs: durationMs, failureStreak: 0, circuitOpenUntil: undefined });
}

function recordFailure(message: string) {
  const circuit = readCircuit();
  const newStreak = (circuit.failureStreak || 0) + 1;
  if (newStreak >= CIRCUIT_THRESHOLD) {
    const openUntil = Date.now() + CIRCUIT_COOLDOWN_MS;
    writeCircuit({ failureStreak: 0, circuitOpenUntil: openUntil });
    setSyncStatus({ lastStatus: 'fail', lastMessage: message, lastAt: Date.now(), failureStreak: newStreak, circuitOpenUntil: openUntil });
  } else {
    writeCircuit({ failureStreak: newStreak });
    setSyncStatus({ lastStatus: 'fail', lastMessage: message, lastAt: Date.now(), failureStreak: newStreak });
  }
}

export function isLockStuck(): boolean {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { expiresAt: number; startedAt: number };
    const now = Date.now();
    return parsed.expiresAt && parsed.expiresAt <= now;
  } catch {
    return false;
  }
}

export function clearStuckLock(): void {
  localStorage.removeItem(LOCK_KEY);
  console.log('✓ cleared stuck sync lock');
}

function acquireLockOrThrow() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    const now = Date.now();
    if (raw) {
      const parsed = JSON.parse(raw) as { expiresAt: number; startedAt: number };
      if (parsed.expiresAt && parsed.expiresAt > now) {
        throw new Error('กำลังซิงค์อยู่แล้ว โปรดลองใหม่อีกครั้งภายหลัง');
      } else if (parsed.expiresAt && parsed.expiresAt <= now) {
        // auto-cleanup stale lock
        localStorage.removeItem(LOCK_KEY);
        console.warn('✓ cleaned up stale sync lock');
      }
    }
    const payload = { startedAt: now, expiresAt: now + LOCK_TTL_MS };
    localStorage.setItem(LOCK_KEY, JSON.stringify(payload));
    return () => localStorage.removeItem(LOCK_KEY);
  } catch (err) {
    throw err instanceof Error ? err : new Error(String(err));
  }
}

export function getPendingRecords(): PendingItem[] {
  return loadPending();
}

export function getPendingCount(): number {
  return getPendingRecords().length;
}

function loadPending(): PendingItem[] {
  try {
    const raw = localStorage.getItem('pendingGoogleSheetsSyncRecords') || '[]';
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item: any) => {
      if (item && item.record) return item as PendingItem;
      return { record: item } as PendingItem;
    });
  } catch {
    return [];
  }
}

function savePending(list: PendingItem[]) {
  localStorage.setItem('pendingGoogleSheetsSyncRecords', JSON.stringify(list));
}

export function isCircuitOpen(): boolean {
  const status = getSyncStatus();
  return !!(status.circuitOpenUntil && status.circuitOpenUntil > Date.now());
}

export function getWebHealth(): WebHealth | null {
  try {
    const raw = localStorage.getItem(WEB_HEALTH_KEY);
    return raw ? JSON.parse(raw) as WebHealth : null;
  } catch {
    return null;
  }
}

export async function pingWebApp(timeoutMs = 5000): Promise<WebHealth> {
  const webAppUrl = (localStorage.getItem('googleSheetsWebAppUrl') || DEFAULT_WEB_APP_URL).trim();
  if (!webAppUrl) throw new Error('Web App URL not set');
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const started = Date.now();
  let timeoutId: any = null;
  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }
  let ok = false;
  let status: number | undefined = undefined;
  let message = '';
  try {
    const res = await fetch(webAppUrl, { method: 'HEAD', signal: controller ? controller.signal : undefined, mode: 'no-cors' });
    status = (res as any).status || undefined;
    ok = true; // HEAD + no-cors may not expose status
  } catch (e) {
    // fallback GET without body
    try {
      const res = await fetch(webAppUrl, { method: 'GET', signal: controller ? controller.signal : undefined, mode: 'no-cors' });
      status = (res as any).status || undefined;
      ok = true;
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  const latencyMs = Date.now() - started;
  const result: WebHealth = { ok, status, latencyMs, checkedAt: Date.now(), message: ok ? 'reachable' : message || 'unreachable' };
  localStorage.setItem(WEB_HEALTH_KEY, JSON.stringify(result));
  return result;
}
export async function flushPendingRecords(): Promise<{ success: number; failed: number; errors: string[] }> {
  const pending = getPendingRecords();
  if (pending.length === 0) return { success: 0, failed: 0, errors: [] };

  ensureCircuitAvailable();
  const releaseLock = acquireLockOrThrow();
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    const failedItems: PendingItem[] = [];
    for (const item of pending) {
      try {
        await saveRecordToSheetsWithRetry(item.record);
        success++;
      } catch (err) {
        failed++;
        failedItems.push({ ...item, lastError: err instanceof Error ? err.message : String(err) });
        errors.push(err instanceof Error ? err.message : String(err));
      }
    }
    savePending(failedItems);
    const duration = 0;
    recordSuccess(duration, `ส่งคิวค้างสำเร็จ ${success}/${pending.length} รายการ`);
    if (failed > 0) {
      recordFailure(`ยังค้าง ${failed} รายการ`);
    }
    return { success, failed, errors };
  } finally {
    releaseLock();
  }
}

/**
 * ตรวจสอบว่ามีการตั้งค่า Google Sheets หรือไม่
 */
export function isGoogleSheetsConfigured(): boolean {
  // ยืดหยุ่น: ใช้ default Spreadsheet ID หรือ localStorage
  const spreadsheetId = localStorage.getItem('googleSheetsSpreadsheetId') || DEFAULT_SPREADSHEET_ID;
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  return !!(spreadsheetId && apiKey);
}

/**
 * ตั้งค่า Spreadsheet ID
 */
export function setSpreadsheetId(spreadsheetId: string): void {
  localStorage.setItem('googleSheetsSpreadsheetId', spreadsheetId);
}

/**
 * ดึง Spreadsheet ID ปัจจุบัน
 */
export function getSpreadsheetId(): string {
  return localStorage.getItem('googleSheetsSpreadsheetId') || DEFAULT_SPREADSHEET_ID;
}

/**
 * แปลง WasteRecord เป็น array สำหรับ Google Sheets row
 */
function recordToSheetRow(record: WasteRecord): any[] {
  return [
    record.id,
    record.year,
    record.month,
    record.generalWaste || 0,
    record.organicWaste || 0,
    record.recyclableWaste || 0,
    record.hazardousWaste || 0,
    record.totalWaste || 0,
    record.population || 0,
    record.category || '',
    record.subCategory || '',
    record.notes || '',
    record.createdAt || new Date().toISOString(),
    record.updatedAt || new Date().toISOString(),
    record.createdBy || '',
    record.updatedBy || ''
  ];
}

/**
 * แปลง Google Sheets row เป็น WasteRecord
 */
function sheetRowToRecord(row: any[]): WasteRecord | null {
  if (!row || row.length < 8) return null;
  
  return {
    id: row[0] || '',
    year: parseInt(row[1]) || new Date().getFullYear(),
    month: parseInt(row[2]) || 1,
    generalWaste: parseFloat(row[3]) || 0,
    organicWaste: parseFloat(row[4]) || 0,
    recyclableWaste: parseFloat(row[5]) || 0,
    hazardousWaste: parseFloat(row[6]) || 0,
    totalWaste: parseFloat(row[7]) || 0,
    population: parseInt(row[8]) || 0,
    category: row[9] || undefined,
    subCategory: row[10] || undefined,
    notes: row[11] || undefined,
    createdAt: row[12] || new Date().toISOString(),
    updatedAt: row[13] || new Date().toISOString(),
    createdBy: row[14] || undefined,
    updatedBy: row[15] || undefined
  };
}

/**
 * สร้าง header row สำหรับ Google Sheets (ถ้ายังไม่มี)
 */
async function ensureHeaderRow(config: SheetConfig): Promise<void> {
  const { spreadsheetId, apiKey, sheetName = 'WasteData' } = config;
  
  try {
    // ตรวจสอบว่ามี sheet อยู่หรือไม่
    const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const checkResponse = await fetch(checkUrl);
    
    if (!checkResponse.ok) {
      throw new Error('ไม่สามารถเข้าถึง Google Sheets ได้ กรุณาตรวจสอบ Spreadsheet ID และ API Key');
    }

    const spreadsheet = await checkResponse.json();
    const sheet = spreadsheet.sheets?.find((s: any) => s.properties.title === sheetName);
    
    if (!sheet) {
      console.warn(`Sheet "${sheetName}" ไม่พบ จะใช้ sheet แรกแทน`);
    }

    // ตรวจสอบว่ามี header หรือไม่
    const range = `${sheetName}!A1:P1`;
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    const readResponse = await fetch(readUrl);
    const data = await readResponse.json();

    if (!data.values || data.values.length === 0) {
      // ยังไม่มี header ให้สร้าง
      const headers = [
        'ID', 'Year', 'Month', 'General Waste (ton)', 'Organic Waste (ton)', 
        'Recyclable Waste (ton)', 'Hazardous Waste (ton)', 'Total Waste (ton)',
        'Population', 'Category', 'Sub Category', 'Notes', 
        'Created At', 'Updated At', 'Created By', 'Updated By'
      ];

      console.log('กำลังสร้าง header row...');
      // Note: การเขียนต้องใช้ Google Apps Script หรือ OAuth2
      // สำหรับตอนนี้จะแจ้งเตือนให้ผู้ใช้สร้างเองก่อน
      console.warn('กรุณาสร้าง header row ใน Google Sheets ด้วยตนเอง:', headers);
    }
  } catch (error) {
    console.error('Error ensuring header row:', error);
    throw error;
  }
}
/**
 * ตรวจสอบและจัดการเครือข่าย/การเชื่อมต่อ
 */
function isNetworkError(error: any): boolean {
  return (
    error?.message?.includes('NetworkError') ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('timeout') ||
    error?.message?.includes('CORS') ||
    (error instanceof TypeError && error.message.includes('Failed to fetch'))
  );
}

/**
 * บันทึกข้อมูลไปยัง Google Sheets (ต้องใช้ Google Apps Script Web App)
 * เนื่องจาก Google Sheets API ต้องการ OAuth2 สำหรับการเขียนข้อมูล
 */
export async function saveRecordToSheets(record: WasteRecord): Promise<boolean> {
  const spreadsheetId = getSpreadsheetId();
  const webAppUrl = (localStorage.getItem('googleSheetsWebAppUrl') || DEFAULT_WEB_APP_URL).trim();

  if (!webAppUrl) {
    throw new Error('กรุณาตั้งค่า Google Apps Script Web App URL ก่อนใช้งาน');
  }

  // Basic URL validation
  try {
    // eslint-disable-next-line no-new
    new URL(webAppUrl);
  } catch (e) {
    throw new Error('Web App URL ไม่ถูกต้อง กรุณาตรวจสอบและใส่ URL ที่เริ่มต้นด้วย https://');
  }

  const payload = {
    action: 'append',
    spreadsheetId,
    data: recordToSheetRow(record)
  };

  // Use AbortController to enforce timeout
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = 15000;
  let timeoutId: any = null;
  if (controller) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  try {
    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Opaque responses (type === 'opaque' or status 0) usually indicate CORS/no-cors issues
    if ((response as any).type === 'opaque' || response.status === 0) {
      throw new Error('ได้รับการตอบกลับแบบ opaque (เป็นไปได้ว่าเกิดปัญหา CORS). กรุณาตรวจสอบการตั้งค่า Web App: ต้อง deploy เป็น "Anyone, even anonymous" และให้ Web App ส่งค่า CORS (Access-Control-Allow-Origin)');
    }

    if (!response.ok) {
      // Try to parse error body for helpful message
      let bodyText = '';
      try {
        const json = await response.json();
        bodyText = JSON.stringify(json);
      } catch (e) {
        try { bodyText = await response.text(); } catch { bodyText = response.statusText; }
      }
      throw new Error(`Web App ตอบกลับสถานะ ${response.status}: ${bodyText}`);
    }

    // Optionally parse JSON result and respect its success flag
    try {
      const result = await response.json();
      if (result && (result.success === false || result.error)) {
        throw new Error(result.message || result.error || 'Web App รายงานสถานะล้มเหลว');
      }
    } catch (e) {
      // If parsing failed, it's ok as long as response.ok was true
    }

    console.log('บันทึกข้อมูลไปยัง Google Sheets สำเร็จ');
    return true;
  } catch (error) {
    if ((error as any)?.name === 'AbortError') {
      throw new Error('Request to Google Apps Script Web App ถูกยกเลิก (timeout)');
    }
    console.error('Error saving to Google Sheets:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Save with retry/backoff wrapper. Reads settings from localStorage:
 * - googleSheetsAutoSyncMaxRetries
 * - googleSheetsAutoSyncBaseDelayMs
 * - googleSheetsAutoSyncBackoff
 */
export async function saveRecordToSheetsWithRetry(record: WasteRecord): Promise<boolean> {
  const maxRetries = parseInt(localStorage.getItem('googleSheetsAutoSyncMaxRetries') || '3', 10);
  const baseDelayMs = parseInt(localStorage.getItem('googleSheetsAutoSyncBaseDelayMs') || '1000', 10);
  const backoffPolicy = localStorage.getItem('googleSheetsAutoSyncBackoff') || 'exponential';

  for (let attempt = 0; attempt < Math.max(1, maxRetries); attempt++) {
    try {
      return await saveRecordToSheets(record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (!isLastAttempt) {
        const jitter = Math.floor(Math.random() * 300);
        let delay = 0;
        if (backoffPolicy === 'linear') {
          delay = baseDelayMs * (attempt + 1) + jitter;
        } else {
          delay = baseDelayMs * Math.pow(2, attempt) + jitter;
        }
        console.warn(`✓ การส่ง attempt ${attempt + 1}/${maxRetries} ล้มเหลว, พยายามอีกครั้งใน ${delay}ms`);
        await new Promise(res => setTimeout(res, delay));
        continue;
      }
      
      // สำหรับครั้งสุดท้าย ลองส่งแบบไม่ retry อีก
      console.warn(`✓ ครั้งสุดท้าย attempt ${attempt + 1}/${maxRetries} ล้มเหลว, ส่งข้อมูลเข้า localStorage แทน`);
      try {
        // บันทึกไว้ใน localStorage เพื่อส่งอีกครั้งในภายหลัง
        const pendingList = loadPending();
        const exists = pendingList.find((r) => r.record?.id === record.id);
        if (!exists) {
          const reason = isNetworkError(err) ? 'network' : 'remote';
          pendingList.push({ record, reason, storedAt: Date.now(), lastError: msg });
          // enforce cap
          if (pendingList.length > PENDING_MAX) {
            pendingList.splice(0, pendingList.length - PENDING_MAX);
          }
          savePending(pendingList);
          console.log(`✓ ข้อมูล ${record.id} ถูกบันทึกรอส่งใน localStorage (${pendingList.length}/${PENDING_MAX})`);
        }
        return true; // ถือว่าสำเร็จ แม้ยังไม่ถูกส่งไป
      } catch (storageErr) {
        console.error('Error storing pending record:', storageErr);
        throw err instanceof Error ? err : new Error(String(err));
      }
    }
  }
  return false;
}

/**
 * Test writing a sample payload to a Web App URL (used by UI). Returns parsed JSON or throws.
 */
export async function testWriteToWebApp(webAppUrl: string, spreadsheetIdParam?: string): Promise<any> {
  const webApp = (webAppUrl || localStorage.getItem('googleSheetsWebAppUrl') || '').trim();
  const spreadsheetId = spreadsheetIdParam || getSpreadsheetId();

  if (!webApp) throw new Error('Web App URL not set');
  try { new URL(webApp); } catch { throw new Error('Web App URL ไม่ถูกต้อง'); }

  const payload = {
    action: 'append',
    spreadsheetId,
    sheetName: getSheetName(),
    data: ['test-write', new Date().getFullYear(), new Date().getMonth() + 1, 0]
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = 10000;
  let timeoutId: any = null;
  if (controller) timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const resp = await fetch(webApp, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: controller ? controller.signal : undefined
  });

  if (timeoutId) clearTimeout(timeoutId);
  if ((resp as any).type === 'opaque' || resp.status === 0) throw new Error('Opaque response (CORS/no-cors issue)');
  if (!resp.ok) {
    let bodyText = '';
    try { bodyText = JSON.stringify(await resp.json()); } catch { bodyText = await resp.text().catch(() => resp.statusText); }
    throw new Error(`Web App status ${resp.status}: ${bodyText}`);
  }
  try {
    return await resp.json();
  } catch {
    return { success: true, message: 'OK (no JSON body)' };
  }
}

/**
 * ดึงข้อมูลทั้งหมดจาก Google Sheets
 */
export async function fetchRecordsFromSheets(): Promise<WasteRecord[]> {
  const spreadsheetId = getSpreadsheetId();
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  const sheetName = localStorage.getItem('googleSheetsSheetName') || 'WasteData';
  
  if (!spreadsheetId || !apiKey) {
    throw new Error('กรุณาตั้งค่า Google Sheets ก่อนใช้งาน');
  }

  try {
    // ดึงข้อมูลทั้งหมด (ข้าม header row)
    const range = `${sheetName}!A2:P`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'ไม่สามารถดึงข้อมูลจาก Google Sheets ได้');
    }

    const data = await response.json();
    
    if (!data.values || data.values.length === 0) {
      return [];
    }

    const records = data.values
      .map(sheetRowToRecord)
      .filter((record): record is WasteRecord => record !== null);

    console.log(`ดึงข้อมูล ${records.length} รายการจาก Google Sheets`);
    return records;
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw error;
  }
}

/**
 * ซิงค์ข้อมูล Local Storage กับ Google Sheets
 * 1. ดึงข้อมูลจาก Google Sheets
 * 2. ผสานกับ local records
 * 3. ส่งข้อมูล local ที่ใหม่กว่า/ใหม่ไปยัง Google Sheets
 */
export async function syncWithGoogleSheets(localRecords: WasteRecord[]): Promise<WasteRecord[]> {
  ensureCircuitAvailable();
  const releaseLock = acquireLockOrThrow();
  const startedAt = Date.now();
  try {
    let sheetRecords: WasteRecord[] = [];
    
    // ขั้นที่ 1: ดึงข้อมูลจาก Google Sheets
    try {
      sheetRecords = await fetchRecordsFromSheets();
      console.log(`✓ ดึงข้อมูล ${sheetRecords.length} รายการจาก Google Sheets`);
    } catch (error) {
      console.warn('✓ ไม่สามารถดึงข้อมูลจาก Google Sheets ชั่วคราว, ใช้ข้อมูล local:', error);
      // ถ้าไม่สามารถอ่านจาก sheets ได้ ก็ยังดำเนินการต่อได้
    }
    
    // ขั้นที่ 2: ผสานข้อมูล
    const recordMap = new Map<string, WasteRecord>();
    
    // เพิ่มข้อมูลจาก Google Sheets ก่อน
    sheetRecords.forEach(record => {
      recordMap.set(record.id, record);
    });
    
    // อัปเดตด้วยข้อมูล local ที่ใหม่กว่า
    const newOrUpdatedRecords: WasteRecord[] = [];
    localRecords.forEach(localRecord => {
      const sheetRecord = recordMap.get(localRecord.id);
      if (!sheetRecord || new Date(localRecord.updatedAt || 0) > new Date(sheetRecord.updatedAt || 0)) {
        recordMap.set(localRecord.id, localRecord);
        newOrUpdatedRecords.push(localRecord); // ติดตามว่ารายการไหนใหม่/ถูกอัปเดต
      }
    });
    
    // ขั้นที่ 3: ส่งข้อมูล local ที่ใหม่กว่า/ใหม่ไปยัง Google Sheets
    if (newOrUpdatedRecords.length > 0) {
      console.log(`✓ ส่ง ${newOrUpdatedRecords.length} รายการที่ใหม่/อัปเดตไปยัง Google Sheets`);
      
      // ส่งแต่ละรายการแบบ sequential เพื่อหลีกเลี่ยง rate limiting
      let successCount = 0;
      let failCount = 0;
      
      for (const record of newOrUpdatedRecords) {
        try {
          await saveRecordToSheetsWithRetry(record);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`✓ ส่งข้อมูล ${record.id} ไม่สำเร็จ:`, error);
          // อย่างไรก็ตาม ยังคงส่งต่อเนื่องสำหรับรายการถัดไป
        }
      }
      
      console.log(`✓ สรุป: สำเร็จ ${successCount}/${newOrUpdatedRecords.length} รายการ`);
    } else {
      console.log('✓ ไม่มีข้อมูลใหม่ที่ต้องส่ง');
    }
    const duration = Date.now() - startedAt;
    recordSuccess(duration, `ซิงค์สำเร็จ ${Array.from(recordMap.values()).length} รายการ`);
    return Array.from(recordMap.values());
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    recordFailure(msg);
    console.error('✓ Error syncing with Google Sheets:', error);
    throw error;
  } finally {
    releaseLock();
  }
}

/**
 * ตั้งค่า Web App URL สำหรับการเขียนข้อมูล
 */
export function setWebAppUrl(url: string): void {
  localStorage.setItem('googleSheetsWebAppUrl', url);
}

/**
 * ดึง Web App URL
 */
export function getWebAppUrl(): string {
  return localStorage.getItem('googleSheetsWebAppUrl') || '';
}

/**
 * ตั้งค่าชื่อ Sheet
 */
export function setSheetName(name: string): void {
  localStorage.setItem('googleSheetsSheetName', name);
}

/**
 * ดึงชื่อ Sheet
 */
export function getSheetName(): string {
  return localStorage.getItem('googleSheetsSheetName') || 'WasteData';
}

/**
 * ทดสอบการเชื่อมต่อ Google Sheets
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  const spreadsheetId = getSpreadsheetId();
  const apiKey = import.meta.env.VITE_GOOGLE_SHEETS_API_KEY;
  
  if (!spreadsheetId) {
    return { success: false, message: 'กรุณาระบุ Spreadsheet ID' };
  }
  
  if (!apiKey) {
    return { success: false, message: 'กรุณาตั้งค่า VITE_GOOGLE_SHEETS_API_KEY ใน .env' };
  }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.json();
      return { 
        success: false, 
        message: error.error?.message || 'ไม่สามารถเชื่อมต่อได้' 
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      message: `เชื่อมต่อสำเร็จ: ${data.properties.title}` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ' 
    };
  }
}
