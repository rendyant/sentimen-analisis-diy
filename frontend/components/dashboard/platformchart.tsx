'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { platform: 'X (Twitter)', positif: 45, netral: 30, negatif: 25 },
  { platform: 'Instagram', positif: 55, netral: 25, negatif: 20 },
  { platform: 'Aplikasi', positif: 50, netral: 30, negatif: 20 },
  { platform: 'Facebook', positif: 60, netral: 25, negatif: 15 },
];

export default function PlatformChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-800 text-lg mb-6">Sentimen per Platform</h3>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" stroke="#999" fontSize={12} tickFormatter={(value) => `${value}%`} />
          <YAxis type="category" dataKey="platform" stroke="#999" fontSize={12} width={100} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Bar dataKey="positif" stackId="a" fill="#1e3a8a" radius={[0, 0, 0, 0]} />
          <Bar dataKey="netral" stackId="a" fill="#f59e0b" />
          <Bar dataKey="negatif" stackId="a" fill="#dc2626" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}