import { EarningsTier, Priority } from '@/types/database';

interface TierBadgeProps {
  tier: EarningsTier | null;
  size?: 'sm' | 'md';
}

const tierColors: Record<EarningsTier, string> = {
  starter: 'bg-slate-100 text-slate-600',
  growth: 'bg-blue-100 text-blue-700',
  scale: 'bg-green-100 text-green-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const tierLabels: Record<EarningsTier, string> = {
  starter: 'Starter',
  growth: 'Growth',
  scale: 'Scale',
  enterprise: 'Enterprise',
};

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  if (!tier) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${tierColors[tier]} ${sizeClasses}`}
    >
      {tierLabels[tier]}
    </span>
  );
}

interface PriorityBadgeProps {
  priority: Priority | null;
  size?: 'sm' | 'md';
}

const priorityColors: Record<Priority, string> = {
  hot: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  standard: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
};

export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  if (!priority) return null;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize ${priorityColors[priority]} ${sizeClasses}`}
    >
      {priority}
    </span>
  );
}
