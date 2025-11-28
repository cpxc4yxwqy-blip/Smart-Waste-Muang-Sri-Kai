import { GoogleGenAI } from "@google/genai";
import { WasteRecord, THAI_MONTHS } from '../types';

const getApiKey = () => {
  const localKey = localStorage.getItem('gemini_api_key');
  return localKey || process.env.API_KEY;
};

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: getApiKey() || '' });

export const generateDashboardInsight = async (records: WasteRecord[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "กรุณาตั้งค่า API Key ที่เมนู Settings (รูปเฟือง) ก่อนใช้งาน";

  // Get last 3 records for quick trend analysis
  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  if (sorted.length < 2) return "ข้อมูลยังไม่เพียงพอสำหรับการวิเคราะห์เบื้องต้น";

  const latest = sorted[0];
  const prev = sorted[1];
  const change = ((latest.amountKg - prev.amountKg) / prev.amountKg) * 100;
  const rate = latest.population > 0 ? (latest.amountKg / latest.population / 30) : 0;

  const prompt = `
    คุณคือผู้เชี่ยวชาญด้านการจัดการสิ่งแวดล้อม ของเทศบาลตำบลเมืองศรีไค
    
    ข้อมูลสถานการณ์ล่าสุด (${THAI_MONTHS[latest.month - 1]} ${latest.year}):
    - ปริมาณขยะ: ${(latest.amountKg / 1000).toFixed(2)} ตัน (${change > 0 ? '+' : ''}${change.toFixed(1)}%)
    - อัตราการเกิดขยะ: ${rate.toFixed(3)} กก./คน/วัน (ค่ามาตรฐานควรอยู่ที่ 0.8 - 1.2)
    
    โจทย์:
    1. วิเคราะห์ "อัตราการเกิดขยะ" (Waste Generation Rate) ว่าอยู่ในเกณฑ์ดีหรือน่าเป็นห่วง
    2. หากเกิน 1.2 กก./คน/วัน ให้เตือนเรื่องพฤติกรรมการทิ้งขยะ หรือกิจกรรมพิเศษในพื้นที่
    3. แนะนำ 1 มาตรการสั้นๆ
    
    ตอบเป็นภาษาไทย ความยาวไม่เกิน 2-3 ประโยค เน้นวิเคราะห์ประสิทธิภาพ
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "ไม่สามารถวิเคราะห์ข้อมูลได้";
  } catch (error) {
    return "ระบบ AI ขัดข้องชั่วคราว";
  }
};

export const generateComparisonInsight = async (
  year1: number,
  records1: WasteRecord[],
  year2: number,
  records2: WasteRecord[]
): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "กรุณาตั้งค่า API Key ที่เมนู Settings (รูปเฟือง) ก่อนใช้งาน";

  const total1 = records1.reduce((sum, r) => sum + r.amountKg, 0);
  const total2 = records2.reduce((sum, r) => sum + r.amountKg, 0);
  const diffPercent = ((total1 - total2) / total2 * 100).toFixed(1);

  // Calculate Avg Rate
  const avgPop1 = records1.reduce((sum, r) => sum + r.population, 0) / records1.length || 1;
  const rate1 = (total1 / 12 / 30) / avgPop1; // Approx annual avg

  const prompt = `
    วิเคราะห์เปรียบเทียบขยะเทศบาลเมืองศรีไค:
    ปี ${year1}: รวม ${(total1 / 1000).toFixed(2)} ตัน (เฉลี่ย ${rate1.toFixed(3)} กก./คน/วัน)
    ปี ${year2}: รวม ${(total2 / 1000).toFixed(2)} ตัน
    ผลต่าง: ${diffPercent}%

    ช่วยวิเคราะห์ว่าประสิทธิภาพการจัดการขยะดีขึ้นหรือแย่ลง โดยดูจากยอดรวมและอัตราการเกิดขยะ ตอบสั้นๆ 2-3 ประโยค
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "ไม่สามารถวิเคราะห์ข้อมูลเปรียบเทียบได้";
  } catch (error) {
    return "ระบบ AI ขัดข้องชั่วคราว";
  }
};

export const generateMayorReport = async (records: WasteRecord[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return "ไม่พบ API Key กรุณาไปที่เมนู Settings (มุมซ้ายล่าง) เพื่อตั้งค่า Gemini API Key";
  }

  if (records.length === 0) {
    return "ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์";
  }

  // Sort records by date (Year then Month)
  const sortedRecords = [...records].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  // Prepare data summary for the prompt
  const dataSummary = sortedRecords.map(r =>
    `- ${THAI_MONTHS[r.month - 1]} ${r.year}: ${(r.amountKg / 1000).toFixed(2)} ตัน (${(r.amountKg / r.population / 30).toFixed(3)} กก./คน/วัน)`
  ).join('\n');

  const prompt = `
    คุณเป็นที่ปรึกษาด้านสิ่งแวดล้อมและการจัดการของเสีย ประจำเทศบาลตำบลเมืองศรีไค จังหวัดอุบลราชธานี
    
    หน้าที่: เขียนรายงานผู้บริหาร (Executive Report)
    
    ข้อมูลสถิติ:
    ${dataSummary}

    โครงสร้างรายงาน (Markdown):
    
    ## 1. สรุปสถานการณ์ภาพรวม (Executive Summary)
    สรุปทิศทางปริมาณขยะ และ "อัตราการเกิดขยะต่อหัว" (Per Capita Generation Rate) ว่าสูงหรือต่ำกว่าเกณฑ์มาตรฐาน (1.0-1.2)

    ## 2. วิเคราะห์ประสิทธิภาพ (Efficiency Analysis)
    - เจาะลึกเดือนที่พีคที่สุด สาเหตุที่เป็นไปได้ (เทศกาล, เปิดเทอม)
    - เปรียบเทียบภาระงานจัดเก็บขยะ

    ## 3. การประเมินความเสี่ยง (Risk Assessment)
    - ความเสี่ยงด้านบ่อฝังกลบ
    - ความเสี่ยงด้านงบประมาณ

    ## 4. ข้อเสนอแนะเชิงนโยบาย (Strategic Recommendations)
    เสนอ 3 มาตรการรูปธรรม (เช่น โครงการธนาคารขยะ, การแยกขยะเปียก) ที่ลดปริมาณขยะที่ต้นทางได้จริง
    
    สไตล์: มืออาชีพ กระชับ ข้อมูลแน่น
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "ไม่สามารถสร้างรายงานได้ในขณะนี้";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI (กรุณาตรวจสอบ API Key หรือสัญญาณอินเทอร์เน็ต)";
  }
};