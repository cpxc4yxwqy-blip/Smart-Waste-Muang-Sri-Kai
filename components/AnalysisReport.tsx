
import React, { useState } from 'react';
import { WasteRecord, IdentityProfile } from '../types';
import { generateMayorReport } from '../services/geminiService';
import { Bot, FileText, RefreshCw, Sparkles, FileCheck, AlertTriangle, Printer, PenTool, User, Briefcase } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AnalysisReportProps {
  records: WasteRecord[];
  savedIdentities: IdentityProfile[];
  onSaveIdentity: (name: string, position: string) => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ records, savedIdentities, onSaveIdentity }) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Reporter State
  const [reporterName, setReporterName] = useState('');
  const [reporterPosition, setReporterPosition] = useState('');

  const handleNameSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReporterName(val);
    // Auto-fill position if name matches existing profile
    const match = savedIdentities.find(id => id.name === val);
    if (match) {
      setReporterPosition(match.position);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setReport('');

    if (reporterName) {
      onSaveIdentity(reporterName, reporterPosition);
    }

    try {
      const result = await generateMayorReport(records);
      setReport(result);
      setGenerated(true);
    } catch (err) {
      setReport("เกิดข้อผิดพลาดในการสร้างรายงาน");
    } finally {
      setLoading(false);
    }
  };

  const reportRef = React.useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!reportRef.current) return;

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    // Get the content
    const content = reportRef.current.innerHTML;

    // Write content to iframe
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>รายงานสรุปสถานการณ์ขยะมูลฝอย</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A4;
                margin: 2.54cm;
              }
              body {
                font-family: 'Sarabun', sans-serif;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              /* Typography adjustments for print */
              h1 { font-size: 24pt; font-weight: bold; margin-bottom: 10px; }
              h2 { font-size: 18pt; font-weight: bold; margin-bottom: 20px; }
              h3 { font-size: 16pt; font-weight: bold; margin-bottom: 10px; }
              p, li { font-size: 14pt; line-height: 1.6; margin-bottom: 10px; color: black; }
              .prose { max-width: 100%; }
              
              /* Hide screen-only elements if any slipped through */
              .no-print { display: none !important; }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap" rel="stylesheet">
          </head>
          <body>
            <div class="print-container">
              ${content}
            </div>
            <script>
              // Wait for fonts and styles to load
              window.onload = () => {
                setTimeout(() => {
                  window.print();
                  // Remove iframe after print dialog closes (approximate)
                  setTimeout(() => {
                    window.frameElement.remove();
                  }, 1000);
                }, 500);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
    }
  };

  // Check if we have enough data
  const hasData = records.length > 0;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="glass-panel rounded-3xl overflow-hidden shadow-glass border border-white/60">
        <div className="relative bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500 rounded-full -mr-40 -mt-40 opacity-20 blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500 rounded-full -ml-20 -mb-20 opacity-10 blur-[80px]"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-indigo-100 mb-4 backdrop-blur-md">
                <Bot size={14} /> AI Powered Analysis
              </div>
              <h2 className="text-3xl font-bold mb-3 tracking-tight">Executive Report Generator</h2>
              <p className="text-indigo-200/80 max-w-lg font-light leading-relaxed">
                สร้างรายงานสรุปผลการดำเนินงาน บทวิเคราะห์แนวโน้ม และข้อเสนอแนะเชิงนโยบายสำหรับผู้บริหาร ด้วยระบบ AI อัจฉริยะ Gemini 2.5
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-lg hidden md:block">
              <Sparkles className="text-indigo-300 animate-pulse" size={48} strokeWidth={1} />
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm min-h-[400px] p-10">
          {!hasData ? (
            <div className="text-center py-16 bg-white/60 rounded-3xl border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-400">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Data Available</h3>
              <p className="text-slate-500">กรุณาบันทึกข้อมูลลงในระบบก่อนใช้งานฟังก์ชันนี้</p>
            </div>
          ) : (
            <>
              {!generated && !loading && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-100 transform rotate-3 border border-indigo-50">
                    <FileText className="text-indigo-600" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-3">Ready to Generate Report</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-12 leading-relaxed">
                    ระบบจะนำข้อมูลสถิติย้อนหลังทั้งหมดมาประมวลผล เพื่อจัดทำเอกสารสรุปสถานการณ์ประจำเดือน
                  </p>

                  {/* Reporter Input before generation */}
                  <div className="max-w-lg mx-auto mb-10 text-left bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <h4 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2"><PenTool size={16} className="text-indigo-500" /> ข้อมูลผู้จัดทำ (Optional)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ชื่อ-นามสกุล</label>
                        <div className="relative">
                          <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            list="reporter-names"
                            value={reporterName}
                            onChange={handleNameSelect}
                            className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="ชื่อผู้จัดทำ"
                          />
                        </div>
                        <datalist id="reporter-names">
                          {savedIdentities.map((id, index) => (
                            <option key={index} value={id.name} />
                          ))}
                        </datalist>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">ตำแหน่ง</label>
                        <div className="relative">
                          <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={reporterPosition}
                            onChange={(e) => setReporterPosition(e.target.value)}
                            className="w-full pl-9 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="ระบุตำแหน่ง"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleGenerate}
                    className="group relative px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all overflow-hidden mx-auto flex items-center gap-3"
                  >
                    <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 skew-x-12 -ml-4"></div>
                    <Sparkles size={20} />
                    Generate AI Report
                  </button>
                </div>
              )}

              {loading && (
                <div className="py-32 text-center">
                  <div className="relative mx-auto w-20 h-20 mb-8">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center"><Bot className="text-indigo-600 animate-pulse" size={24} /></div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Analyzing Data...</h3>
                  <p className="text-slate-400 font-medium">กรุณารอสักครู่ AI Gemini กำลังเขียนรายงาน</p>
                </div>
              )}

              {generated && !loading && (
                <div className="animate-fade-in">
                  {/* Action Bar */}
                  <div className="flex flex-col md:flex-row items-center justify-between mb-8 border border-indigo-100 bg-indigo-50/50 p-6 rounded-2xl gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500 text-white p-3 rounded-xl shadow-md shadow-green-500/20">
                        <FileCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">Report Generated Successfully</h3>
                        <p className="text-xs text-slate-500 font-medium">Created on {new Date().toLocaleString('th-TH')}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                      <button
                        onClick={handleGenerate}
                        className="flex-1 md:flex-none justify-center text-slate-500 hover:text-slate-700 hover:bg-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors border border-transparent hover:border-slate-200"
                      >
                        <RefreshCw size={16} />
                        Regenerate
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex-1 md:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                      >
                        <Printer size={18} />
                        Print / Save PDF
                      </button>
                    </div>
                  </div>

                  {/* Report Content - Ref for Printing */}
                  <div ref={reportRef} className="bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-slate-100">
                    {/* Print Header - Visible in UI but styled for print via iframe injection */}
                    <div className="text-center mb-10 hidden print-block">
                      <div className="mb-4">
                        {/* Garuda Placeholder - In a real app, use an img tag */}
                        <div style={{ width: '80px', height: '80px', margin: '0 auto', background: 'url(https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Garuda_Emblem_of_Thailand_%28Old_Version%29.svg/1200px-Garuda_Emblem_of_Thailand_%28Old_Version%29.svg.png) center/contain no-repeat' }}></div>
                      </div>
                      <h1 className="text-3xl font-bold mb-2 text-black">บันทึกข้อความ</h1>
                      <h2 className="text-xl font-bold mb-6 text-black">ส่วนราชการ เทศบาลตำบลเมืองศรีไค อำเภอวารินชำราบ จังหวัดอุบลราชธานี</h2>
                      <div className="flex justify-between text-base mb-6 border-b-2 border-black pb-6 font-medium">
                        <span>ที่ .....................................</span>
                        <span>วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <h3 className="text-xl font-bold text-left mb-2 text-black">เรื่อง รายงานสรุปสถานการณ์ขยะมูลฝอยประจำเดือน</h3>
                      <div className="text-left text-lg text-black">เรียน นายกเทศมนตรีตำบลเมืองศรีไค</div>
                    </div>

                    {/* Only show header in UI if we want to preview it, otherwise hide it and only show in print. 
                            For this implementation, let's hide it in UI to keep it clean, but ensure it's in the ref.
                        */}
                    <style>{`
                          .print-block { display: none; }
                        `}</style>
                    <style>{`
                          /* Force display block inside the iframe context */
                          .print-container .print-block { display: block !important; }
                        `}</style>

                    <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:text-indigo-950 prose-h2:text-2xl prose-h3:text-xl prose-p:text-slate-700 prose-p:leading-loose prose-li:text-slate-700 text-justify">
                      <ReactMarkdown>{report}</ReactMarkdown>
                    </div>

                    {/* Signature Block */}
                    <div className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-end">
                      <div className="text-center w-72">
                        <div className="mb-12 text-slate-400 border-b border-slate-300 w-full mx-auto"></div>
                        <p className="font-bold text-slate-800 text-lg">({reporterName || '................................................'})</p>
                        <p className="text-slate-500">{reporterPosition || 'ตำแหน่ง ................................................'}</p>
                        <p className="text-slate-400 text-sm mt-2">ผู้จัดทำรายงาน</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisReport;
