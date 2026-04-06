import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';

const CircularProgress = ({ percentage, size = 200 }) => {
  const getRiskColor = (percent) => {
    if (percent < 30) return '#16A34A';
    if (percent < 50) return '#F59E0B';
    if (percent < 70) return '#FB923C';
    return '#DC2626';
  };

  const color = getRiskColor(percentage);
  const data = [
    { value: percentage },
    { value: 100 - percentage }
  ];

  return (
    <div className="relative" style={{ width: size, height: size }} data-testid="circular-progress">
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2}
          cy={size / 2}
          startAngle={90}
          endAngle={-270}
          innerRadius={size * 0.35}
          outerRadius={size * 0.45}
          paddingAngle={0}
          dataKey="value"
        >
          <Cell fill={color} />
          <Cell fill="#E2E8F0" />
        </Pie>
      </PieChart>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold" style={{ color }} data-testid="percentage-value">
          {percentage}%
        </span>
        <span className="text-sm text-[#64748B] mt-1">Risk Score</span>
      </div>
    </div>
  );
};

export default CircularProgress;