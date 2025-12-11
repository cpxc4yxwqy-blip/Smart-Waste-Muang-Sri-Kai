
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import PwaUpdateToast from './components/PwaUpdateToast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import ReactSuspense from 'react';
import { analytics } from './services/analytics';
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const DataEntryForm = React.lazy(() => import('./components/DataEntryForm'));
const AnalysisReport = React.lazy(() => import('./components/AnalysisReport'));
const StaffRegistry = React.lazy(() => import('./components/StaffRegistry'));
const AdminPushPanel = React.lazy(() => import('./components/AdminPushPanel'));
import { WasteRecord, AuditLog, IdentityProfile } from './types';
import { requestNotifications } from './services/notifications';
import { subscribeUser, unsubscribeUser, getExistingSubscription } from './services/pushSubscription';
import { syncWithGoogleSheets, flushPendingRecords, getPendingCount, getSyncStatus } from './services/googleSheetsService';
import SyncToast from './components/SyncToast';
import AuditLogViewer from './components/AuditLogViewer';
import { Menu, Leaf, Bookmark } from 'lucide-react';

// Mock Data for first-time load only (Updated with Composition)
const INITIAL_DATA: WasteRecord[] = [
  { 
    id: 'init-01', 
    month: 10, 
    year: 2566, 
    amountKg: 44000, 
    population: 12400, 
    timestamp: 1696118400000, 
    recorderName: 'นายสมชาย ใจดี', 
    recorderPosition: 'นักวิชาการสุขาภิบาล',
    composition: { general: 22000, organic: 13200, recycle: 6600, hazardous: 2200 },
    note: 'ช่วงเปิดภาคเรียน ขยะทั่วไปเพิ่มสูงขึ้น'
  },
];

const INITIAL_IDENTITIES: IdentityProfile[] = [];

