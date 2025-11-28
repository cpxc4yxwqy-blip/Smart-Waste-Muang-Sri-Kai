import React, { useState } from 'react';
import { Bell, Send, Users, UserCheck, Eye } from 'lucide-react';
import { sendPushNotification } from '../services/backendApi';

const AdminPushPanel: React.FC = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState<string>('all');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleSend = async () => {
    if (!title.trim() && !body.trim()) {
      alert('กรุณาใส่หัวข้อหรือข้อความ');
      return;
    }
    setSending(true);
    setResult('');
    try {
      const roles = targetRole === 'all' ? undefined : [targetRole];
      const res = await sendPushNotification(title, body, roles);
      setResult(`ส่งสำเร็จ: ${res.sent} รายการ, ล้มเหลว: ${res.failed}`);
      setTitle('');
      setBody('');
    } catch (error) {
      setResult('เกิดข้อผิดพลาดในการส่ง');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-glass border border-white/60">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
          <Bell size={24} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">ส่งการแจ้งเตือน</h3>
          <p className="text-xs text-slate-500">Push notification ตามกลุ่มผู้ใช้</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">หัวข้อ</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="เช่น แจ้งเตือนขยะล้น"
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">ข้อความ</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="รายละเอียดข้อความ..."
            rows={3}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
          />
        </div>

        <div>
          <label className="text-sm font-bold text-slate-700 mb-2 block">กลุ่มเป้าหมาย</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTargetRole('all')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                targetRole === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-200'
              }`}
            >
              <Users size={18} />
              ทั้งหมด
            </button>
            <button
              onClick={() => setTargetRole('admin')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                targetRole === 'admin'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-rose-200'
              }`}
            >
              <UserCheck size={18} />
              Admin
            </button>
            <button
              onClick={() => setTargetRole('staff')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                targetRole === 'staff'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-200'
              }`}
            >
              <UserCheck size={18} />
              Staff
            </button>
            <button
              onClick={() => setTargetRole('viewer')}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                targetRole === 'viewer'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-200'
              }`}
            >
              <Eye size={18} />
              Viewer
            </button>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          <Send size={20} />
          {sending ? 'กำลังส่ง...' : 'ส่งการแจ้งเตือน'}
        </button>

        {result && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm font-bold text-green-700">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPushPanel;
