import{N as K}from"./vendor-BO12qksW.js";import{T as l}from"./types-BFuqyHc6.js";const p=()=>localStorage.getItem("gemini_api_key")||void 0,y=new K({apiKey:p()||""}),f=async o=>{if(!p())return"กรุณาตั้งค่า API Key ที่เมนู Settings (รูปเฟือง) ก่อนใช้งาน";const a=[...o].sort((c,u)=>u.timestamp-c.timestamp).slice(0,3);if(a.length<2)return"ข้อมูลยังไม่เพียงพอสำหรับการวิเคราะห์เบื้องต้น";const t=a[0],i=a[1],e=(t.amountKg-i.amountKg)/i.amountKg*100,n=t.population>0?t.amountKg/t.population/30:0,g=`
    คุณคือผู้เชี่ยวชาญด้านการจัดการสิ่งแวดล้อม ของเทศบาลตำบลเมืองศรีไค
    
    ข้อมูลสถานการณ์ล่าสุด (${l[t.month-1]} ${t.year}):
    - ปริมาณขยะ: ${(t.amountKg/1e3).toFixed(2)} ตัน (${e>0?"+":""}${e.toFixed(1)}%)
    - อัตราการเกิดขยะ: ${n.toFixed(3)} กก./คน/วัน (ค่ามาตรฐานควรอยู่ที่ 0.8 - 1.2)
    
    โจทย์:
    1. วิเคราะห์ "อัตราการเกิดขยะ" (Waste Generation Rate) ว่าอยู่ในเกณฑ์ดีหรือน่าเป็นห่วง
    2. หากเกิน 1.2 กก./คน/วัน ให้เตือนเรื่องพฤติกรรมการทิ้งขยะ หรือกิจกรรมพิเศษในพื้นที่
    3. แนะนำ 1 มาตรการสั้นๆ
    
    ตอบเป็นภาษาไทย ความยาวไม่เกิน 2-3 ประโยค เน้นวิเคราะห์ประสิทธิภาพ
  `;try{return(await y.models.generateContent({model:"gemini-2.5-flash",contents:g})).text||"ไม่สามารถวิเคราะห์ข้อมูลได้"}catch{return"ระบบ AI ขัดข้องชั่วคราว"}},x=async(o,s,a,t)=>{if(!p())return"กรุณาตั้งค่า API Key ที่เมนู Settings (รูปเฟือง) ก่อนใช้งาน";const e=s.reduce((r,m)=>r+m.amountKg,0),n=t.reduce((r,m)=>r+m.amountKg,0),g=((e-n)/n*100).toFixed(1),c=s.reduce((r,m)=>r+m.population,0)/s.length||1,u=e/12/30/c,d=`
    วิเคราะห์เปรียบเทียบขยะเทศบาลเมืองศรีไค:
    ปี ${o}: รวม ${(e/1e3).toFixed(2)} ตัน (เฉลี่ย ${u.toFixed(3)} กก./คน/วัน)
    ปี ${a}: รวม ${(n/1e3).toFixed(2)} ตัน
    ผลต่าง: ${g}%

    ช่วยวิเคราะห์ว่าประสิทธิภาพการจัดการขยะดีขึ้นหรือแย่ลง โดยดูจากยอดรวมและอัตราการเกิดขยะ ตอบสั้นๆ 2-3 ประโยค
  `;try{return(await y.models.generateContent({model:"gemini-2.5-flash",contents:d})).text||"ไม่สามารถวิเคราะห์ข้อมูลเปรียบเทียบได้"}catch{return"ระบบ AI ขัดข้องชั่วคราว"}},A=async o=>{if(!p())return"ไม่พบ API Key กรุณาไปที่เมนู Settings (มุมซ้ายล่าง) เพื่อตั้งค่า Gemini API Key";if(o.length===0)return"ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์";const i=`
    คุณเป็นที่ปรึกษาด้านสิ่งแวดล้อมและการจัดการของเสีย ประจำเทศบาลตำบลเมืองศรีไค จังหวัดอุบลราชธานี
    
    หน้าที่: เขียนรายงานผู้บริหาร (Executive Report)
    
    ข้อมูลสถิติ:
    ${[...o].sort((e,n)=>e.year!==n.year?e.year-n.year:e.month-n.month).map(e=>`- ${l[e.month-1]} ${e.year}: ${(e.amountKg/1e3).toFixed(2)} ตัน (${(e.amountKg/e.population/30).toFixed(3)} กก./คน/วัน)`).join(`
`)}

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
  `;try{return(await y.models.generateContent({model:"gemini-2.5-flash",contents:i,config:{temperature:.7}})).text||"ไม่สามารถสร้างรายงานได้ในขณะนี้"}catch(e){return console.error("Gemini Error:",e),"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI (กรุณาตรวจสอบ API Key หรือสัญญาณอินเทอร์เน็ต)"}};export{f as a,A as b,x as g};
