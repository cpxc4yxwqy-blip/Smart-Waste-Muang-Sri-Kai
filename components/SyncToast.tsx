import React, { useEffect } from 'react';

interface SyncToastProps {
  id?: string;
  message: string;
  type?: 'success' | 'error' | 'info';
  subtitle?: string;
  onClose?: () => void;
  duration?: number;
  isLoading?: boolean;
  attempt?: { current: number; total?: number };
  persistent?: boolean;
  onRetry?: () => void;
  onViewLogs?: () => void;
}

export default function SyncToast({ message, type = 'info', subtitle, onClose, duration = 3500, isLoading = false, attempt, persistent = false, onRetry, onViewLogs }: SyncToastProps) {
  useEffect(() => {
    if (persistent || type === 'error') return; // don't auto-close persistent or error toasts
    const t = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(t);
  }, [duration, onClose, persistent, type]);

  const bg = type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800';

  return (
    <div className={`fixed bottom-6 right-6 z-60 w-96 rounded-xl shadow-lg border p-3 ${bg}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm font-medium flex items-center gap-2">
            {isLoading && <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.2" /><path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg>}
            <span>{message}</span>
          </div>
          {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
          {attempt && <div className="text-xs text-slate-500 mt-2">Attempt: {attempt.current}{attempt.total ? ` / ${attempt.total}` : ''}</div>}
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          <button onClick={() => onClose && onClose()} className="text-xs text-slate-500 hover:text-slate-700">ปิด</button>
        </div>
      </div>
      <div className="mt-3 flex gap-2 justify-end">
        {onViewLogs && (
          <button onClick={onViewLogs} className="px-3 py-1 text-xs bg-white border rounded text-slate-700 hover:bg-slate-50">ดูบันทึก</button>
        )}
        {onRetry && (
          <button onClick={onRetry} className="px-3 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700">ลองอีกครั้ง</button>
        )}
      </div>
    </div>
  );
}
