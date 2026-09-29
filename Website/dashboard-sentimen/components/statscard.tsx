import { TrendingUp, AlertTriangle } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  subtitle?: string;
  change?: string;
  color: 'gray' | 'positive' | 'neutral' | 'negative';
}

const borderColors = {
  gray: 'border-l-gray-500',
  positive: 'border-l-green-500',
  neutral: 'border-l-yellow-500',
  negative: 'border-l-red-500',
};

const textColors = {
  gray: 'text-gray-700',
  positive: 'text-green-600',
  neutral: 'text-yellow-600',
  negative: 'text-red-600',
};

export default function StatsCard({ title, value, subtitle, change, color }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-xl p-5 border-l-4 shadow-sm ${borderColors[color]}`}>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      
      <div className={`text-4xl font-bold mb-2 ${textColors[color]}`}>
        {value}
      </div>

      {change && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <TrendingUp size={12} />
          <span>{change}</span>
        </div>
      )}

      {subtitle && (
        <p className="text-xs text-gray-600 flex items-center gap-1">
          {color === 'negative' && <AlertTriangle size={12} />}
          {subtitle}
        </p>
      )}
    </div>
  );
}