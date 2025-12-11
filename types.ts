
export enum WasteUnit {
  KG = 'กิโลกรัม',
  TON = 'ตัน'
}

export interface WasteComposition {
  general: number;   // ขยะทั่วไป (kg)
  organic: number;   // ขยะอินทรีย์ (kg)
  recycle: number;   // ขยะรีไซเคิล (kg)
  hazardous: number; // ขยะอันตราย (kg)
}

export interface WasteRecord {
  id: string;
  month: number; // 1-12
  year: number; // Buddhist Era (e.g., 2567) or Christian Era (2024)
  
  // Individual waste types (in tons)
  generalWaste?: number;       // ขยะทั่วไป (ตัน)
  organicWaste?: number;       // ขยะอินทรีย์ (ตัน)
  recyclableWaste?: number;    // ขยะรีไซเคิล (ตัน)
  hazardousWaste?: number;     // ขยะอันตราย (ตัน)
  totalWaste?: number;         // ปริมาณขยะรวม (ตัน)
  
  // Legacy support
  amountKg?: number;           // Stored consistently in KG (for backward compatibility)
  composition?: WasteComposition;
  
  // Demographics
  population?: number;
  
  // Metadata
  category?: string;           // หมวดหมู่ (e.g., ศูนย์การศึกษา)
  subCategory?: string;        // หมวดหมู่ย่อย
  note?: string;               // หมายเหตุ (legacy)
  notes?: string;              // หมายเหตุ (new)
  
  // Timestamps
  createdAt?: string;          // ISO 8601 date (e.g., 2025-12-04T10:30:00Z)
  updatedAt?: string;          // ISO 8601 date
  timestamp?: number;          // Unix timestamp (legacy)
  
  // User tracking
  createdBy?: string;          // ผู้บันทึกข้อมูล
  updatedBy?: string;          // ผู้แก้ไขล่าสุด
  recorderName?: string;       // (legacy)
  recorderPosition?: string;   // (legacy)
}

export interface AnalysisResponse {
  summary: string;
  trends: string;
  recommendations: string;
  riskAssessment: 'Low' | 'Medium' | 'High';
}

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'danger';
  message: string;
  date: string;
}

export interface AuditLog {
  id: string;
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'AUTO_SYNC_SUCCESS' | 'AUTO_SYNC_FAIL' | 'AUTO_SYNC_RETRY' | 'AUTO_SYNC_SKIP';
  details: string;
  timestamp: number;
  user: string;
}

export interface IdentityProfile {
  name: string;
  position: string;
}

export const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const THAI_MONTHS_ABBR = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."
];
