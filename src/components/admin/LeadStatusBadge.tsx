import { LeadStatus } from '@/types/database';

interface LeadStatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

const statusColors: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  nurturing: 'bg-purple-100 text-purple-700',
  engaged: 'bg-cyan-100 text-cyan-700',
  qualified: 'bg-emerald-100 text-emerald-700',
  in_conversation: 'bg-amber-100 text-amber-700',
  signed: 'bg-green-100 text-green-700',
  lost: 'bg-slate-100 text-slate-500',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  nurturing: 'Nurturing',
  engaged: 'Engaged',
  qualified: 'Qualified',
  in_conversation: 'In Conversation',
  signed: 'Signed',
  lost: 'Lost',
};

export function LeadStatusBadge({ status, size = 'md' }: LeadStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${statusColors[status]} ${sizeClasses}`}
    >
      {statusLabels[status]}
    </span>
  );
}
