
import React, { useRef, useState, useEffect } from 'react';
import { LayoutDashboard, FilePlus, FileText, Leaf, ChevronRight, Bookmark, Users, RotateCcw, Download, Upload, Settings, Key, X, Save, Bell, Smartphone } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onReset?: () => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen, setIsOpen, onReset, onBackup, onRestore }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

  return (
    <>
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <Settings className="text-slate-400" size={20} /> Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
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
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
              <button onClick={() => setShowSettings(false)} className="px-4 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all text-sm">ยกเลิก</button>
              <button onClick={handleSaveSettings} className="px-6 py-2.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all text-sm flex items-center gap-2">
                <Save size={16} /> บันทึก
              </button>
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
      <div className={`fixed top-4 left-4 bottom-4 z-50 w-72 glass-panel rounded-3xl text-slate-800 transition-transform duration-500 shadow-glass lg:translate-x-0 lg:shadow-glass-hover flex flex-col overflow-hidden border border-white/60 ${isOpen ? 'translate-x-0' : '-translate-x-[120%] lg:translate-x-0'}`}>

        {/* Header */}
        <div className="p-8 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Leaf size={24} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-slate-800 tracking-tight leading-none">Smart Waste</h1>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Muang Si Khai</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-4 mt-2">Main Menu</div>
          {menuItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsOpen(false);
                }}
                className={`group relative flex items-center justify-between w-full px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 text-emerald-700 shadow-sm border border-emerald-100/50'
                    : 'text-slate-500 hover:bg-white/50 hover:text-slate-800 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'} transition-colors duration-300`}>
                    {item.icon}
                  </span>
                  <div className="text-left">
                    <div className={`text-sm font-bold ${isActive ? 'text-emerald-900' : 'text-slate-700'}`}>{item.label}</div>
                    <div className="text-[10px] font-medium text-slate-400">{item.sub}</div>
                  </div>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-glow"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer Tools */}
        <div className="p-5 mt-auto bg-white/40 backdrop-blur-md border-t border-white/50">
          {/* PWA Install Button */}
          {canInstall && (
            <button
              onClick={handleInstallApp}
              className="w-full mb-3 flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 group animate-pulse-slow"
            >
              <Smartphone size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">ติดตั้งแอป</span>
            </button>
          )}
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              onClick={onBackup}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-white/60 hover:bg-white border border-white/50 shadow-sm hover:shadow-md text-slate-500 hover:text-emerald-600 transition-all duration-300"
            >
              <Download size={16} />
              <span className="text-[10px] font-bold">Backup</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-white/60 hover:bg-white border border-white/50 shadow-sm hover:shadow-md text-slate-500 hover:text-blue-600 transition-all duration-300"
            >
              <Upload size={16} />
              <span className="text-[10px] font-bold">Restore</span>
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full mb-3 flex items-center justify-center gap-2 p-3 rounded-2xl bg-slate-50 hover:bg-white border border-slate-100 shadow-sm hover:shadow-md text-slate-500 hover:text-slate-800 transition-all duration-300 group"
          >
            <Settings size={16} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="text-xs font-bold">Settings</span>
          </button>

          {onReset && (
            <button
              onClick={onReset}
              className="w-full text-[10px] font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-2 py-2 transition-all opacity-60 hover:opacity-100"
            >
              <RotateCcw size={12} /> RESET SYSTEM
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
