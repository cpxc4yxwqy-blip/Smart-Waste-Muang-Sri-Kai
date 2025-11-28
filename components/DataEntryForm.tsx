
import React, { useState, useRef, useEffect } from 'react';
import { WasteRecord, WasteUnit, THAI_MONTHS, IdentityProfile, WasteComposition } from '../types';
import { Save, RefreshCw, Database, Upload, AlertCircle, PlusCircle, Edit3, User, Briefcase, Dices, FileText, CheckCircle, Info, PieChart, StickyNote, AlertTriangle, Download } from 'lucide-react';

interface DataEntryFormProps {
  onAddRecord: (record: WasteRecord, stayOnPage?: boolean) => void;
  onImportRecords: (records: WasteRecord[]) => void;
  savedIdentities: IdentityProfile[];
  existingRecords: WasteRecord[];
}

const DataEntryForm: React.FC<DataEntryFormProps> = ({ onAddRecord, onImportRecords, savedIdentities, existingRecords }) => {
  const currentYearBE = new Date().getFullYear() + 543;

  const [month, setMonth] = useState<number>(() => {
    const saved = localStorage.getItem('waste_draft_month');
    return saved ? parseInt(saved) : new Date().getMonth() + 1;
  });

  const [year, setYear] = useState<number>(() => {
    const saved = localStorage.getItem('waste_draft_year');
    return saved ? parseInt(saved) : currentYearBE;
  });

  const [amount, setAmount] = useState<string>('');
  const [unit, setUnit] = useState<WasteUnit>(WasteUnit.TON);
  const [population, setPopulation] = useState<string>('');

  // Composition State
  const [compGeneral, setCompGeneral] = useState<string>('');
  const [compOrganic, setCompOrganic] = useState<string>('');
  const [compRecycle, setCompRecycle] = useState<string>('');
  const [compHazardous, setCompHazardous] = useState<string>('');

  const [note, setNote] = useState<string>('');

  const [recorderName, setRecorderName] = useState<string>(() => localStorage.getItem('waste_draft_recorder_name') || '');
  const [recorderPosition, setRecorderPosition] = useState(() => localStorage.getItem('waste_draft_recorder_pos') || '');

  const [loading, setLoading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'import'>('manual');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('waste_draft_recorder_name', recorderName);
    localStorage.setItem('waste_draft_recorder_pos', recorderPosition);
  }, [recorderName, recorderPosition]);

  // Logic to check for outliers when amount changes
  useEffect(() => {
    if (!amount || !year || !month) {
      setValidationWarning(null);
      return;
    }

    // Find previous month's data to compare
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevRecord = existingRecords.find(r => r.month === prevMonth && r.year === prevYear);

    if (prevRecord) {
      const currentVal = unit === WasteUnit.TON ? parseFloat(amount) * 1000 : parseFloat(amount);
      const prevVal = prevRecord.amountKg;
      const diffPercent = Math.abs((currentVal - prevVal) / prevVal * 100);

      if (diffPercent > 30) {
        setValidationWarning(`คำเตือน: ปริมาณขยะต่างจากเดือนก่อนหน้าถึง ${diffPercent.toFixed(0)}% (ปกติไม่ควรเกิน 30%) โปรดตรวจสอบความถูกต้อง`);
      } else {
        setValidationWarning(null);
      }
    } else {
      setValidationWarning(null);
    }

  }, [amount, unit, month, year, existingRecords]);

  useEffect(() => {
    const record = existingRecords.find(r => r.month === month && r.year === year);

    if (record) {
      setExistingRecordId(record.id);
      const useTon = record.amountKg > 10000;
      setAmount(useTon ? (record.amountKg / 1000).toFixed(2) : record.amountKg.toString());
      setUnit(useTon ? WasteUnit.TON : WasteUnit.KG);
      setPopulation(record.population.toString());

      if (record.composition) {
        const factor = useTon ? 1000 : 1;
        setCompGeneral((record.composition.general / factor).toFixed(2));
        setCompOrganic((record.composition.organic / factor).toFixed(2));
        setCompRecycle((record.composition.recycle / factor).toFixed(2));
        setCompHazardous((record.composition.hazardous / factor).toFixed(2));
      } else {
        setCompGeneral(''); setCompOrganic(''); setCompRecycle(''); setCompHazardous('');
      }

      setNote(record.note || '');
      if (record.recorderName) setRecorderName(record.recorderName);
      if (record.recorderPosition) setRecorderPosition(record.recorderPosition);
      setDraftSaved(false);
    } else {
      setExistingRecordId(null);
      setAmount('');
      setCompGeneral(''); setCompOrganic(''); setCompRecycle(''); setCompHazardous('');
      setNote('');
      setDraftSaved(false);
    }
  }, [month, year, existingRecords]);

  const handleAutoSum = () => {
    const g = parseFloat(compGeneral) || 0;
    const o = parseFloat(compOrganic) || 0;
    const r = parseFloat(compRecycle) || 0;
    const h = parseFloat(compHazardous) || 0;
    const sum = g + o + r + h;
    setAmount(sum.toFixed(2));
  };

  const handleNameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRecorderName(val);
    const match = savedIdentities.find(id => id.name === val);
    if (match) setRecorderPosition(match.position);
  };

  const handleUnitChange = (newUnit: WasteUnit) => {
    const currentVal = parseFloat(amount);
    const factor = (unit === WasteUnit.KG && newUnit === WasteUnit.TON) ? 0.001 :
      (unit === WasteUnit.TON && newUnit === WasteUnit.KG) ? 1000 : 1;

    if (!isNaN(currentVal) && amount !== '') {
      if (unit === WasteUnit.KG && newUnit === WasteUnit.TON) {
        setAmount((currentVal / 1000).toString());
      } else if (unit === WasteUnit.TON && newUnit === WasteUnit.KG) {
        setAmount((currentVal * 1000).toFixed(0));
      }
    }
    if (factor !== 1) {
      if (compGeneral) setCompGeneral((parseFloat(compGeneral) * factor).toFixed(2));
      if (compOrganic) setCompOrganic((parseFloat(compOrganic) * factor).toFixed(2));
      if (compRecycle) setCompRecycle((parseFloat(compRecycle) * factor).toFixed(2));
      if (compHazardous) setCompHazardous((parseFloat(compHazardous) * factor).toFixed(2));
    }
    setUnit(newUnit);
  };

  const handleSaveDraft = () => {
    localStorage.setItem('waste_draft_month', month.toString());
    localStorage.setItem('waste_draft_year', year.toString());
    localStorage.setItem('waste_draft_amount', amount);
    localStorage.setItem('waste_draft_pop', population);
    localStorage.setItem('waste_draft_recorder_name', recorderName);
    localStorage.setItem('waste_draft_recorder_pos', recorderPosition);
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const handleSimulateSingle = () => {
    const randomAmount = (Math.random() * 40 + 25).toFixed(2);
    setAmount(randomAmount);
    setUnit(WasteUnit.TON);
    const randomPop = Math.floor(12000 + (Math.random() * 1000 - 500));
    setPopulation(randomPop.toString());
    const total = parseFloat(randomAmount);
    setCompGeneral((total * 0.5).toFixed(2));
    setCompOrganic((total * 0.3).toFixed(2));
    setCompRecycle((total * 0.15).toFixed(2));
    setCompHazardous((total * 0.05).toFixed(2));
    if (savedIdentities.length > 0) {
      const randomStaff = savedIdentities[Math.floor(Math.random() * savedIdentities.length)];
      setRecorderName(randomStaff.name);
      setRecorderPosition(randomStaff.position);
    }
  };

  const handleSubmit = (e: React.FormEvent, stayOnPage: boolean = false) => {
    e.preventDefault();

    // Block submit if warning exists and user hasn't confirmed (simple implementation: just alert)
    if (validationWarning && !confirm('ระบบตรวจพบค่าผิดปกติ (Outlier) คุณยืนยันที่จะบันทึกข้อมูลนี้หรือไม่?')) {
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const numericAmount = parseFloat(amount);
      const numericPop = parseInt(population);

      if (isNaN(numericAmount) || isNaN(numericPop)) {
        alert('กรุณากรอกตัวเลขให้ถูกต้อง');
        setLoading(false);
        return;
      }

      const finalAmountKg = unit === WasteUnit.TON ? numericAmount * 1000 : numericAmount;
      let finalComposition: WasteComposition | undefined = undefined;
      if (compGeneral || compOrganic || compRecycle || compHazardous) {
        const factor = unit === WasteUnit.TON ? 1000 : 1;
        finalComposition = {
          general: (parseFloat(compGeneral) || 0) * factor,
          organic: (parseFloat(compOrganic) || 0) * factor,
          recycle: (parseFloat(compRecycle) || 0) * factor,
          hazardous: (parseFloat(compHazardous) || 0) * factor,
        };
      }

      const newRecord: WasteRecord = {
        id: existingRecordId || Date.now().toString(),
        month, year, amountKg: finalAmountKg, population: numericPop,
        timestamp: Date.now(), recorderName: recorderName.trim(), recorderPosition: recorderPosition.trim(),
        composition: finalComposition, note: note.trim()
      };

      onAddRecord(newRecord, stayOnPage);
      setLoading(false);

      if (stayOnPage) {
        if (month < 12) setMonth(month + 1); else { setMonth(1); setYear(year + 1); }
        setAmount(''); setCompGeneral(''); setCompOrganic(''); setCompRecycle(''); setCompHazardous(''); setNote('');
      } else {
        localStorage.removeItem('waste_draft_amount');
        setAmount(''); setCompGeneral(''); setCompOrganic(''); setCompRecycle(''); setCompHazardous(''); setNote('');
      }
    }, 500);
  };

  const handleClearForm = () => {
    if (confirm('ต้องการล้างข้อมูลในแบบฟอร์มทั้งหมดหรือไม่?')) {
      setAmount('');
      setUnit(WasteUnit.TON);
      setPopulation('');
      setCompGeneral('');
      setCompOrganic('');
      setCompRecycle('');
      setCompHazardous('');
      setNote('');
      setExistingRecordId(null);
      setValidationWarning(null);
      localStorage.removeItem('waste_draft_amount');
      localStorage.removeItem('waste_draft_pop');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);
        const newRecords: WasteRecord[] = [];

        lines.forEach((line, idx) => {
          if (idx === 0 && (line.toLowerCase().includes('month') || line.toLowerCase().includes('เดือน'))) return;
          const parts = line.split(',');
          if (parts.length >= 4) {
            const m = parseInt(parts[0]); const y = parseInt(parts[1]);
            const amt = parseFloat(parts[2]); const pop = parseInt(parts[3]);
            if (!isNaN(m) && !isNaN(y) && !isNaN(amt) && !isNaN(pop)) {
              newRecords.push({
                id: Date.now().toString() + idx + Math.random().toString(36),
                month: m, year: y, amountKg: amt, population: pop, timestamp: Date.now(),
                recorderName: parts[4] || 'Imported', recorderPosition: parts[5] || '-'
              });
            }
          }
        });
        if (newRecords.length > 0) {
          onImportRecords(newRecords);
          // Use a more subtle notification in a real app, but for now alert is safer than breaking UI logic
          // We will stick to alert but make it friendly
          alert(`✅ นำเข้าข้อมูลสำเร็จจำนวน ${newRecords.length} รายการ`);
        }
      } catch (err) { alert('❌ เกิดข้อผิดพลาดในการอ่านไฟล์ CSV'); } finally { setLoading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };
    reader.readAsText(file);
  };

  const getConvertedDisplay = () => {
    const val = parseFloat(amount);
    if (isNaN(val)) return null;
    return unit === WasteUnit.TON ? `= ${(val * 1000).toLocaleString()} kg` : `= ${(val / 1000).toLocaleString()} Ton`;
  };

  const breakdownSum = (parseFloat(compGeneral) || 0) + (parseFloat(compOrganic) || 0) + (parseFloat(compRecycle) || 0) + (parseFloat(compHazardous) || 0);
  const mainAmount = parseFloat(amount) || 0;
  const isBreakdownMatch = Math.abs(breakdownSum - mainAmount) < 0.01;

  const handleExportCSV = () => {
    if (existingRecords.length === 0) {
      alert('ไม่พบข้อมูลสำหรับส่งออก');
      return;
    }

    // Define headers
    const headers = ['เดือน', 'ปี', 'ปริมาณขยะ (ตัน)', 'ประชากร (คน)', 'อัตราการเกิดขยะ (กก./คน/วัน)', 'หมายเหตุ'];

    // Map data to CSV rows
    const rows = existingRecords.map(r => {
      const rate = r.population > 0 ? (r.amountKg / r.population / 30).toFixed(3) : '0.000';
      const amountTon = (r.amountKg / 1000).toFixed(2);
      const note = r.note ? `"${r.note.replace(/"/g, '""')}"` : '-'; // Escape quotes in note

      return [
        THAI_MONTHS[r.month - 1],
        r.year,
        amountTon,
        r.population,
        rate,
        note
      ].join(',');
    });

    // Combine headers and rows with BOM for Thai support
    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

    // Create Blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `waste_records_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-slide-up">
      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="glass-panel p-1.5 rounded-2xl shadow-glass inline-flex gap-1 relative z-10">
          <button type="button" onClick={() => setActiveTab('manual')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === 'manual' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:bg-slate-50/50'}`}>Manual Entry</button>
          <button type="button" onClick={() => setActiveTab('import')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === 'import' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30' : 'text-slate-500 hover:bg-slate-50/50'}`}><Upload size={16} /> Import Excel</button>
        </div>
      </div>

      {activeTab === 'manual' ? (
        <div className="glass-panel rounded-3xl shadow-glass hover:shadow-glass-hover transition-all duration-500 relative overflow-hidden border border-white/60">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-100/30 to-transparent opacity-50 pointer-events-none rounded-full -mr-24 -mt-24 blur-3xl"></div>

          {/* Form Header */}
          <div className="p-8 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 border-b border-slate-100/50">
            <div className="flex items-center gap-5">
              <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center border border-white ${existingRecordId ? 'bg-gradient-to-br from-amber-100 to-orange-50 text-amber-600' : 'bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600'}`}>
                {existingRecordId ? <Edit3 size={28} /> : <Database size={28} />}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{existingRecordId ? 'แก้ไขข้อมูล (Edit Record)' : 'บันทึกใหม่ (New Entry)'}</h2>
                <p className="text-slate-500 text-sm font-medium">{existingRecordId ? `กำลังแก้ไข: ${THAI_MONTHS[month - 1]} ${year}` : 'เพิ่มสถิติการจัดการขยะประจำเดือน'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={handleSimulateSingle} className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-2 transition-all"><Dices size={14} /> สุ่มข้อมูล</button>
              <button type="button" onClick={handleSaveDraft} className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-2 transition-all ${draftSaved ? 'bg-green-50 text-green-600 border-green-200' : 'text-slate-600 bg-white/50 border-slate-200 hover:bg-white'}`}>
                {draftSaved ? <CheckCircle size={14} /> : <FileText size={14} />} {draftSaved ? 'บันทึกแล้ว' : 'แบบร่าง'}
              </button>
            </div>
          </div>

          <form className="p-8 space-y-12 relative z-10">
            {/* Section 1: Basic Info */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">1</span> ข้อมูลพื้นฐาน
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group relative">
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">เดือน</label>
                  <div className="relative">
                    <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))} className="w-full p-4 pr-10 border border-slate-200 rounded-2xl outline-none bg-white/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer font-bold appearance-none text-slate-700">
                      {THAI_MONTHS.map((m, idx) => <option key={idx} value={idx + 1}>{m}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
                  </div>
                </div>
                <div className="group">
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1">ปี พ.ศ.</label>
                  <input type="number" value={year} onChange={(e) => setYear(parseInt(e.target.value))} className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-white/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold text-slate-700" />
                </div>
                <div className="group relative">
                  <label className="block text-xs font-bold text-slate-500 mb-2 ml-1 flex justify-between">
                    จำนวนประชากร <Info size={12} className="text-slate-400" />
                  </label>
                  <input type="number" value={population} onChange={(e) => setPopulation(e.target.value)} placeholder="e.g. 12,000" required className="w-full p-4 border border-slate-200 rounded-2xl outline-none bg-white/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-bold text-slate-700 placeholder:font-normal" />
                </div>
              </div>
            </div>

            {/* Section 2: Waste Amount */}
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">2</span> ปริมาณขยะ
                </h3>
                <div className="flex bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                  <button type="button" onClick={() => handleUnitChange(WasteUnit.TON)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === WasteUnit.TON ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>ตัน (Ton)</button>
                  <button type="button" onClick={() => handleUnitChange(WasteUnit.KG)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${unit === WasteUnit.KG ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}>กก. (Kg)</button>
                </div>
              </div>

              <div className="p-8 rounded-3xl border transition-all bg-gradient-to-br from-white to-emerald-50/30 border-emerald-100 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-emerald-400/20 transition-colors"></div>
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <label className="block text-sm font-bold text-emerald-900">น้ำหนักรวม (Total Weight)</label>
                  {amount && <span className="text-xs font-bold text-slate-500 bg-white/80 px-3 py-1.5 rounded-lg border border-emerald-100/50 backdrop-blur-sm">{getConvertedDisplay()}</span>}
                </div>
                <div className="relative">
                  <input
                    type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required
                    className="w-full p-5 border-2 border-emerald-100 rounded-2xl outline-none text-4xl font-bold text-emerald-600 focus:border-emerald-400 bg-white/80 shadow-inner transition-all placeholder:text-emerald-100"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-200 font-bold text-lg pointer-events-none">{unit === WasteUnit.TON ? 'TON' : 'KG'}</div>
                </div>
                {validationWarning && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 animate-pulse">
                    <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs font-bold text-amber-700 leading-relaxed">{validationWarning}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 relative">
                <h4 className="text-xs font-bold text-slate-500 mb-4 flex items-center gap-2"><PieChart size={14} /> แยกองค์ประกอบขยะ (ไม่บังคับ)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'ทั่วไป (General)', val: compGeneral, set: setCompGeneral, color: 'blue' },
                    { label: 'อินทรีย์ (Organic)', val: compOrganic, set: setCompOrganic, color: 'emerald' },
                    { label: 'รีไซเคิล (Recycle)', val: compRecycle, set: setCompRecycle, color: 'amber' },
                    { label: 'อันตราย (Hazardous)', val: compHazardous, set: setCompHazardous, color: 'red' },
                  ].map((item, i) => (
                    <div key={i} className="group">
                      <label className={`text-[10px] font-bold text-${item.color}-500 mb-1.5 block uppercase tracking-wide`}>{item.label}</label>
                      <input
                        type="number"
                        value={item.val}
                        onChange={(e) => item.set(e.target.value)}
                        className={`w-full p-3 rounded-xl text-sm font-bold border border-slate-200 focus:ring-2 focus:ring-${item.color}-200 focus:border-${item.color}-400 outline-none transition-all bg-white`}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                {!isBreakdownMatch && mainAmount > 0 && (
                  <div className="mt-4 flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-slate-500 font-medium">ยอดรวมย่อย: <span className="font-bold">{breakdownSum.toFixed(2)}</span> vs ยอดรวมจริง: <span className="font-bold">{mainAmount.toFixed(2)}</span></span>
                    <button type="button" onClick={handleAutoSum} className="text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">ปรับยอดรวมอัตโนมัติ</button>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Recorder */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">3</span> ผู้บันทึก & หมายเหตุ
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" list="staff-list" value={recorderName} onChange={handleNameSelect} placeholder="ชื่อผู้บันทึก" className="w-full pl-12 p-4 border border-slate-200 rounded-2xl outline-none bg-white/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-slate-700" />
                    <datalist id="staff-list">{savedIdentities.map((id, i) => <option key={i} value={id.name} />)}</datalist>
                  </div>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={recorderPosition} onChange={(e) => setRecorderPosition(e.target.value)} placeholder="ตำแหน่ง" className="w-full pl-12 p-4 border border-slate-200 rounded-2xl outline-none bg-white/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-slate-700" />
                  </div>
                </div>
                <div>
                  <div className="relative h-full">
                    <StickyNote className="absolute left-4 top-5 text-slate-400" size={18} />
                    <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม..." className="w-full h-full pl-12 p-4 border border-slate-200 rounded-2xl outline-none bg-white/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-medium text-slate-700 resize-none min-h-[120px]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-6 border-t border-slate-100">
              {/* Top row - utility buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClearForm}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <RefreshCw size={16} /> ล้างฟอร์ม
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={16} /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${draftSaved ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                >
                  {draftSaved ? <CheckCircle size={16} /> : <Save size={16} />}
                  {draftSaved ? 'บันทึกแล้ว' : 'บันทึกร่าง'}
                </button>
              </div>

              {/* Bottom row - main action buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, false)}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                  {existingRecordId ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => handleSubmit(e, true)}
                  className="flex-1 py-3.5 px-6 bg-white border-2 border-emerald-500 text-emerald-600 rounded-xl font-bold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                >
                  <PlusCircle size={20} />
                  บันทึก & เดือนถัดไป
                </button>
              </div>
            </div>

          </form>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/60 border-dashed min-h-[400px] flex flex-col justify-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-slate-50/50 skew-y-12 transform scale-150 opacity-50 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-6">
              <Upload size={40} className="text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">นำเข้าไฟล์ CSV (Import)</h3>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">อัปโหลดไฟล์ CSV ที่มีคอลัมน์: Month, Year, Amount, Population</p>
            <label className="cursor-pointer group relative inline-block">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-200"></div>
              <div className="relative px-8 py-4 bg-white ring-1 ring-slate-900/5 rounded-2xl leading-none flex items-center space-x-4">
                <span className="text-emerald-700 font-bold group-hover:text-emerald-800 transition">เลือกไฟล์ CSV</span>
              </div>
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
            </label>
            {loading && <p className="mt-4 text-emerald-600 font-bold animate-pulse">กำลังประมวลผล...</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEntryForm;
