import { Star, TrendingUp } from 'lucide-react';

export default function RatingCard() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          RATA-RATA RATING
        </h3>
        <Star size={20} className="text-yellow-400" />
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-5xl font-bold text-gray-800">3.33</span>
        <span className="text-gray-400">/ 5.0</span>
      </div>

      <div className="flex items-center gap-1 mb-4">
        <Star size={18} className="text-yellow-400" />
        <Star size={18} className="text-yellow-400" />
        <Star size={18} className="text-yellow-400" />
        <Star size={18} className="text-gray-300" />
        <Star size={18} className="text-gray-300" />
        <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded font-medium">
          CSAT: 50%
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t">
        <p className="text-xs text-gray-500">Total 12 ulasan</p>
        <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
          <TrendingUp size={12} />
          <span>+8.4% bln ini</span>
        </div>
      </div>
    </div>
  );
}