import React from 'react';

const TransferProgress = ({ progress = 0, state = 'UPLOADING', showLabel = true }) => {
  const percentage = Math.min(100, Math.max(0, Math.round(progress)));

  const getBarColor = () => {
    switch (state) {
      case 'COMPLETED':
        return 'from-emerald-500 to-teal-400';
      case 'FAILED':
        return 'from-rose-500 to-red-400';
      case 'CANCELLED':
        return 'from-amber-500 to-yellow-400';
      case 'EXPIRED':
        return 'from-slate-600 to-slate-500';
      default:
        return 'from-cyan-500 via-blue-500 to-indigo-500';
    }
  };

  return (
    <div className="w-full space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300">TRANSFER INTEGRITY PIPELINE</span>
          <span className="text-cyan-400 font-bold">{percentage}%</span>
        </div>
      )}
      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${getBarColor()} transition-all duration-500 ease-out shadow-sm`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default TransferProgress;
