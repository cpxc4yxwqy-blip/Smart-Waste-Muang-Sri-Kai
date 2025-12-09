import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { THAI_MONTHS_ABBR } from '../types';

interface WasteBarChartProps {
  data: any[];
}

const WasteBarChart: React.FC<WasteBarChartProps> = ({ data }) => {
  const COLORS = ['#10b981', '#059669', '#047857', '#065f46'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
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
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}T`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px'
          }}
          formatter={(value: any) => [`${(value / 1000).toFixed(2)} ตัน`, 'ขยะทั้งหมด']}
          labelFormatter={(m) => `เดือน ${THAI_MONTHS_ABBR[m - 1]}`}
        />
        <Bar dataKey="amountKg" radius={[8, 8, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default WasteBarChart;
