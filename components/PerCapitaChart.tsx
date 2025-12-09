import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { THAI_MONTHS_ABBR } from '../types';

interface PerCapitaChartProps {
  data: any[];
}

const PerCapitaChart: React.FC<PerCapitaChartProps> = ({ data }) => {
  const chartData = data.map(r => ({
    month: r.month,
    perCapita: r.population > 0 ? (r.amountKg / r.population / 30) : 0
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorPerCapita" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
        </defs>
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
          tickFormatter={(value) => value.toFixed(1)}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px'
          }}
          formatter={(value: any) => [`${value.toFixed(2)} kg/คน/วัน`, 'ขยะต่อหัว']}
          labelFormatter={(m) => `เดือน ${THAI_MONTHS_ABBR[m - 1]}`}
        />
        <Area 
          type="monotone" 
          dataKey="perCapita" 
          stroke="#3b82f6" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorPerCapita)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PerCapitaChart;
