
import React, { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, FilePlus, FileText, Leaf, ChevronRight, Bookmark, Users, RotateCcw, RefreshCw, Download, Upload, Settings, Key, X, Save, Bell, Smartphone, Database, AlertTriangle, Wifi } from 'lucide-react';
import GoogleSheetsSettings from './GoogleSheetsSettings';
import AuditLogViewer from './AuditLogViewer';
import { getPendingCount, getPendingRecords, getSyncStatus, flushPendingRecords, pingWebApp, getWebHealth, isLockStuck, clearStuckLock } from '../services/googleSheetsService';

// Feature flag: hide Sync Health UI
const SHOW_SYNC_HEALTH = false;

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onReset?: () => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
  onSyncGoogleSheets?: (records?: any[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, onReset, onBackup, onRestore, onSyncGoogleSheets }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'sheets' | 'history'>('general');
  const [apiKey, setApiKey] = useState('');
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [isSidebarHovered, setIsSidebarHovered] = useState(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingPreview, setPendingPreview] = useState<any[]>([]);
  const [webHealth, setWebHealth] = useState<any>(null);
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatus());
  const [lockStuck, setLockStuck] = useState<boolean>(() => isLockStuck());
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) setApiKey(savedKey);

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone;
    if (isStandalone) setCanInstall(false);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // ปิดแถบการขยายโดยอัตโนมัติหลังจาก 5 วินาที
  useEffect(() => {
    if (expandedSection) {
      const timer = setTimeout(() => {
        setExpandedSection(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [expandedSection]);

  const refreshSyncMeta = () => {
    if (!SHOW_SYNC_HEALTH) return;
    setPendingCount(getPendingCount());
    setPendingPreview(getPendingRecords().slice(0, 3));
    setSyncStatus(getSyncStatus());
    setWebHealth(getWebHealth());
    setLockStuck(isLockStuck());
  };

  useEffect(() => {
    refreshSyncMeta();
    const interval = setInterval(refreshSyncMeta, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      alert('กรุณาเปิดใน Chrome/Edge และคลิกไอคอน "ติดตั้ง" ในแถบ address bar\n\nหรือเปิดเมนู (⋮) → ติดตั้ง "Si Khai Waste Smart Dashboard"');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    setShowSettings(false);
    alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
    window.location.reload(); // Reload to apply changes to service
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', sub: 'ภาพรวมสถานการณ์', icon: <LayoutDashboard size={20} /> },
    { id: 'entry', label: 'Data Entry', sub: 'บันทึกข้อมูล', icon: <FilePlus size={20} /> },
    { id: 'report', label: 'AI Report', sub: 'รายงานผู้บริหาร', icon: <FileText size={20} /> },
    { id: 'registry', label: 'Staff', sub: 'ทะเบียนบุคลากร', icon: <Users size={20} /> },
    { id: 'push', label: 'Push Admin', sub: 'ส่งการแจ้งเตือน', icon: <Bell size={20} /> },
    { id: 'saved', label: 'Bookmarks', sub: 'รายการที่บันทึก', icon: <Bookmark size={20} /> },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onRestore) {
      if (confirm('คำเตือน: การกู้คืนข้อมูลจะทับข้อมูลปัจจุบันทั้งหมด\nคุณต้องการดำเนินการต่อหรือไม่?')) {
        onRestore(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return '—';
    }
  };

  const handleFlushPending = async () => {
    setExpandedSection('flush');
    try {
      const result = await flushPendingRecords();
      refreshSyncMeta();
      alert(`ส่งคิวค้างสำเร็จ ${result.success} รายการ${result.failed ? ` / ตกค้าง ${result.failed}` : ''}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`ไม่สามารถส่งคิวค้างได้: ${msg}`);
    }
  };

  const handlePingWebApp = async () => {
    try {
      const res = await pingWebApp();
      setWebHealth(res);
      alert(`Web App ${res.ok ? 'พร้อมใช้งาน' : 'ไม่ตอบสนอง'}${res.status ? ` (status ${res.status})` : ''} เวลา ${res.latencyMs || 0} ms`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Ping ไม่สำเร็จ: ${msg}`);
    }
  };

  const handleClearStuckLock = () => {
    if (confirm('พบ lock ค้าง คุณต้องการลบเพื่อเปิดใช้การซิงค์ใหม่ไหม?')) {
      clearStuckLock();
      setLockStuck(false);
      refreshSyncMeta();
      alert('ลบ lock สำเร็จ สามารถซิงค์ได้แล้ว');
    }
  };

  return (
    <>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative z-10 overflow-hidden animate-slide-up max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Settings className="text-slate-400" size={20} /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50/30">
              <button
                onClick={() => setSettingsTab('general')}
                className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${
                  settingsTab === 'general'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Key size={16} className="inline mr-2" />
                ทั่วไป
              </button>
              <button
                onClick={() => setSettingsTab('sheets')}
                className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${
                  settingsTab === 'sheets'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Database size={16} className="inline mr-2" />
                Google Sheets
              </button>
              <button
                onClick={() => setSettingsTab('history')}
                className={`flex-1 py-3 px-4 text-sm font-bold transition-all ${
                  settingsTab === 'history'
                    ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <RotateCcw size={16} className="inline mr-2" />
                History
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {settingsTab === 'general' ? (
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                      <Key size={16} className="text-emerald-500" /> Gemini API Key
                    </label>
                    <p className="text-xs text-slate-500 mb-3">จำเป็นสำหรับฟีเจอร์ AI Analysis และ Report Generator</p>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="วาง API Key ที่นี่ (AIza...)"
                      className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-mono text-sm"
                    />
                    <div className="mt-2 text-[10px] text-slate-400">
                      ยังไม่มี Key? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">กดที่นี่เพื่อรับฟรี</a>
                    </div>
                  </div>
                </div>
              ) : settingsTab === 'sheets' ? (
                <div className="p-6">
                  <GoogleSheetsSettings onSync={onSyncGoogleSheets} />
                </div>
              ) : (
                <div className="p-6">
                  <AuditLogViewer />
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm">ยกเลิก</button>
              {settingsTab === 'general' && (
                <button onClick={handleSaveSettings} className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center gap-2">
                  <Save size={16} /> บันทึก
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      />


      {/* Sidebar Container */}
      <div
        ref={sidebarRef}
        className={`fixed top-4 left-4 bottom-4 z-50 w-72 rounded-3xl text-slate-800 transition-transform duration-500 lg:translate-x-0 flex flex-col overflow-hidden border border-white/60 shadow-2xl shadow-emerald-100/50 bg-gradient-to-b from-white/80 via-white/70 to-white/60 backdrop-blur-2xl ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}
      >

        {/* Header */}
        <div className="p-4 pb-3 relative">
          <div className="absolute -right-6 -top-6 h-20 w-20 bg-emerald-200/30 rounded-full blur-3xl" aria-hidden />
          <div className="absolute -left-10 top-10 h-16 w-16 bg-teal-200/30 rounded-full blur-3xl" aria-hidden />
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/40 ring-4 ring-white/60">
              <Leaf size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" />
                Control Hub
              </div>
              <h1 className="font-bold text-lg text-slate-800 tracking-tight leading-none mt-1">Smart Waste</h1>
              <p className="text-[8px] text-emerald-600 font-bold uppercase tracking-widest mt-0.5">Muang Si Khai</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-2 space-y-1 overflow-y-auto custom-scrollbar py-1 transition-all duration-300 ${isSidebarHovered ? 'opacity-100' : 'opacity-100'}`}>
          <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2 px-2 mt-1">Main Menu</div>
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsOpen(false);
                }}
                className={`group relative flex items-center justify-between w-full px-2.5 py-2.5 rounded-2xl transition-all duration-300 border ${isActive
                    ? 'bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/80 text-emerald-700 shadow-md shadow-emerald-100/70 border-emerald-100'
                    : 'bg-white/60 text-slate-600 hover:bg-white border-white/60 hover:border-emerald-100 hover:shadow-sm'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-emerald-100 text-emerald-600 shadow-inner shadow-emerald-100' : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-600'}`}>
                    {item.icon}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className={`text-sm font-extrabold tracking-tight ${isActive ? 'text-emerald-900' : 'text-slate-800'}`}>{item.label}</div>
                    <div className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-500">{item.sub}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow" />}
                  <ChevronRight size={14} className={`transition-all duration-300 ${isActive ? 'text-emerald-500 translate-x-0.5' : 'text-slate-300 group-hover:text-emerald-400 group-hover:translate-x-0.5'}`} />
                </div>
              </button>
            );
          })}
        </nav>

        {/* Sync Health (disabled) */}
        {SHOW_SYNC_HEALTH && (
        <div className="px-2 pb-2">
          <div className="rounded-2xl border border-emerald-100 bg-white/70 shadow-inner shadow-emerald-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <RefreshCw size={14} />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-800">Sync Health</div>
                  <div className="text-[10px] text-slate-500">Google Sheets</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {syncStatus.circuitOpenUntil && syncStatus.circuitOpenUntil > Date.now() && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">พักการซิงค์ชั่วคราว</span>
                )}
                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${syncStatus.lastStatus === 'success' ? 'bg-emerald-50 text-emerald-700' : syncStatus.lastStatus === 'fail' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500'}`}>
                  {syncStatus.lastStatus === 'success' ? 'ปกติ' : syncStatus.lastStatus === 'fail' ? 'มีปัญหา' : 'ยังไม่ซิงค์'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 rounded-xl bg-emerald-50/40 border border-emerald-100">
                <div className="text-[9px] text-slate-500">ครั้งล่าสุด</div>
                <div className="font-semibold text-slate-800 leading-tight">{formatTime(syncStatus.lastAt)}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-slate-500">คิวค้าง</div>
                  <div className="font-semibold text-slate-800">{pendingCount} รายการ</div>
                </div>
                {lockStuck ? <AlertTriangle size={14} className="text-red-500" /> : pendingCount > 0 ? <AlertTriangle size={14} className="text-amber-500" /> : <ChevronRight size={12} className="text-slate-300" />}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-slate-500">Web App</div>
                  <div className="font-semibold text-slate-800">{webHealth?.ok ? 'พร้อมใช้งาน' : 'รอตรวจสอบ'}</div>
                  {webHealth?.latencyMs !== undefined && <div className="text-[10px] text-slate-500">{webHealth.latencyMs} ms</div>}
                </div>
                <Wifi size={14} className={`${webHealth?.ok ? 'text-emerald-500' : 'text-slate-300'}`} />
              </div>
              <div className="p-2 rounded-xl bg-white border border-slate-100 text-[10px] text-slate-500">
                <div className="font-semibold text-slate-700 mb-1">ข้อความล่าสุด</div>
                <div className="line-clamp-2 text-[10px]">{syncStatus.lastMessage || '—'}</div>
              </div>
            </div>
            {lockStuck && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-2 flex items-start gap-2 mb-2">
                <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-[10px] text-red-700">
                  <div className="font-bold mb-1">⚠️ Lock ค้าง</div>
                  <p className="mb-2">ระบบซิงค์ติดค้าง ให้กดปุ่มลบเพื่อเปิดใช้การซิงค์ใหม่</p>
                </div>
              </div>
            )}
            {pendingPreview.length > 0 && (
              <div className="bg-white/80 border border-slate-100 rounded-xl p-2 space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                {pendingPreview.map((item, idx) => (
                  <div key={item.record?.id || idx} className="flex items-center justify-between text-[10px] text-slate-600">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-700">{item.record?.id || `item-${idx + 1}`}</span>
                      {item.reason && <span className="text-[9px] text-amber-600">{item.reason}</span>}
                    </div>
                    <span className="text-[9px] text-slate-400">{item.record?.updatedAt ? formatTime(new Date(item.record.updatedAt as any).getTime()) : 'รอตรวจสอบ'}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setExpandedSection('sync');
                  if (onSyncGoogleSheets) {
                    onSyncGoogleSheets();
                  } else {
                    setShowSettings(true);
                    setSettingsTab('sheets');
                  }
                }}
                className="text-[11px] font-bold px-2 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm hover:shadow-md"
              >
                ซิงค์ทันที
              </button>
              <button
                onClick={handleFlushPending}
                className="text-[11px] font-bold px-2 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100"
              >
                ส่งคิวค้าง
              </button>
              <button
                onClick={lockStuck ? handleClearStuckLock : handlePingWebApp}
                className={`text-[11px] font-bold px-2 py-2 rounded-xl flex items-center justify-center gap-1 ${
                  lockStuck 
                    ? 'bg-red-600 text-white hover:bg-red-700 border border-red-700'
                    : 'bg-slate-50 text-slate-700 border border-slate-100 hover:bg-slate-100'
                }`}
              >
                {lockStuck ? '🔓 ลบ' : 'Ping Web App'}
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Footer Tools */}
        <div 
          className={`p-2 bg-white/40 backdrop-blur-md border-t border-white/50 transition-all duration-500 ${
            isFooterVisible ? 'opacity-100 max-h-96 pointer-events-auto' : 'opacity-100 max-h-96 pointer-events-auto overflow-hidden'
          }`}
        >
          {/* PWA Install Button */}
          {canInstall && (
            <button
              onClick={handleInstallApp}
              className="w-full mb-3 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 text-white shadow-lg shadow-emerald-400/35 hover:shadow-xl hover:shadow-emerald-400/45 transition-all duration-300 group animate-pulse-slow"
            >
              <Smartphone size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">ติดตั้งแอป</span>
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={onBackup}
              className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl bg-gradient-to-b from-white/80 to-white/60 hover:from-white hover:to-white border border-white/70 shadow-sm hover:shadow-md text-slate-500 hover:text-emerald-600 transition-all duration-300"
            >
              <Download size={14} />
              <span className="text-[8px] font-bold">Backup</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl bg-gradient-to-b from-white/80 to-white/60 hover:from-white hover:to-white border border-white/70 shadow-sm hover:shadow-md text-slate-500 hover:text-blue-600 transition-all duration-300"
            >
              <Upload size={14} />
              <span className="text-[8px] font-bold">Restore</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          </div>
          {/* Auto-sync Toggle Button - Enhanced */}
          <button
            onClick={() => {
              const current = localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true';
              localStorage.setItem('googleSheetsAutoSyncEnabled', current ? 'false' : 'true');
              setExpandedSection('autosync');
              window.location.reload();
            }}
            className={`w-full mb-2 flex items-center justify-between p-2 rounded-xl border-2 transition-all duration-500 shadow-md hover:shadow-lg group ${
              localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true'
                ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-700 hover:from-emerald-100 hover:to-teal-100 hover:border-emerald-400 hover:shadow-emerald-200/50'
                : 'bg-gradient-to-r from-slate-50 to-slate-100 border-slate-300 text-slate-600 hover:from-slate-100 hover:to-slate-200 hover:border-slate-400 hover:shadow-slate-200/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg transition-all duration-300 ${
                localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true'
                  ? 'bg-emerald-200/50 group-hover:bg-emerald-300/50'
                  : 'bg-slate-200/50 group-hover:bg-slate-300/50'
              }`}>
                <RefreshCw size={14} className={`transition-all duration-500 ${
                  localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true'
                    ? 'text-emerald-600 group-hover:rotate-180'
                    : 'text-slate-500'
                }`} />
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold tracking-tight">Auto-sync</div>
                <div className="text-[8px] opacity-75 font-medium">{localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true' ? 'on' : 'off'}</div>
              </div>
            </div>
            <div className={`relative w-9 h-5 rounded-full transition-all duration-500 flex items-center ${
              localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-400/50' 
                : 'bg-gradient-to-r from-slate-400 to-slate-500'
            }`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow-lg transition-all duration-500 absolute ${
                localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true' ? 'right-0.5' : 'left-0.5'
              }`} />
            </div>
          </button>

          {/* Manual Sync Button - Enhanced */}
          <button
            onClick={() => {
              setExpandedSection('sync');
              if (onSyncGoogleSheets) {
                onSyncGoogleSheets();
              } else {
                setShowSettings(true);
                setSettingsTab('sheets');
              }
            }}
            className="w-full mb-2 flex items-center justify-center gap-1 p-2.5 rounded-xl bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white shadow-lg shadow-blue-400/35 hover:shadow-xl hover:shadow-blue-400/50 transition-all duration-300 group border border-blue-400/30 hover:border-blue-400/60 font-bold"
          >
            <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs">ซิงค์</span>
          </button>

          <button
            onClick={() => {
              setExpandedSection('settings');
              setShowSettings(true);
            }}
            className="w-full mb-2 flex items-center justify-center gap-1 p-2 rounded-xl bg-white/70 hover:bg-white border border-slate-100 shadow-sm hover:shadow-md text-slate-500 hover:text-slate-800 transition-all duration-300 group"
          >
            <Settings size={14} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-[10px] font-bold">Settings</span>
          </button>

          {onReset && (
            <button
              onClick={() => {
                setExpandedSection('reset');
                onReset();
              }}
              className="w-full text-[8px] font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-1 py-1.5 transition-all opacity-60 hover:opacity-100"
            >
              <RotateCcw size={10} /> RESET
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
