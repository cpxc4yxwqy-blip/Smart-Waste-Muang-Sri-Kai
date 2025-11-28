import React, { useState } from 'react';
import { IdentityProfile } from '../types';
import { UserPlus, Trash2, Users, Shield, Briefcase, Search, Edit2, X, CheckSquare, Square, Eraser } from 'lucide-react';

interface StaffRegistryProps {
  identities: IdentityProfile[];
  onAddIdentity: (name: string, position: string) => void;
  onRemoveIdentities: (indices: number[]) => void;
  onEditIdentity?: (index: number, name: string, position: string) => void;
  onClearRegistry?: () => void;
}

const StaffRegistry: React.FC<StaffRegistryProps> = ({ identities, onAddIdentity, onRemoveIdentities, onEditIdentity, onClearRegistry }) => {
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && position.trim()) {
      if (editingIndex !== null && onEditIdentity) {
        onEditIdentity(editingIndex, name.trim(), position.trim());
        setEditingIndex(null);
      } else {
        onAddIdentity(name.trim(), position.trim());
      }
      setName('');
      setPosition('');
    }
  };

  const handleEditClick = (index: number, person: IdentityProfile) => {
    setEditingIndex(index);
    setName(person.name);
    setPosition(person.position);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setName('');
    setPosition('');
  };

  const handleDeleteFromEdit = () => {
    if (editingIndex !== null) {
      if (window.confirm('ยืนยันการลบรายชื่อนี้?')) {
        onRemoveIdentities([editingIndex]);
        handleCancelEdit();
      }
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIndices.length === filteredIdentities.length) {
        setSelectedIndices([]);
    } else {
        setSelectedIndices(filteredIdentities.map(i => i.originalIndex));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIndices.length === 0) return;
    if (window.confirm(`คุณต้องการลบรายชื่อที่เลือกทั้งหมด ${selectedIndices.length} รายการหรือไม่?`)) {
        onRemoveIdentities(selectedIndices);
        setSelectedIndices([]);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('คำเตือน: คุณต้องการลบรายชื่อบุคลากร "ทั้งหมด" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
        if (onClearRegistry) {
            onClearRegistry();
            setSelectedIndices([]);
        }
    }
  };

  const filteredIdentities = identities.map((id, index) => ({ ...id, originalIndex: index }))
    .filter(
      id => id.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            id.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-emerald-600" size={28} />
            ทะเบียนบุคลากร (Staff Registry)
          </h1>
          <p className="text-slate-500 mt-1">จัดการรายชื่อผู้บันทึกข้อมูลและผู้จัดทำรายงานของเทศบาล</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2 flex-1 md:w-64">
                <Search size={18} className="text-slate-400 ml-1" />
                <input 
                type="text" 
                placeholder="ค้นหารายชื่อ..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none text-sm bg-transparent"
                />
            </div>
            {onClearRegistry && identities.length > 0 && (
                <button 
                    onClick={handleClearAll}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-bold flex items-center gap-2 transition-colors"
                >
                    <Eraser size={16} /> ล้างทั้งหมด
                </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add/Edit Form */}
        <div className="lg:col-span-1">
          <div className={`p-6 rounded-2xl shadow-sm border sticky top-6 transition-colors ${editingIndex !== null ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
            <h2 className={`font-bold text-lg mb-6 flex items-center gap-2 ${editingIndex !== null ? 'text-amber-800' : 'text-slate-800'}`}>
              {editingIndex !== null ? <Edit2 size={20} /> : <UserPlus size={20} className="text-emerald-600" />}
              {editingIndex !== null ? 'แก้ไขข้อมูล' : 'เพิ่มรายชื่อใหม่'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  placeholder="ระบุชื่อ-นามสกุล"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ตำแหน่ง</label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  placeholder="ระบุตำแหน่งงาน"
                  required
                />
              </div>
              
              <div className="flex gap-2">
                {editingIndex !== null && (
                  <button type="button" onClick={handleDeleteFromEdit} className="px-3 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl font-bold hover:bg-red-100 transition-colors" title="ลบรายชื่อนี้"><Trash2 size={18} /></button>
                )}
                {editingIndex !== null && (
                  <button type="button" onClick={handleCancelEdit} className="flex-1 py-3 bg-white border border-slate-300 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2"><X size={18} /> ยกเลิก</button>
                )}
                <button type="submit" className={`flex-1 py-3 text-white rounded-xl font-bold transition-colors shadow-lg flex justify-center items-center gap-2 ${editingIndex !== null ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/10' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/10'}`}>
                  {editingIndex !== null ? <Edit2 size={18} /> : <UserPlus size={18} />}
                  {editingIndex !== null ? 'อัปเดต' : 'บันทึก'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-3">
                   <button onClick={toggleSelectAll} className="text-slate-500 hover:text-emerald-600">
                     {selectedIndices.length > 0 && selectedIndices.length === filteredIdentities.length ? <CheckSquare size={20} className="text-emerald-600"/> : <Square size={20}/>}
                   </button>
                   <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">รายชื่อในระบบ ({filteredIdentities.length})</span>
                </div>
                {selectedIndices.length > 0 && (
                    <button onClick={handleBulkDelete} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100 transition-colors flex items-center gap-1">
                        <Trash2 size={14}/> ลบที่เลือก ({selectedIndices.length})
                    </button>
                )}
             </div>
             {filteredIdentities.length === 0 ? (
                <div className="p-12 text-center text-slate-400"><Users size={48} className="mx-auto mb-4 opacity-20" /><p>ไม่พบข้อมูลบุคลากร</p></div>
             ) : (
               <div className="divide-y divide-slate-50">
                 {filteredIdentities.map((person) => (
                   <div key={person.originalIndex} className={`p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group ${editingIndex === person.originalIndex ? 'bg-amber-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <button onClick={() => toggleSelect(person.originalIndex)} className="text-slate-300 hover:text-emerald-500">
                           {selectedIndices.includes(person.originalIndex) ? <CheckSquare size={20} className="text-emerald-600"/> : <Square size={20}/>}
                        </button>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border ${editingIndex === person.originalIndex ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                           {person.name.charAt(0)}
                        </div>
                        <div>
                           <h3 className={`font-bold ${editingIndex === person.originalIndex ? 'text-amber-800' : 'text-slate-800'}`}>{person.name}</h3>
                           <div className="flex items-center gap-1 text-xs text-slate-500"><Briefcase size={12} />{person.position}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 transition-opacity">
                        <button onClick={() => handleEditClick(person.originalIndex, person)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"><Edit2 size={18} /></button>
                        <button onClick={() => { if(window.confirm('ยืนยันการลบรายชื่อนี้?')) onRemoveIdentities([person.originalIndex]); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
          <div className="mt-4 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
             <Shield className="text-blue-500 mt-0.5 shrink-0" size={20} />
             <div className="text-sm text-blue-900"><p className="font-bold mb-1">ความสำคัญของทะเบียนบุคลากร</p><p className="opacity-80">รายชื่อในหน้านี้จะถูกนำไปแสดงใน "รายการเลือก" (Dropdown) ของหน้าบันทึกข้อมูลและหน้าจัดทำรายงานโดยอัตโนมัติ</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRegistry;