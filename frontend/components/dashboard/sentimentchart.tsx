'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export interface SentimentTrendItem {
  bulan: string;
  positif: number;
  netral: number;
  negatif: number;
  positif_count?: number;
  netral_count?: number;
  negatif_count?: number;
}

export default function SentimentChart({ data = [] }: { data?: SentimentTrendItem[] }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Tren Sentimen Bulanan (Database Live)</h3>
          <p className="text-xs text-gray-500 mt-1">
            Perkembangan persentase sentimen ulasan berdasarkan waktu di database
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Positif
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Netral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Negatif
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-xs text-gray-400">
          Tidak ada data tren sentimen pada filter ini.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="bulan" stroke="#999" fontSize={12} />
            <YAxis stroke="#999" fontSize={12} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              formatter={(value: any, name: any) => [`${value}%`, String(name).toUpperCase()]}
            />
            <Line type="monotone" dataKey="positif" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="netral" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="negatif" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
