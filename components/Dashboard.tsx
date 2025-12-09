import React, { useMemo, useState, useEffect } from 'react';
// Recharts moved into lazy subcomponents to split bundle
import ReactLazy from 'react';
const MonthlyTrendChart = ReactLazy.lazy(() => import('./MonthlyTrendChart'));
const CompositionPieChart = ReactLazy.lazy(() => import('./CompositionPieChart'));
const WasteBarChart = ReactLazy.lazy(() => import('./WasteBarChart'));
const PerCapitaChart = ReactLazy.lazy(() => import('./PerCapitaChart'));
const ComparisonLineChart = ReactLazy.lazy(() => import('./ComparisonLineChart'));
const CompositionRadarChart = ReactLazy.lazy(() => import('./CompositionRadarChart'));
import { WasteRecord, THAI_MONTHS, THAI_MONTHS_ABBR, AuditLog } from '../types';
import {
  Scale, Filter, Sparkles, ArrowUpRight, ArrowDownRight, Clock,
  CalendarX, Split, PlusCircle, Table as TableIcon, PieChart as PieIcon,
  Gauge, Coins, Users, Search, Download, Target, TrendingDown, AlertTriangle,
  BarChart3, Activity, Radar
} from 'lucide-react';
import { generateDashboardInsight, generateComparisonInsight } from '../services/geminiService';

