'use client';

import { Star, TrendingUp } from 'lucide-react';

interface RatingCardProps {
  avgRating?: number;
  totalUlasan?: number;
  csatPercent?: number;
}

export default function RatingCard({
  avgRating = 0,
  totalUlasan = 0,
  csatPercent = 0,
}: RatingCardProps) {
  const roundedStars = Math.round(avgRating);

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          RATA-RATA RATING PELAYANAN (DATABASE LIVE)
        </h3>
        <Star size={20} className="text-yellow-400 fill-yellow-400" />
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-5xl font-bold text-gray-800">
          {avgRating > 0 ? avgRating.toFixed(2) : '0.00'}
        </span>
        <span className="text-gray-400">/ 5.0</span>
      </div>

      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((num) => (
          <Star
            key={num}
            size={18}
            className={num <= roundedStars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
          />
        ))}
        <span
          className={`ml-2 text-xs px-2 py-0.5 rounded font-semibold ${
            csatPercent >= 60
              ? 'bg-green-100 text-green-700'
              : csatPercent >= 40
              ? 'bg-orange-100 text-orange-600'
              : 'bg-red-100 text-red-600'
          }`}
        >
          CSAT: {csatPercent}%
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Total <b>{totalUlasan.toLocaleString('id-ID')}</b> ulasan terverifikasi di database
        </p>
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <TrendingUp size={12} />
          <span>Real-time DB</span>
        </div>
      </div>
    </div>
  );
}
