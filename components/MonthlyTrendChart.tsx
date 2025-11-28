import React from 'react';
import { ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Area, Bar } from 'recharts';

interface Props {
  chartData: any[];
  compositionData: any[];
  isCompareMode: boolean;
  selectedYear: number;
  compareYear: number;
}

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
              {entry.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {entry.unit || 'ตัน'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const MonthlyTrendChart: React.FC<Props> = ({ chartData, compositionData, isCompareMode, selectedYear, compareYear }) => (
  <div className="glass-panel rounded-3xl p-6 lg:col-span-2 flex flex-col">
    <div className="flex items-center justify-between mb-8">
      <div>
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-6 bg-emerald-500 rounded-full shadow-glow" />
          แนวโน้มรายเดือน
        </h3>
        <p className="text-xs text-slate-400 pl-3 mt-1 font-medium">ปริมาณขยะ (ตัน) แยกรายเดือน</p>
      </div>
    </div>
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTon" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} dy={10} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8', fontWeight: 500 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.02)' }} />
          {!isCompareMode && compositionData.length > 0 ? (
            <>
              <Bar dataKey="genTon" stackId="a" fill="#60a5fa" name="ทั่วไป" radius={[0, 0, 0, 0]} barSize={30} />
              <Bar dataKey="orgTon" stackId="a" fill="#34d399" name="อินทรีย์" barSize={30} />
              <Bar dataKey="recTon" stackId="a" fill="#fbbf24" name="รีไซเคิล" barSize={30} />
              <Bar dataKey="hazTon" stackId="a" fill="#f87171" name="อันตราย" radius={[6, 6, 0, 0]} barSize={30} />
            </>
          ) : (
            <>
              <Area type="monotone" dataKey="amountTon" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorTon)" name={`ปี ${selectedYear}`} />
              {isCompareMode && <Area type="monotone" dataKey="compareAmountTon" stroke="#818cf8" strokeWidth={3} strokeDasharray="5 5" fill="url(#colorCompare)" name={`ปี ${compareYear}`} />}
            </>
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default MonthlyTrendChart;
