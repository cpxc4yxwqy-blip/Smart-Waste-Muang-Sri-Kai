import{Q as y}from"./vendor-cb0Ax4j1.js";import{T as l}from"./types-BFuqyHc6.js";const m=()=>localStorage.getItem("gemini_api_key")||"your_api_key_here",g=new y({apiKey:m()}),x=async r=>{m();const n=[...r].sort((i,u)=>u.timestamp-i.timestamp).slice(0,3);if(n.length<2)return"ข้อมูลยังไม่เพียงพอสำหรับการวิเคราะห์เบื้องต้น";const t=n[0],s=n[1],e=(t.amountKg-s.amountKg)/s.amountKg*100,o=t.population>0?t.amountKg/t.population/30:0,p=`
    คุณคือผู้เชี่ยวชาญด้านการจัดการสิ่งแวดล้อม ของเทศบาลตำบลเมืองศรีไค
    
    ข้อมูลสถานการณ์ล่าสุด (${l[t.month-1]} ${t.year}):
    - ปริมาณขยะ: ${(t.amountKg/1e3).toFixed(2)} ตัน (${e>0?"+":""}${e.toFixed(1)}%)
    - อัตราการเกิดขยะ: ${o.toFixed(3)} กก./คน/วัน (ค่ามาตรฐานควรอยู่ที่ 0.8 - 1.2)
    
    โจทย์:
    1. วิเคราะห์ "อัตราการเกิดขยะ" (Waste Generation Rate) ว่าอยู่ในเกณฑ์ดีหรือน่าเป็นห่วง
    2. หากเกิน 1.2 กก./คน/วัน ให้เตือนเรื่องพฤติกรรมการทิ้งขยะ หรือกิจกรรมพิเศษในพื้นที่
    3. แนะนำ 1 มาตรการสั้นๆ
    
    ตอบเป็นภาษาไทย ความยาวไม่เกิน 2-3 ประโยค เน้นวิเคราะห์ประสิทธิภาพ
  `;try{return(await g.models.generateContent({model:"gemini-2.5-flash",contents:p})).text||"ไม่สามารถวิเคราะห์ข้อมูลได้"}catch{return"ระบบ AI ขัดข้องชั่วคราว"}},K=async(r,n,t,s)=>{m();const e=n.reduce((a,c)=>a+c.amountKg,0),o=s.reduce((a,c)=>a+c.amountKg,0),p=((e-o)/o*100).toFixed(1),i=n.reduce((a,c)=>a+c.population,0)/n.length||1,u=e/12/30/i,d=`
    วิเคราะห์เปรียบเทียบขยะเทศบาลเมืองศรีไค:
    ปี ${r}: รวม ${(e/1e3).toFixed(2)} ตัน (เฉลี่ย ${u.toFixed(3)} กก./คน/วัน)
    ปี ${t}: รวม ${(o/1e3).toFixed(2)} ตัน
    ผลต่าง: ${p}%

    ช่วยวิเคราะห์ว่าประสิทธิภาพการจัดการขยะดีขึ้นหรือแย่ลง โดยดูจากยอดรวมและอัตราการเกิดขยะ ตอบสั้นๆ 2-3 ประโยค
  `;try{return(await g.models.generateContent({model:"gemini-2.5-flash",contents:d})).text||"ไม่สามารถวิเคราะห์ข้อมูลเปรียบเทียบได้"}catch{return"ระบบ AI ขัดข้องชั่วคราว"}},f=async r=>{if(m(),r.length===0)return"ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์";const s=`
    คุณเป็นที่ปรึกษาด้านสิ่งแวดล้อมและการจัดการของเสีย ประจำเทศบาลตำบลเมืองศรีไค จังหวัดอุบลราชธานี
    
    หน้าที่: เขียนรายงานผู้บริหาร (Executive Report)
    
    ข้อมูลสถิติ:
    ${[...r].sort((e,o)=>e.year!==o.year?e.year-o.year:e.month-o.month).map(e=>`- ${l[e.month-1]} ${e.year}: ${(e.amountKg/1e3).toFixed(2)} ตัน (${(e.amountKg/e.population/30).toFixed(3)} กก./คน/วัน)`).join(`
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
  `;try{return(await g.models.generateContent({model:"gemini-2.5-flash",contents:s,config:{temperature:.7}})).text||"ไม่สามารถสร้างรายงานได้ในขณะนี้"}catch(e){return console.error("Gemini Error:",e),"เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI (กรุณาตรวจสอบ API Key หรือสัญญาณอินเทอร์เน็ต)"}};export{x as a,f as b,K as g};
