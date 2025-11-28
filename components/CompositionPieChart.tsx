import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

interface Props { compositionData: any[]; }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-2xl shadow-xl border border-white/60">
        <p className="text-slate-800 font-bold text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-500">{entry.name}:</span>
            <span className="font-bold text-slate-700">
              {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} กก.
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CompositionPieChart: React.FC<Props> = ({ compositionData }) => (
  <div className="glass-panel rounded-3xl p-6 flex flex-col relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 opacity-50" />
    <div className="mb-4 relative z-10">
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-500 rounded-full shadow-glow" />
        องค์ประกอบขยะ
      </h3>
      <p className="text-xs text-slate-400 pl-3 mt-1 font-medium">สัดส่วนแยกตามประเภท</p>
    </div>
    <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
      {compositionData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={compositionData}
              innerRadius={70}
              outerRadius={90}
              paddingAngle={8}
              dataKey="value"
              stroke="none"
              cornerRadius={8}
            >
              {compositionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: 'drop-shadow(0px 6px 10px rgba(0,0,0,0.1))' }} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} formatter={(value) => <span className="text-xs font-bold text-slate-600 ml-1">{value}</span>} />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center text-slate-300 flex flex-col items-center justify-center h-full">
          <div className="p-4 bg-slate-50 rounded-full mb-2"><PieIcon size={32} className="opacity-50" /></div>
          <p className="text-xs font-medium">ไม่มีข้อมูลองค์ประกอบขยะ</p>
        </div>
      )}
    </div>
  </div>
);

export default CompositionPieChart;
