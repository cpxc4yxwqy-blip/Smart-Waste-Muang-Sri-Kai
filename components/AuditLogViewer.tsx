import React, { useEffect, useState } from 'react';
import { Clock, Trash2 } from 'lucide-react';
import { AuditLog } from '../types';
import { getSyncStatus, getPendingRecords, getPendingCount } from '../services/googleSheetsService';

function readLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem('waste_logs') || '[]';
    const parsed = JSON.parse(raw) as AuditLog[];
    return parsed.sort((a,b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error('Failed to parse audit logs', e);
    return [];
  }
}

function exportDiagnostics(logs: AuditLog[]) {
  const payload = {
    generatedAt: new Date().toISOString(),
    syncStatus: getSyncStatus(),
    pendingCount: getPendingCount(),
    pendingRecords: getPendingRecords().slice(0, 20),
    logs
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diagnostics_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  useEffect(() => {
    setLogs(readLogs());
  }, []);

  const handleRefresh = () => setLogs(readLogs());

  const handleClear = () => {
    if (!confirm('ลบประวัติทั้งหมด?')) return;
    localStorage.setItem('waste_logs', JSON.stringify([]));
    setLogs([]);
  };

  const exportFiltered = () => {
    const filtered = applyFilters(logs);
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const exportCSV = () => {
    const filtered = applyFilters(logs);
    const headers = ['id','action','details','timestamp','user'];
    const rows = filtered.map(l => [l.id, l.action, `"${(l.details||'').replace(/"/g,'""')}"`, new Date(l.timestamp).toISOString(), l.user]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const applyFilters = (list: AuditLog[]) => {
    return list.filter(l => {
      if (filterAction !== 'ALL' && l.action !== filterAction) return false;
      if (startDate) {
        const s = new Date(startDate).getTime();
        if (l.timestamp < s) return false;
      }
      if (endDate) {
        const e = new Date(endDate).getTime() + 24*60*60*1000 - 1;
        if (l.timestamp > e) return false;
      }
      return true;
    });
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center">
            <Clock className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h4 className="font-bold">Audit Logs</h4>
            <div className="text-xs text-slate-500">บันทึกการแก้ไขและกิจกรรมระบบ (ล่าสุดอยู่บนสุด)</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="px-2 py-1 border rounded text-sm">
            <option value="ALL">All Actions</option>
            <option value="ADD">ADD</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="IMPORT">IMPORT</option>
            <option value="AUTO_SYNC_SUCCESS">AUTO_SYNC_SUCCESS</option>
            <option value="AUTO_SYNC_FAIL">AUTO_SYNC_FAIL</option>
            <option value="AUTO_SYNC_RETRY">AUTO_SYNC_RETRY</option>
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="px-2 py-1 border rounded text-sm" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="px-2 py-1 border rounded text-sm" />
          <button onClick={handleRefresh} className="px-3 py-1 rounded bg-emerald-50 text-emerald-700 text-xs">รีเฟรช</button>
          <button onClick={exportFiltered} className="px-3 py-1 rounded bg-blue-50 text-blue-700 text-xs">ส่งออก JSON</button>
          <button onClick={exportCSV} className="px-3 py-1 rounded bg-slate-50 text-slate-700 text-xs">ส่งออก CSV</button>
          <button onClick={() => exportDiagnostics(applyFilters(logs))} className="px-3 py-1 rounded bg-amber-50 text-amber-700 text-xs">ส่งออก Diagnostics</button>
          <button onClick={handleClear} className="px-3 py-1 rounded bg-red-50 text-red-700 text-xs flex items-center gap-2"><Trash2 className="w-4 h-4" /> ลบทั้งหมด</button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {applyFilters(logs).length === 0 ? (
          <div className="text-sm text-slate-500 p-4">ยังไม่มีบันทึก</div>
        ) : (
          <>
            <ul className="space-y-2">
              {applyFilters(logs).slice((page-1)*pageSize, page*pageSize).map(log => (
                <li key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{log.action}</div>
                    <div className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{log.details}</div>
                  <div className="text-[11px] text-slate-400 mt-1">โดย: {log.user}</div>
                </li>
              ))}
            </ul>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500">หน้า {page} / {Math.max(1, Math.ceil(applyFilters(logs).length / pageSize))}</div>
              <div className="flex items-center gap-2">
                <select value={pageSize} onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1); }} className="px-2 py-1 border rounded text-sm">
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                </select>
                <button onClick={() => setPage(p => Math.max(1, p-1))} className="px-2 py-1 border rounded text-xs">ก่อนหน้า</button>
                <button onClick={() => setPage(p => Math.min(Math.max(1, Math.ceil(applyFilters(logs).length / pageSize)), p+1))} className="px-2 py-1 border rounded text-xs">ถัดไป</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