interface DashboardProps {
  records: WasteRecord[];
  auditLogs: AuditLog[];
  onBookmark: (year: number) => void;
  onNavigate: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ records, onNavigate }) => {
  const currentYear = new Date().getFullYear() + 543;
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [compareYear, setCompareYear] = useState<number>(currentYear - 1);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // KPIs & Settings
  const [costPerTon, setCostPerTon] = useState<number>(() => {
    const saved = localStorage.getItem('waste_cost_per_ton');
    return saved ? parseFloat(saved) : 500;
  });
  const [wasteTarget, setWasteTarget] = useState<number>(() => {
    const saved = localStorage.getItem('waste_yearly_target');
    return saved ? parseFloat(saved) : 500; // Default 500 Tons
  });

  const [insight, setInsight] = useState<string>('');
  const [insightLoading, setInsightLoading] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveWasteEstimate, setLiveWasteEstimate] = useState(0);

  useEffect(() => { localStorage.setItem('waste_cost_per_ton', costPerTon.toString()); }, [costPerTon]);
  useEffect(() => { localStorage.setItem('waste_yearly_target', wasteTarget.toString()); }, [wasteTarget]);

  const availableYears = useMemo(() => {
    const years: number[] = Array.from(new Set(records.map(r => r.year)));
    if (!years.includes(currentYear)) years.push(currentYear);
    return years.sort((a, b) => b - a);
  }, [records, currentYear]);

  const chartRecords = useMemo(() => {
    return records.filter(r => r.year === selectedYear).sort((a, b) => a.month - b.month);
  }, [records, selectedYear]);

  const tableRecords = useMemo(() => {
    let data = records.filter(r => r.year === selectedYear);
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      data = data.filter(r =>
        THAI_MONTHS[r.month - 1].includes(lowerTerm) ||
        (r.recorderName && r.recorderName.toLowerCase().includes(lowerTerm)) ||
        (r.note && r.note.toLowerCase().includes(lowerTerm))
      );
    }
    return data.sort((a, b) => b.timestamp - a.timestamp);
  }, [records, selectedYear, searchTerm]);

  const comparisonRecords = useMemo(() => {
    return records.filter(r => r.year === compareYear).sort((a, b) => a.month - b.month);
  }, [records, compareYear]);

  const stats = useMemo(() => {
    if (chartRecords.length === 0) return { totalTon: '0.00', latestRate: '0.00', totalCost: '0', latestPop: '0', variancePercent: 0, popVariancePercent: 0, hasComparison: false, avgKgPerDay: 0, totalRaw: 0 };

    const total = chartRecords.reduce((sum, r) => sum + r.amountKg, 0);
    const latest = chartRecords[chartRecords.length - 1];
    const rate = latest.population > 0 ? (latest.amountKg / latest.population / 30) : 0;
    const totalCost = (total / 1000) * costPerTon;

    let variancePercent = 0;
    let popVariancePercent = 0;
    let hasComparison = false;

    if (comparisonRecords.length > 0) {
      const totalCompare = comparisonRecords.reduce((sum, r) => sum + r.amountKg, 0);
      const avgPopCurrent = chartRecords.length > 0 ? chartRecords.reduce((s, r) => s + r.population, 0) / chartRecords.length : 0;
      const avgPopCompare = comparisonRecords.length > 0 ? comparisonRecords.reduce((s, r) => s + r.population, 0) / comparisonRecords.length : 0;

      if (totalCompare > 0) {
        variancePercent = ((total - totalCompare) / totalCompare) * 100;
        hasComparison = true;
      }
      if (avgPopCompare > 0) {
        popVariancePercent = ((avgPopCurrent - avgPopCompare) / avgPopCompare) * 100;
      }
    }

    return {
      totalRaw: total / 1000, // In Tons
      totalTon: (total / 1000).toFixed(2),
      latestPop: latest.population.toLocaleString(),
      avgKgPerDay: total / (chartRecords.length * 30),
      latestRate: rate.toFixed(3),
      totalCost: totalCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
      variancePercent,
      popVariancePercent,
      hasComparison
    };
  }, [chartRecords, comparisonRecords, costPerTon]);

  // KPI Calculation
  const kpiProgress = useMemo(() => {
    if (wasteTarget <= 0) return 0;
    const progress = (stats.totalRaw / wasteTarget) * 100;
    return Math.min(progress, 100);
  }, [stats.totalRaw, wasteTarget]);

  const compositionData = useMemo(() => {
    let general = 0, organic = 0, recycle = 0, hazardous = 0;
    chartRecords.forEach(r => {
      if (r.composition) {
        general += r.composition.general;
        organic += r.composition.organic;
        recycle += r.composition.recycle;
        hazardous += r.composition.hazardous;
      }
    });
    const total = general + organic + recycle + hazardous;
    if (total === 0) return [];

    return [
      { name: 'ทั่วไป', value: general, color: '#60a5fa' },  // Blue-400
      { name: 'อินทรีย์', value: organic, color: '#34d399' }, // Emerald-400
      { name: 'รีไซเคิล', value: recycle, color: '#fbbf24' }, // Amber-400
      { name: 'อันตราย', value: hazardous, color: '#f87171' }, // Red-400
    ].filter(d => d.value > 0);
  }, [chartRecords]);

  // Premium Chart Palette
  const COLORS = {
    amount: '#10b981', // Emerald-500
    compare: '#cbd5e1', // Slate-300
    general: '#3b82f6', // Blue-500
    organic: '#10b981', // Emerald-500
    recycle: '#f59e0b', // Amber-500
    hazardous: '#ef4444', // Red-500
  };

  const chartData = useMemo(() => {
    return THAI_MONTHS.map((month, index) => {
      const pRecord = chartRecords.find(r => r.month === index + 1);
      const cRecord = comparisonRecords.find(r => r.month === index + 1);
      const pRate = (pRecord && pRecord.population > 0) ? (pRecord.amountKg / pRecord.population / 30) : 0;
      const comp = pRecord?.composition || { general: 0, organic: 0, recycle: 0, hazardous: 0 };

      return {
        name: THAI_MONTHS_ABBR[index], // Use Abbreviation
        fullName: month,
        amountTon: pRecord ? parseFloat((pRecord.amountKg / 1000).toFixed(2)) : 0,
        compareAmountTon: cRecord ? parseFloat((cRecord.amountKg / 1000).toFixed(2)) : 0,
        rate: parseFloat(pRate.toFixed(3)),
        genTon: parseFloat((comp.general / 1000).toFixed(2)),
        orgTon: parseFloat((comp.organic / 1000).toFixed(2)),
        recTon: parseFloat((comp.recycle / 1000).toFixed(2)),
        hazTon: parseFloat((comp.hazardous / 1000).toFixed(2)),
        targetLine: (wasteTarget / 12).toFixed(2) // Average monthly target
      };
    });
  }, [chartRecords, comparisonRecords, wasteTarget]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      if (stats.avgKgPerDay) {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const secondsPassed = (now.getTime() - startOfDay) / 1000;
        setLiveWasteEstimate((stats.avgKgPerDay / 86400) * secondsPassed);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [stats.avgKgPerDay]);

  const getSmartInsight = async () => {
    setInsightLoading(true);
    const result = isCompareMode && chartRecords.length > 0 && comparisonRecords.length > 0
      ? await generateComparisonInsight(selectedYear, chartRecords, compareYear, comparisonRecords)
      : await generateDashboardInsight(chartRecords);
    setInsight(result);
    setInsightLoading(false);
  };

  // Tooltip moved into subcomponent implementation

  return (
    <div className="space-y-8 pb-20 animate-slide-up">

      {/* Hero Section: Live Data & KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Clock & Est */}
        <div className="lg:col-span-2 relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 shadow-2xl shadow-slate-300/50 p-[1px]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px] -mr-32 -mt-32 animate-pulse-slow pointer-events-none"></div>

          <div className="relative z-10 bg-slate-900/50 backdrop-blur-sm rounded-[23px] p-8 md:p-10 flex flex-col md:flex-row justify-between items-center gap-6 h-full">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner ring-1 ring-white/5">
                <Clock size={32} className="text-emerald-300" />
              </div>
              <div>
                <h2 className="text-4xl xl:text-5xl font-bold text-white tracking-tighter tabular-nums leading-none">
                  {currentTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </h2>
                <p className="text-slate-400 font-medium mt-2 text-lg">
                  {currentTime.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full w-fit border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Last updated: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="glass-panel bg-white/5 border-white/10 p-6 rounded-2xl w-full md:w-auto min-w-[220px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/20 blur-2xl rounded-full -mr-5 -mt-5 group-hover:bg-emerald-400/30 transition-colors"></div>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-3">Est. Waste Today</p>
              <div className="flex items-end justify-between relative z-10">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl xl:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-emerald-400 tabular-nums tracking-tight">{liveWasteEstimate.toFixed(2)}</span>
                  <span className="text-sm font-bold text-emerald-600/70">kg</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
                  <span className="text-[10px] text-emerald-500/70 font-medium">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Target Card */}
        <div className="glass-panel rounded-3xl p-6 border border-white/60 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                <Target className="text-rose-500" size={20} />
                <h3>Yearly Target</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">Goal vs Actual (Ton)</p>
            </div>
            <div className="bg-rose-50 p-2 rounded-xl text-rose-500 cursor-pointer hover:bg-rose-100 transition-colors group relative">
              <Target size={20} />
              <div className="absolute right-0 top-full mt-2 w-48 bg-white p-3 rounded-xl shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all z-50">
                <label className="text-xs font-bold text-slate-600 block mb-1">Set Limit (Ton/Year)</label>
                <input
                  type="number"
                  value={wasteTarget}
                  onChange={(e) => setWasteTarget(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-1.5 text-sm font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-bold text-slate-800">{stats.totalTon}</span>
              <span className="text-sm font-bold text-slate-400">/ {wasteTarget} Ton</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${kpiProgress > 100 ? 'bg-red-500' : kpiProgress > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${kpiProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-xs font-bold">
              <span className={`${kpiProgress > 100 ? 'text-red-500' : 'text-emerald-600'}`}>{kpiProgress.toFixed(1)}% Used</span>
              <span className="text-slate-400">{wasteTarget - stats.totalRaw > 0 ? `${(wasteTarget - stats.totalRaw).toFixed(2)} Ton left` : 'Over Limit!'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Control Bar */}
      <div className="glass-panel p-2 rounded-2xl shadow-glass flex flex-col xl:flex-row justify-between gap-3 sticky top-4 z-30 transition-all duration-300">
        <div className="flex flex-wrap items-center gap-2 p-1">
          <div className="relative group w-full md:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาข้อมูล..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/50 hover:bg-white border border-transparent hover:border-slate-200 focus:bg-white focus:border-emerald-200 rounded-xl text-sm font-medium outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden md:block"></div>
          <div className="flex items-center gap-2 bg-white/50 px-1 p-1 rounded-xl border border-slate-100">
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-transparent py-1.5 pl-3 pr-8 font-bold text-slate-700 outline-none cursor-pointer text-sm hover:text-emerald-600 transition-colors appearance-none">
              {availableYears.map(y => <option key={y} value={y}>ปี {y}</option>)}
            </select>
            <Filter size={14} className="absolute right-3 pointer-events-none text-slate-400" />
          </div>

          <button onClick={() => setIsCompareMode(!isCompareMode)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${isCompareMode ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
            <Split size={14} /> {isCompareMode ? 'เปรียบเทียบ On' : 'เปรียบเทียบ'}
          </button>

          {isCompareMode && (
            <select value={compareYear} onChange={(e) => setCompareYear(parseInt(e.target.value))} className="bg-indigo-50 py-2 px-3 rounded-xl font-bold text-indigo-600 outline-none text-sm border border-indigo-100 cursor-pointer animate-fade-in">
              {availableYears.filter(y => y !== selectedYear).map(y => <option key={y} value={y}>เทียบกับ {y}</option>)}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 p-1">
          <button onClick={getSmartInsight} className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-600 rounded-xl hover:shadow-md transition-all text-sm font-bold border border-indigo-100 group">
            <Sparkles size={16} className="group-hover:scale-110 transition-transform text-indigo-500" />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Gemini Insight</span>
          </button>
          <button onClick={() => onNavigate('entry')} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg shadow-emerald-500/30 transition-all text-sm font-bold hover:-translate-y-0.5 hover:shadow-emerald-500/40 active:scale-95">
            <PlusCircle size={18} /> บันทึกข้อมูล
          </button>
        </div>
      </div>

      {/* AI Insight Banner */}
      {(insight || insightLoading) && (
        <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-fade-in shadow-lg">
          <div className="bg-white/95 backdrop-blur-xl rounded-[15px] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none"></div>
            <div className="flex gap-5 relative z-10">
              <div className="bg-gradient-to-br from-indigo-100 to-white p-3 rounded-2xl text-indigo-600 shrink-0 shadow-sm h-fit border border-indigo-50">
                <Sparkles size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2 text-lg">
                  AI Analysis <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">Gemini 2.5 Flash</span>
                </h4>
                {insightLoading ? (
                  <div className="flex items-center gap-2 text-slate-500 text-sm py-2"><span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span> กำลังวิเคราะห์ข้อมูลรูปแบบ...</div>
                ) : (
                  <p className="text-slate-600 text-sm leading-7 font-medium">{insight}</p>
                )}
              </div>
              <button onClick={() => setInsight('')} className="text-slate-300 hover:text-slate-500 transition-colors h-fit p-1 hover:bg-slate-100 rounded-lg">&times;</button>
            </div>
          </div>
        </div>
      )}

      {chartRecords.length === 0 && !searchTerm ? (
        <div className="glass-panel rounded-3xl p-20 text-center border-dashed border-2 border-slate-300/50 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CalendarX className="text-slate-300" size={48} />
          </div>
          <h3 className="text-2xl font-bold text-slate-700 mb-2">ไม่มีข้อมูลสำหรับปี {selectedYear}</h3>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">เริ่มบันทึกข้อมูลการจัดการขยะเพื่อปลดล็อกข้อมูลเชิงลึกและการวิเคราะห์ที่มีประสิทธิภาพ</p>
          <button onClick={() => onNavigate('entry')} className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 font-bold shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:-translate-y-1">
            <PlusCircle size={20} /> บันทึกข้อมูลแรก
          </button>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard
              title="ปริมาณขยะรวม"
              value={stats.totalTon}
              unit="ตัน"
              icon={<Scale size={24} />}
              color="emerald"
              subValue={isCompareMode && stats.hasComparison ? `${Math.abs(stats.variancePercent).toFixed(1)}%` : undefined}
              trend={stats.variancePercent > 0 ? 'up' : 'down'}
            />
            <StatCard
              title="อัตราการเกิดขยะ"
              value={stats.latestRate}
              unit="กก./คน/วัน"
              icon={<Gauge size={24} />}
              color="blue"
              badge="ประสิทธิภาพ"
            />
            <StatCard
              title="งบประมาณ (ประมาณการ)"
              value={`฿${stats.totalCost}`}
              unit=""
              icon={<Coins size={24} />}
              color="amber"
              customAction={
                <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-1 mt-3 border border-amber-100/50">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">ต้นทุน/ตัน:</span>
                  <input
                    type="number"
                    value={costPerTon}
                    onChange={(e) => setCostPerTon(parseFloat(e.target.value) || 0)}
                    className="w-16 bg-transparent text-right text-xs font-bold text-amber-700 outline-none border-b border-amber-300/50 focus:border-amber-500"
                  />
                </div>
              }
            />
            <StatCard
              title="จำนวนประชากร"
              value={stats.latestPop}
              unit="คน"
              icon={<Users size={24} />}
              color="indigo"
              subValue={isCompareMode && stats.hasComparison ? `${Math.abs(stats.popVariancePercent).toFixed(1)}%` : undefined}
              trend={stats.popVariancePercent > 0 ? 'up' : 'down'}
            />
          </div>

          {/* Charts Layout (Bento Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Trend Chart (Lazy) */}
            <ReactLazy.Suspense fallback={<div className="glass-panel rounded-3xl p-6 lg:col-span-2">Loading chart...</div>}>
              <MonthlyTrendChart chartData={chartData} compositionData={compositionData} isCompareMode={isCompareMode} selectedYear={selectedYear} compareYear={compareYear} />
            </ReactLazy.Suspense>

            {/* Pie Chart - Composition (Lazy) */}
            <ReactLazy.Suspense fallback={<div className="glass-panel rounded-3xl p-6">Loading composition...</div>}>
              <CompositionPieChart compositionData={compositionData} />
            </ReactLazy.Suspense>
          </div>

          {/* Additional Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Bar Chart - Monthly Comparison */}
            <div className="glass-panel rounded-3xl p-6 shadow-glass border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={20} className="text-emerald-500" />
                  กราฟแท่ง - ปริมาณรายเดือน
                </h3>
              </div>
              <ReactLazy.Suspense fallback={<div className="h-[300px] flex items-center justify-center text-slate-400">Loading...</div>}>
                <WasteBarChart data={chartRecords} />
              </ReactLazy.Suspense>
            </div>

            {/* Per Capita Trend */}
            <div className="glass-panel rounded-3xl p-6 shadow-glass border border-white/60">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Activity size={20} className="text-blue-500" />
                  ขยะต่อหัวประชากร
                </h3>
                <span className="text-xs text-slate-500 bg-white/60 px-3 py-1 rounded-full">kg/คน/วัน</span>
              </div>
              <ReactLazy.Suspense fallback={<div className="h-[250px] flex items-center justify-center text-slate-400">Loading...</div>}>
                <PerCapitaChart data={chartRecords} />
              </ReactLazy.Suspense>
            </div>
          </div>

          {/* Comparison Mode Charts */}
          {isCompareMode && comparisonRecords.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Year Comparison Line Chart */}
              <div className="glass-panel rounded-3xl p-6 shadow-glass border border-white/60 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Split size={20} className="text-indigo-500" />
                    เปรียบเทียบ {selectedYear} vs {compareYear}
                  </h3>
                  <span className="text-xs text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full font-bold">รายเดือน</span>
                </div>
                <ReactLazy.Suspense fallback={<div className="h-[300px] flex items-center justify-center text-slate-400">Loading...</div>}>
                  <ComparisonLineChart 
                    currentData={chartRecords}
                    compareData={comparisonRecords}
                    currentYear={selectedYear}
                    compareYear={compareYear}
                  />
                </ReactLazy.Suspense>
              </div>
            </div>
          )}

          {/* Composition Radar Chart */}
          {compositionData.general + compositionData.organic + compositionData.recycle + compositionData.hazardous > 0 && (
            <div className="glass-panel rounded-3xl p-6 shadow-glass border border-white/60 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Radar size={20} className="text-purple-500" />
                  สัดส่วนประเภทขยะ (Radar)
                </h3>
                <span className="text-xs text-slate-500 bg-white/60 px-3 py-1 rounded-full">ปี {selectedYear}</span>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <ReactLazy.Suspense fallback={<div className="h-[300px] flex items-center justify-center text-slate-400">Loading...</div>}>
                    <CompositionRadarChart 
                      general={compositionData.general}
                      organic={compositionData.organic}
                      recycle={compositionData.recycle}
                      hazardous={compositionData.hazardous}
                    />
                  </ReactLazy.Suspense>
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="glass-panel rounded-3xl overflow-hidden mt-8 shadow-glass border border-white/60">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white/40 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TableIcon size={20} className="text-slate-400" /> บันทึกข้อมูลละเอียด
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase tracking-widest font-bold border-b border-slate-100/50">
                    <th className="p-5 pl-8">เดือน/ปี</th>
                    <th className="p-5 text-right">ปริมาณ (ตัน)</th>
                    <th className="p-5 text-right">เปลี่ยน (MoM)</th>
                    <th className="p-5 text-right">ประชากร</th>
                    <th className="p-5 text-right">อัตรา (กก./คน)</th>
                    <th className="p-5">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-sm">
                  {tableRecords.map((r, index) => {
                    const rate = r.population > 0 ? (r.amountKg / r.population / 30) : 0;
                    const prevRecord = tableRecords[index + 1];
                    let momChange = 0;
                    let hasPrev = false;
                    if (prevRecord && prevRecord.amountKg > 0) {
                      momChange = ((r.amountKg - prevRecord.amountKg) / prevRecord.amountKg) * 100;
                      hasPrev = true;
                    }

                    // Advanced Outlier Detection
                    const isOutlier = Math.abs(momChange) > 20 && hasPrev;

                    return (
                      <tr key={r.id} className={`hover:bg-white/60 transition-colors group border-b border-slate-50/50 last:border-none ${isOutlier ? 'bg-amber-50/30' : ''}`}>
                        <td className="p-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shadow-sm border border-emerald-100 group-hover:scale-110 transition-transform">
                              {THAI_MONTHS[r.month - 1].substring(0, 2)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{THAI_MONTHS[r.month - 1]}</div>
                              <div className="text-xs text-slate-400">{r.year}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-right relative">
                          <span className="font-bold text-slate-800 text-base">{(r.amountKg / 1000).toFixed(2)}</span>
                          {isOutlier && <div className="absolute top-3 right-2 text-amber-500 animate-pulse"><AlertTriangle size={10} /></div>}
                        </td>
                        <td className="p-5 text-right">
                          {hasPrev ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${momChange > 0 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                              {momChange > 0 ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                              {Math.abs(momChange).toFixed(1)}%
                            </span>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td className="p-5 text-right font-medium text-slate-600">{r.population.toLocaleString()}</td>
                        <td className="p-5 text-right">
                          <div className="flex justify-end">
                            <div className={`px-2 py-1 rounded-md text-xs font-bold w-fit ${rate > 1.2 ? 'bg-red-50 text-red-500' : 'bg-slate-50 text-slate-600'}`}>
                              {rate.toFixed(3)}
                            </div>
                          </div>
                        </td>
                        <td className="p-5 text-slate-500 text-xs max-w-xs truncate opacity-70">{r.note || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Modern Glassmorphism Stat Card
const StatCard = ({ title, value, unit, icon, color, subValue, trend, customAction, badge }: any) => {
  const colorStyles: any = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'ring-emerald-100', gradient: 'from-emerald-500 to-teal-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'ring-blue-100', gradient: 'from-blue-500 to-cyan-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'ring-amber-100', gradient: 'from-amber-500 to-orange-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', ring: 'ring-indigo-100', gradient: 'from-indigo-500 to-violet-500' },
  };

  const style = colorStyles[color] || colorStyles.emerald;

  return (
    <div className="glass-panel p-6 rounded-3xl shadow-glass hover:shadow-glass-hover transition-all duration-500 relative overflow-hidden group border border-white/60">
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 bg-gradient-to-br ${style.gradient} rounded-full opacity-[0.08] group-hover:opacity-[0.15] blur-2xl transition-opacity duration-500`}></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl ${style.bg} ${style.text} ring-1 ${style.ring} shadow-sm`}>
          {icon}
        </div>
        {badge && <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white/50 px-2 py-1 rounded-lg border border-white/60 backdrop-blur-sm">{badge}</span>}
      </div>

      <div className="relative z-10">
        <p className="text-sm text-slate-500 font-semibold mb-1">{title}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-bold text-slate-800 tracking-tight tabular-nums">{value}</h3>
          <span className="text-sm text-slate-400 font-bold">{unit}</span>
        </div>
      </div>

      {subValue && (
        <div className={`text-xs font-bold mt-3 flex items-center gap-1 w-fit px-2 py-1 rounded-lg ${trend === 'up' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
          {trend === 'up' ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
          {subValue}
        </div>
      )}
      {customAction}
    </div>
  );
};

export default Dashboard;
