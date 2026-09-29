'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { bulan: 'Jan', positif: 35, netral: 18, negatif: 19 },
  { bulan: 'Feb', positif: 45, netral: 15, negatif: 19 },
  { bulan: 'Mar', positif: 48, netral: 14, negatif: 18 },
  { bulan: 'Apr', positif: 47, netral: 20, negatif: 17 },
];

export default function SentimentChart() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-800 text-lg">Tren Sentimen (6 Bulan Terakhir)</h3>
          <p className="text-xs text-gray-500 mt-1">
            Perkembangan volume ulasan berdasarkan kategori sentimen
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

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="bulan" stroke="#999" fontSize={12} />
          <YAxis stroke="#999" fontSize={12} tickFormatter={(value) => `${value}%`} />
          <Tooltip />
          <Line type="monotone" dataKey="positif" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="netral" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="negatif" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}