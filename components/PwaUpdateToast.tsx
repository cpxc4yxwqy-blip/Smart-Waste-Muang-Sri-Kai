import React, { useEffect, useState } from 'react';

declare global {
  interface Window {
    __updateServiceWorker?: (reloadPage?: boolean) => Promise<void> | void;
  }
}

export default function PwaUpdateToast() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    function onNeedRefresh() {
      setVisible(true);
      // Try to fetch last-modified of sw.js to show an approximate update time
      fetch('/sw.js', { method: 'HEAD' })
        .then(res => {
          const lm = res.headers.get('last-modified');
          if (lm) setUpdatedAt(new Date(lm).toLocaleString());
        })
        .catch(() => {
          // ignore
        });
    }
    window.addEventListener('swNeedRefresh', onNeedRefresh as EventListener);
    return () => window.removeEventListener('swNeedRefresh', onNeedRefresh as EventListener);
  }, []);

  async function doRefresh() {
    setVisible(false);
    try {
      if (window.__updateServiceWorker) {
        await window.__updateServiceWorker(true);
        return;
      }
      window.location.reload();
    } catch (e) {
      console.error('Failed to update service worker', e);
      window.location.reload();
    }
  }

  if (!visible) return null;

  return (
    <>
      <div className="fixed right-5 bottom-5 z-50">
        <div className="max-w-sm w-full bg-white/5 backdrop-blur-md border border-white/10 text-white p-4 rounded-xl shadow-lg flex items-center gap-3">
          <div className="flex-1">
            <div className="font-semibold">มีเวอร์ชันใหม่</div>
            <div className="text-xs text-slate-300 mt-1">เวอร์ชันใหม่พร้อมใช้งานสำหรับการติดตั้ง</div>
            {updatedAt && <div className="text-[11px] text-slate-400 mt-1">อัปเดต: {updatedAt}</div>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={doRefresh} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-md text-sm">รีเฟรช</button>
            <button onClick={() => setDetailsOpen(true)} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-md text-sm">รายละเอียด</button>
            <button onClick={() => setVisible(false)} className="text-slate-300 hover:text-white px-2 py-1">×</button>
          </div>
        </div>
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDetailsOpen(false)}></div>
          <div className="relative bg-white rounded-xl max-w-xl w-full mx-4 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-800">รายละเอียดเวอร์ชันใหม่</h3>
            <p className="text-sm text-slate-600 mt-3">มีการอัปเดตในระบบคุณ สามารถรีเฟรชเพื่อรับเวอร์ชันล่าสุด</p>
            <div className="mt-4 text-sm text-slate-500">
              <div className="font-medium">สรุปการเปลี่ยนแปลง</div>
              <ul className="list-disc list-inside mt-2 text-slate-600">
                <li>ปรับปรุงประสิทธิภาพการโหลด</li>
                <li>เพิ่มการรองรับ PWA และการแจ้งเตือนอัปเดต</li>
                <li>แก้ไขบั๊กเล็กน้อยและปรับ UI</li>
              </ul>
              {updatedAt && <div className="mt-3 text-xs text-slate-400">เวลาอัปเดต: {updatedAt}</div>}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setDetailsOpen(false)} className="px-4 py-2 rounded-md bg-white border border-slate-200">ปิด</button>
              <button onClick={doRefresh} className="px-4 py-2 rounded-md bg-emerald-600 text-white">รีเฟรชตอนนี้</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
