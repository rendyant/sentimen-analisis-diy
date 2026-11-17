'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export interface PlatformStatItem {
  platform: string;
  positif: number;
  netral: number;
  negatif: number;
  total: number;
}

export default function PlatformChart({ data = [] }: { data?: PlatformStatItem[] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="mb-4">
        <h3 className="font-bold text-gray-800 text-lg">Sentimen per Kanal Sumber Data (Database Live)</h3>
        <p className="text-xs text-gray-500">Distribusi persentase sentimen berdasarkan sumber kanal di database</p>
      </div>

      {data.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">
          Belum ada data platform pada filter ini.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" domain={[0, 100]} stroke="#999" fontSize={12} tickFormatter={(value) => `${value}%`} />
            <YAxis type="category" dataKey="platform" stroke="#999" fontSize={12} width={110} />
            <Tooltip
              formatter={(value: any, name: any) => [`${value}%`, String(name).toUpperCase()]}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="positif" name="Positif" stackId="a" fill="#10B981" />
            <Bar dataKey="netral" name="Netral" stackId="a" fill="#f59e0b" />
            <Bar dataKey="negatif" name="Negatif" stackId="a" fill="#dc2626" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
