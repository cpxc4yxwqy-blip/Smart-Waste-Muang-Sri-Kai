
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
  year: number; // Buddhist Era (e.g., 2567)
  amountKg: number; // Stored consistently in KG
  population: number;
  timestamp: number;
  recorderName?: string;
  recorderPosition?: string;
  composition?: WasteComposition; // New: Waste breakdown
  note?: string; // New: Remarks/Context
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
  action: 'ADD' | 'UPDATE' | 'DELETE' | 'IMPORT';
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
