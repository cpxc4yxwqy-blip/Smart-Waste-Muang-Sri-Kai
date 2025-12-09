import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { THAI_MONTHS_ABBR } from '../types';

interface ComparisonLineChartProps {
  currentData: any[];
  compareData: any[];
  currentYear: number;
  compareYear: number;
}

const ComparisonLineChart: React.FC<ComparisonLineChartProps> = ({ 
  currentData, 
  compareData,
  currentYear,
  compareYear 
}) => {
  // Merge data by month
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const chartData = months.map(month => {
    const current = currentData.find(r => r.month === month);
    const compare = compareData.find(r => r.month === month);
    
    return {
      month,
      current: current ? current.amountKg / 1000 : null,
      compare: compare ? compare.amountKg / 1000 : null
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis 
          dataKey="month"
          tickFormatter={(m) => THAI_MONTHS_ABBR[m - 1] || m}
          stroke="#64748b"
          style={{ fontSize: '12px' }}
        />
        <YAxis 
          stroke="#64748b"
          style={{ fontSize: '12px' }}
          label={{ value: 'ตัน', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px'
          }}
          formatter={(value: any) => value ? `${value.toFixed(2)} ตัน` : 'ไม่มีข้อมูล'}
          labelFormatter={(m) => `เดือน ${THAI_MONTHS_ABBR[m - 1]}`}
        />
        <Legend 
          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
        />
        <Line 
          type="monotone" 
          dataKey="current" 
          stroke="#10b981" 
          strokeWidth={3}
          name={`ปี ${currentYear}`}
          dot={{ r: 4, fill: '#10b981' }}
          activeDot={{ r: 6 }}
          connectNulls
        />
        <Line 
          type="monotone" 
          dataKey="compare" 
          stroke="#94a3b8" 
          strokeWidth={2}
          strokeDasharray="5 5"
          name={`ปี ${compareYear}`}
          dot={{ r: 3, fill: '#94a3b8' }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ComparisonLineChart;
