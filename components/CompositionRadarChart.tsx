import React from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface CompositionRadarChartProps {
  general: number;
  organic: number;
  recycle: number;
  hazardous: number;
}

const CompositionRadarChart: React.FC<CompositionRadarChartProps> = ({ 
  general, 
  organic, 
  recycle, 
  hazardous 
}) => {
  const total = general + organic + recycle + hazardous;
  
  const data = [
    { category: 'ทั่วไป', value: total > 0 ? (general / total * 100) : 0, fullMark: 100 },
    { category: 'อินทรีย์', value: total > 0 ? (organic / total * 100) : 0, fullMark: 100 },
    { category: 'รีไซเคิล', value: total > 0 ? (recycle / total * 100) : 0, fullMark: 100 },
    { category: 'อันตราย', value: total > 0 ? (hazardous / total * 100) : 0, fullMark: 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis 
          dataKey="category" 
          style={{ fontSize: '12px', fill: '#64748b' }}
        />
        <PolarRadiusAxis 
          angle={90} 
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          style={{ fontSize: '10px', fill: '#94a3b8' }}
        />
        <Radar 
          name="สัดส่วนขยะ" 
          dataKey="value" 
          stroke="#10b981" 
          fill="#10b981" 
          fillOpacity={0.5}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px'
          }}
          formatter={(value: any) => `${value.toFixed(1)}%`}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default CompositionRadarChart;