// Helper for robust parsing
const safeParse = (key: string, fallback: any) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing ${key}`, e);
        return fallback;
    }
};

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- State with Initial Load from LocalStorage ---
  const [records, setRecords] = useState<WasteRecord[]>(() => safeParse('waste_records', INITIAL_DATA));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => safeParse('waste_logs', []));
  const [savedIdentities, setSavedIdentities] = useState<IdentityProfile[]>(() => safeParse('waste_identities', INITIAL_IDENTITIES));
  const [bookmarks, setBookmarks] = useState<{year: number, date: string}[]>(() => safeParse('waste_bookmarks', []));
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingCount());
  const [syncStatus, setSyncStatus] = useState(() => getSyncStatus());
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isDataSaver, setIsDataSaver] = useState<boolean>(() => {
    const conn: any = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
    return !!conn?.saveData;
  });

  // --- Persistence Effects ---
  useEffect(() => { localStorage.setItem('waste_records', JSON.stringify(records)); }, [records]);
  useEffect(() => { localStorage.setItem('waste_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('waste_identities', JSON.stringify(savedIdentities)); }, [savedIdentities]);
  useEffect(() => { localStorage.setItem('waste_bookmarks', JSON.stringify(bookmarks)); }, [bookmarks]);

  // --- System Actions ---

  const handleResetSystem = () => {
    if (confirm('คำเตือน: การกระทำนี้จะลบข้อมูล "ทั้งหมด" ในระบบให้กลับเป็นค่าเริ่มต้น (Factory Reset)\n\n- ประวัติการบันทึกขยะจะหายไป\n- ทะเบียนบุคลากรจะถูกรีเซ็ต\n- รายการที่บันทึกไว้จะหายไป\n\nคุณแน่ใจหรือไม่?')) {
        if(confirm('ยืนยันครั้งสุดท้าย: ต้องการลบข้อมูลจริงๆ ใช่หรือไม่?')) {
            localStorage.clear();
            analytics.systemReset();
            window.location.reload();
        }
    }
  };

  const handleBackupData = () => {
    const backupData = {
      version: '1.1',
      timestamp: new Date().toISOString(),
      records,
      auditLogs,
      savedIdentities,
      bookmarks
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `waste_smart_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    analytics.backupDownloaded(records.length);
  };

  const handleRestoreData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Basic validation
        if (!data.records || !Array.isArray(data.records)) {
          throw new Error('Invalid backup file format');
        }

        // Schema validation: filter and fix records
        const validRecords = data.records
          .map((r: any, idx: number) => {
            if (typeof r !== 'object' || r === null) return null;
            const id = typeof r.id === 'string' && r.id.trim() ? r.id : `restored-${idx}-${Date.now()}`;
            const month = typeof r.month === 'number' ? r.month : Number(r.month);
            const year = typeof r.year === 'number' ? r.year : Number(r.year);
            if (!month || !year) return null;
            return {
              ...r,
              id,
              month,
              year,
              createdAt: r.createdAt || new Date().toISOString(),
              updatedAt: r.updatedAt || new Date().toISOString(),
            } as WasteRecord;
          })
          .filter(Boolean) as WasteRecord[];

        if (!validRecords.length) {
          alert('Restore ล้มเหลว: ไม่พบ records ที่ถูกต้อง');
          return;
        }

        // Update LocalStorage
        localStorage.setItem('waste_records', JSON.stringify(validRecords));
        localStorage.setItem('waste_logs', JSON.stringify(data.auditLogs || []));
        localStorage.setItem('waste_identities', JSON.stringify(data.savedIdentities || []));
        localStorage.setItem('waste_bookmarks', JSON.stringify(data.bookmarks || []));

        const skipped = data.records.length - validRecords.length;
        const msg = skipped > 0
          ? `กู้คืนข้อมูลสำเร็จ ${validRecords.length} รายการ (ข้าม schema ไม่ถูกต้อง ${skipped} รายการ) ระบบจะทำการรีโหลดหน้าจอ`
          : 'กู้คืนข้อมูลสำเร็จ ระบบจะทำการรีโหลดหน้าจอ';
        analytics.restoreSuccess(validRecords.length);
        alert(msg);
        window.location.reload();
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ไฟล์ Backup ไม่ถูกต้อง หรือเสียหาย');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleSyncGoogleSheets = async (sheetRecords?: WasteRecord[]) => {
    const maxRetries = parseInt(localStorage.getItem('googleSheetsAutoSyncMaxRetries') || '3', 10);
    const baseDelayMs = parseInt(localStorage.getItem('googleSheetsAutoSyncBaseDelayMs') || '1000', 10); // ms
    const silentMode = localStorage.getItem('googleSheetsSyncSilentMode') === 'true';
    if (!silentMode) {
      setToast({ visible: true, message: 'เริ่มซิงค์กับ Google Sheets...', type: 'info', subtitle: undefined, isLoading: true, attempt: { current: 0, total: maxRetries } });
    }
    const backoffPolicy = localStorage.getItem('googleSheetsAutoSyncBackoff') || 'exponential';
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // ผสานข้อมูลจาก Google Sheets กับ Local
        const syncedRecords = await syncWithGoogleSheets(records);

        // อัปเดต LocalStorage
        localStorage.setItem('waste_records', JSON.stringify(syncedRecords));
        setRecords(syncedRecords);

        analytics.customEvent('google_sheets_sync', { count: syncedRecords.length });
        if (!silentMode) {
          setToast({ visible: true, message: `ซิงค์สำเร็จ ${syncedRecords.length} รายการ`, type: 'success', isLoading: false, persistent: false, duration: 2000 });
        }
        // Log audit
        addAuditLog('AUTO_SYNC_SUCCESS', `Auto-sync succeeded: ${syncedRecords.length} records`, 'System');
        return; // success
      } catch (error) {
        console.error('Failed to sync Google Sheets (attempt', attempt + 1, '):', error);
        const msg = error instanceof Error ? error.message : String(error);

        // ถ้ากำลังมีการซิงค์/flush อยู่แล้ว ให้ข้ามและไม่ถือเป็นความล้มเหลว
        if (msg.includes('กำลังซิงค์อยู่แล้ว') || msg.toLowerCase().includes('already') && msg.toLowerCase().includes('sync')) {
          addAuditLog('AUTO_SYNC_SKIP', 'ข้าม auto-sync เพราะมีการซิงค์อื่นทำงานอยู่ (lock)', 'System');
          setSyncStatus(getSyncStatus());
          setPendingCount(getPendingCount());
          if (!silentMode) {
            setToast({ visible: true, message: 'ข้ามการซิงค์: กำลังซิงค์อยู่แล้ว', type: 'info', isLoading: false, duration: 2000 });
          }
          return;
        }

        // If we have more attempts left, backoff and retry
        if (attempt < maxRetries - 1) {
          const jitter = Math.floor(Math.random() * 300);
          let delay = 0;
          if (backoffPolicy === 'linear') {
            delay = baseDelayMs * (attempt + 1) + jitter;
          } else {
            // exponential
            delay = baseDelayMs * Math.pow(2, attempt) + jitter;
          }
          addAuditLog('AUTO_SYNC_RETRY', `Retry ${attempt + 1} after ${delay}ms (policy=${backoffPolicy}): ${msg}`, 'System');
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        // final failure
        if (!silentMode) {
          setToast({ visible: true, message: 'ซิงค์ล้มเหลว', type: 'error', subtitle: `Attempt ${attempt + 1} of ${maxRetries}: ${msg}`, persistent: true, isLoading: false, onRetry: () => { handleSyncGoogleSheets(); }, onViewLogs: () => { showRecentAuditLogs(); } });
        }
        addAuditLog('AUTO_SYNC_FAIL', `Auto-sync failed after ${attempt + 1} attempts: ${msg}`, 'System');
        return;
      }
    }
  };

  // Toast state for sync notifications
  const [toast, setToast] = React.useState<{
    visible: boolean;
    message: string;
    type: 'success'|'error'|'info';
    subtitle?: string;
    isLoading?: boolean;
    attempt?: { current: number; total?: number };
    persistent?: boolean;
    onRetry?: (() => void) | null;
    onViewLogs?: (() => void) | null;
  }>(
    { visible: false, message: '', type: 'info', isLoading: false, persistent: false, onRetry: null, onViewLogs: null }
  );

  const showRecentAuditLogs = () => {
    // Open modal to show AuditLogViewer (uses localStorage internally)
    setShowAuditModal(true);
  };

  // Modal state for showing audit logs
  const [showAuditModal, setShowAuditModal] = React.useState(false);

  // Auto-sync: read settings from localStorage and schedule periodic sync
  React.useEffect(() => {
    let intervalId: any = null;
    let isRunning = false;

    const startAutoSync = () => {
      const enabled = localStorage.getItem('googleSheetsAutoSyncEnabled') === 'true';
      const minutes = parseInt(localStorage.getItem('googleSheetsAutoSyncIntervalMinutes') || '15', 10);
      if (!enabled) return;
      const ms = Math.max(1, minutes) * 60 * 1000;
      intervalId = setInterval(async () => {
        if (document.hidden || isDataSaver) return; // pause when not visible or data-saver
        if (isRunning) return;
        isRunning = true;
        try {
          await handleSyncGoogleSheets();
        } finally {
          isRunning = false;
        }
      }, ms);
    };

    startAutoSync();

    const onVisibility = () => {
      if (!document.hidden && !isDataSaver) {
        // resume immediate sync when user returns (unless data-saver on)
        handleSyncGoogleSheets().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [isDataSaver]);

  // Listen for connection changes to update data-saver state
  useEffect(() => {
    const updateConnectionInfo = () => {
      const conn: any = typeof navigator !== 'undefined' ? (navigator as any).connection : null;
      setIsDataSaver(!!conn?.saveData);
    };
    updateConnectionInfo();
    if (typeof navigator !== 'undefined' && (navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', updateConnectionInfo);
    }
    return () => {
      if (typeof navigator !== 'undefined' && (navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  // --- Identity / Registry Management ---
  
  const updateIdentities = (name: string, position: string) => {
    if (!name) return;
    setSavedIdentities(prev => {
      const exists = prev.some(id => id.name === name && id.position === position);
      if (exists) return prev;
      analytics.identityAdded(name);
      return [...prev, { name, position }];
    });
  };

  const handleEditIdentity = (index: number, newName: string, newPosition: string) => {
    setSavedIdentities(prev => {
      const updated = [...prev];
      updated[index] = { name: newName, position: newPosition };
      return updated;
    });
    addAuditLog('UPDATE', `แก้ไขรายชื่อบุคลากร: ${newName}`, 'Admin');
  };

  const removeIdentities = (indices: number[]) => {
    setSavedIdentities(prev => prev.filter((_, i) => !indices.includes(i)));
    addAuditLog('DELETE', `ลบรายชื่อบุคลากรจำนวน ${indices.length} รายการ`, 'Admin');
  };

  const handleClearRegistry = () => {
    setSavedIdentities([]);
    addAuditLog('DELETE', 'ล้างทะเบียนบุคลากรทั้งหมด (Clear All)', 'Admin');
  };

  // --- Audit Log ---

  const addAuditLog = (action: AuditLog['action'], details: string, user: string) => {
    const newLog: AuditLog = {
      id: Date.now().toString() + Math.random(),
      action,
      details,
      timestamp: Date.now(),
      user: user || 'System'
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // --- Online / Sync Meta & Auto Recovery ---
  useEffect(() => {
    const refreshStatus = () => {
      setPendingCount(getPendingCount());
      setSyncStatus(getSyncStatus());
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    };

    const handleOnline = async () => {
      setIsOnline(true);
      refreshStatus();
      const pending = getPendingCount();
      if (pending > 0) {
        try {
          const result = await flushPendingRecords();
          addAuditLog('AUTO_SYNC_SUCCESS', `Flush pending on reconnect: success ${result.success}/${pending}`, 'System');
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          addAuditLog('AUTO_SYNC_FAIL', `Flush pending failed after reconnect: ${msg}`, 'System');
        } finally {
          refreshStatus();
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    refreshStatus();
    const interval = setInterval(refreshStatus, 10000);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Record Management ---

  const handleAddRecord = (record: WasteRecord, stayOnPage: boolean = false) => {
    setRecords(prev => {
      const existingIndex = prev.findIndex(r => r.month === record.month && r.year === record.year);
      if (existingIndex >= 0) {
        const updatedRecords = [...prev];
        updatedRecords[existingIndex] = { ...record, id: prev[existingIndex].id }; 
        addAuditLog('UPDATE', `แก้ไขข้อมูลเดือน ${record.month}/${record.year}`, record.recorderName || 'Unknown');
        analytics.recordUpdated(record.month, record.year);
        return updatedRecords;
      } else {
        addAuditLog('ADD', `บันทึกข้อมูลเดือน ${record.month}/${record.year}`, record.recorderName || 'Unknown');
        analytics.recordAdded(record.month, record.year, record.amountKg);
        return [...prev, record];
      }
    });
    updateIdentities(record.recorderName || '', record.recorderPosition || '');
    if (!stayOnPage) {
      alert("บันทึกข้อมูลสำเร็จ");
      setCurrentView('dashboard'); 
    }
  };

  const handleImportRecords = (newRecords: WasteRecord[]) => {
    setRecords(prev => {
      const incomingKeys = new Set(newRecords.map(r => `${r.month}-${r.year}`));
      const filteredOld = prev.filter(r => !incomingKeys.has(`${r.month}-${r.year}`));
      return [...filteredOld, ...newRecords];
    });
    newRecords.forEach(r => { if (r.recorderName) updateIdentities(r.recorderName, r.recorderPosition || '-'); });
    addAuditLog('IMPORT', `นำเข้าไฟล์ CSV จำนวน ${newRecords.length} รายการ`, newRecords[0]?.recorderName || 'User');
    analytics.recordImported(newRecords.length);
    setCurrentView('dashboard');
  };

  const handleBookmark = (year: number) => {
    const newBookmark = { year, date: new Date().toLocaleString('th-TH') };
    setBookmarks(prev => [...prev, newBookmark]);
    alert(`บันทึกมุมมองปี ${year} ไว้ในรายการที่บันทึกแล้ว`);
    analytics.bookmarkAdded(year);
  };

  // Notifications scaffold
  const [notifPermission, setNotifPermission] = useState<string>(typeof Notification !== 'undefined' ? Notification.permission : 'default');
  const [pushSubscribed, setPushSubscribed] = useState<boolean>(false);
  const [pushRole, setPushRole] = useState<string>('viewer');

  useEffect(() => {
    getExistingSubscription().then(sub => setPushSubscribed(!!sub));
  }, []);
  // Listen for SW messages indicating subscription expiry
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handler = (e: MessageEvent) => {
        if (e.data?.type === 'PUSH_SUBSCRIPTION_EXPIRED') {
          setPushSubscribed(false);
        }
      };
      navigator.serviceWorker.addEventListener('message', handler);
      return () => navigator.serviceWorker.removeEventListener('message', handler);
    }
  }, []);
  const enableNotifications = async () => {
    const res = await requestNotifications();
    setNotifPermission(typeof Notification !== 'undefined' ? Notification.permission : 'denied');
    if (res.granted) {
      alert('เปิดใช้งานการแจ้งเตือนแล้ว');
    } else if (res.supported) {
      alert('ระบบไม่ได้รับอนุญาตให้ส่งการแจ้งเตือน');
    }
  };

  const formatTime = (ts?: number) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return '—';
    }
  };

  return (
    <ErrorBoundary>
      {/* Main App Shell - Transparent to allow body gradient to show through */}
      <div className="min-h-screen flex font-sans text-slate-700">
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onReset={handleResetSystem}
        onBackup={handleBackupData}
        onRestore={handleRestoreData}
        onSyncGoogleSheets={handleSyncGoogleSheets}
      />
      
      <div className="flex-1 flex flex-col lg:ml-[19rem] min-w-0 transition-all duration-500 ease-in-out">
        
        {/* Mobile Header - Glassmorphism */}
        <header className="lg:hidden sticky top-0 z-30 px-4 py-3 glass-panel border-b border-white/30 mx-4 mt-4 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl active:bg-emerald-100 transition-colors"><Menu size={24} /></button>
             <div className="flex items-center gap-2 text-emerald-700">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Leaf size={18} className="text-emerald-600" />
                </div>
                <span className="font-bold text-lg tracking-tight">Smart Waste</span>
             </div>
          </div>
          {/* Mobile Alert Badges */}
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold">
                {pendingCount} คิว
              </div>
            )}
            {syncStatus.lastStatus === 'fail' && (
              <div className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-[10px] font-bold">
                !sync
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 lg:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto pb-16">
            
            {/* Page Title */}
            <div className="hidden lg:flex items-end justify-between mb-10 animate-fade-in print:hidden">
              <div>
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-4 mb-2 text-gradient">
                    {currentView === 'dashboard' && 'Dashboard Overview'}
                    {currentView === 'entry' && 'Data Entry'}
                    {currentView === 'report' && 'Smart AI Report'}
                    {currentView === 'registry' && 'Staff Registry'}
                    {currentView === 'push' && 'Push Admin'}
                    {currentView === 'saved' && 'Saved Bookmarks'}
                </h1>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                     เทศบาลตำบลเมืองศรีไค อำเภอวารินชำราบ จังหวัดอุบลราชธานี
                </p>
              </div>
              {/* Context Info */}
              <div className="flex items-center gap-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div className="px-3 py-2 rounded-xl bg-white/70 border border-white/60 shadow-sm flex items-center justify-between min-w-[180px]">
                    <div>
                      <div className="text-[11px] uppercase text-slate-400 font-bold">Online</div>
                      <div className={`font-bold ${isOnline ? 'text-emerald-600' : 'text-red-600'}`}>{isOnline ? 'เชื่อมต่อ' : 'ออฟไลน์'}</div>
                    </div>
                    <span className="relative flex h-3 w-3">
                      <span className={`absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} opacity-75 animate-ping`}></span>
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/70 border border-white/60 shadow-sm min-w-[200px]">
                    <div className="text-[11px] uppercase text-slate-400 font-bold">Sync</div>
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {syncStatus.lastStatus === 'success' ? 'ปกติ' : syncStatus.lastStatus === 'fail' ? 'มีปัญหา' : 'รอซิงค์'}
                      <span className="text-[11px] text-slate-500">{formatTime(syncStatus.lastAt)}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{syncStatus.lastMessage || '—'}</div>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-white/70 border border-white/60 shadow-sm flex items-center justify-between min-w-[200px]">
                    <div>
                      <div className="text-[11px] uppercase text-slate-400 font-bold">Pending Queue</div>
                      <div className="font-bold text-slate-800">{pendingCount} รายการ</div>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const result = await flushPendingRecords();
                          setPendingCount(getPendingCount());
                          addAuditLog('AUTO_SYNC_SUCCESS', `Manual flush: success ${result.success}/${result.success + result.failed}`, 'System');
                          alert(`ส่งคิวค้างสำเร็จ ${result.success} รายการ`);
                        } catch (err) {
                          alert(err instanceof Error ? err.message : String(err));
                        }
                      }}
                      className="text-[11px] font-bold px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100"
                    >
                      Flush
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">แจ้งเตือน</div>
                  <div className="text-sm font-bold text-emerald-600 flex items-center justify-end gap-3">
                    {notifPermission !== 'granted' ? (
                      <button onClick={enableNotifications} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/60 border border-emerald-200 text-emerald-700 hover:bg-white transition-colors">
                        เปิดแจ้งเตือน
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        {!pushSubscribed && (
                          <>
                            <select value={pushRole} onChange={(e)=> setPushRole(e.target.value)} className="px-2 py-1 text-xs font-bold rounded-lg bg-white/70 border border-emerald-200 text-emerald-700">
                              <option value="viewer">ทั่วไป</option>
                              <option value="staff">เจ้าหน้าที่</option>
                              <option value="admin">ผู้ดูแล</option>
                            </select>
                            <button onClick={async () => { await subscribeUser('user-' + Date.now(), pushRole); setPushSubscribed(true); }} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                              สมัครรับแจ้งเตือน
                            </button>
                          </>
                        )}
                        {pushSubscribed && (
                          <button onClick={async () => { await unsubscribeUser(); setPushSubscribed(false); }} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors">
                            ยกเลิกแจ้งเตือน
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* View Content Container with Animation */}
            <div key={currentView} className="animate-slide-up">
              <React.Suspense fallback={<div className="text-sm text-slate-500 p-6">Loading view...</div>}>
                {currentView === 'dashboard' && <Dashboard records={records} onBookmark={handleBookmark} auditLogs={auditLogs} onNavigate={setCurrentView} />}
                {currentView === 'entry' && <DataEntryForm onAddRecord={handleAddRecord} onImportRecords={handleImportRecords} savedIdentities={savedIdentities} existingRecords={records} />}
                {currentView === 'report' && <AnalysisReport records={records} savedIdentities={savedIdentities} onSaveIdentity={updateIdentities} />}
                {currentView === 'registry' && <StaffRegistry identities={savedIdentities} onAddIdentity={updateIdentities} onRemoveIdentities={removeIdentities} onEditIdentity={handleEditIdentity} onClearRegistry={handleClearRegistry} />}
                {currentView === 'push' && <AdminPushPanel />}
              </React.Suspense>
              {currentView === 'saved' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                    {bookmarks.length === 0 ? (
                      <div className="col-span-full glass-panel rounded-3xl p-16 text-center border-dashed border-2 border-slate-300/50">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                            <Bookmark className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">No Bookmarks Yet</h3>
                        <p className="text-slate-400 max-w-xs mx-auto">Save important dashboard views to access them quickly later.</p>
                      </div>
                    ) : (
                      bookmarks.map((b, idx) => (
                        <div key={idx} className="glass-panel p-6 rounded-3xl shadow-sm hover:shadow-glass-hover transition-all duration-300 relative overflow-hidden group border border-white/60">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full -mr-12 -mt-12 opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
                          <div className="relative z-10">
                              <div className="flex justify-between items-start mb-4">
                                 <div className="p-2.5 bg-white rounded-xl text-amber-500 shadow-sm"><Bookmark size={20}/></div>
                                 <div className="text-[10px] font-bold bg-white/60 px-2 py-1 rounded-lg text-slate-500">{b.date}</div>
                              </div>
                              <h3 className="text-2xl font-bold text-slate-800 mb-1">Year {b.year}</h3>
                              <p className="text-xs text-slate-500 font-medium mb-6">Saved Snapshot</p>
                              
                              <div className="flex gap-3">
                                <button onClick={() => { alert('Load Snapshot: Feature coming soon'); }} className="flex-1 py-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-colors">Load View</button>
                                <button onClick={() => { const newB = bookmarks.filter((_, i) => i !== idx); setBookmarks(newB); }} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-400 text-xs font-bold rounded-xl hover:text-red-500 hover:border-red-200 transition-colors">Remove</button>
                              </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
            </div>

          </div>
        </main>
      </div>
      {toast.visible && (
        <SyncToast
          message={toast.message}
          type={toast.type}
          subtitle={toast.subtitle}
          isLoading={toast.isLoading}
          attempt={toast.attempt}
          persistent={toast.persistent}
          onRetry={toast.onRetry || undefined}
          onViewLogs={toast.onViewLogs || undefined}
          onClose={() => setToast({ visible: false, message: '', type: 'info', isLoading: false, persistent: false, onRetry: null, onViewLogs: null })}
        />
      )}
      {showAuditModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAuditModal(false)} />
          <div className="relative max-w-4xl w-full mx-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold">Audit Logs</h3>
                <button onClick={() => setShowAuditModal(false)} className="text-sm text-slate-500">ปิด</button>
              </div>
              <AuditLogViewer />
            </div>
          </div>
        </div>
      )}
      <PwaUpdateToast />
      <PWAInstallPrompt />
      </div>
    </ErrorBoundary>
  );
}

export default App;
