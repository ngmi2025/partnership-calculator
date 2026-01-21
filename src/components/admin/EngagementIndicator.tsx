import { Flame, Thermometer, Snowflake } from 'lucide-react';
import { getEngagementLevel } from '@/types/database';

interface EngagementIndicatorProps {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

export function EngagementIndicator({
  score,
  showScore = true,
  size = 'md',
}: EngagementIndicatorProps) {
  const level = getEngagementLevel(score);

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const config = {
    hot: {
      icon: Flame,
      color: 'text-red-500',
      bg: 'bg-red-50',
      label: 'Hot',
    },
    warm: {
      icon: Thermometer,
      color: 'text-orange-500',
      bg: 'bg-orange-50',
      label: 'Warm',
    },
    cold: {
      icon: Snowflake,
      color: 'text-blue-400',
      bg: 'bg-blue-50',
      label: 'Cold',
    },
  };

  const { icon: Icon, color, bg, label } = config[level];

  return (
    <div className={`inline-flex items-center gap-1.5 ${bg} px-2 py-1 rounded-full`}>
      <Icon className={`${iconSize} ${color}`} />
      {showScore && (
        <span className={`${textSize} font-medium ${color}`}>{score}</span>
      )}
    </div>
  );
}
