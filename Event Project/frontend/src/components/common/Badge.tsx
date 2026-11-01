import React from 'react';

interface BadgeProps {
  status: 'COMPLETED' | 'PENDING' | 'REFUNDED' | 'FAILED' | string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const s = status.toUpperCase();
  let colorStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let label = status;

  if (s === 'COMPLETED' || s === 'CAPTURED' || s === 'SUCCESS') {
    colorStyles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
    label = 'Captured';
  } else if (s === 'PENDING') {
    colorStyles = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    label = 'Pending';
  } else if (s === 'REFUNDED') {
    colorStyles = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
    label = 'Refunded';
  } else if (s === 'FAILED') {
    colorStyles = 'bg-red-50 text-red-700 border-red-200';
    dotColor = 'bg-red-500';
    label = 'Failed';
  }

  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${colorStyles} ${sizeClasses}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
};
