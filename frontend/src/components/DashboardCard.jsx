import React from 'react';

const DashboardCard = ({
  title,
  value,
  icon: Icon,
  description,
  color = 'cyan',
  trend,
}) => {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-blue-500/5 text-cyan-400 border-cyan-500/30',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30',
    rose: 'from-rose-500/20 to-red-500/5 text-rose-400 border-rose-500/30',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-400 border-amber-500/30',
    purple: 'from-purple-500/20 to-indigo-500/5 text-purple-400 border-purple-500/30',
    blue: 'from-blue-500/20 to-sky-500/5 text-blue-400 border-blue-500/30',
  };

  const selectedColor = colorMap[color] || colorMap.cyan;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-5 shadow-lg transition-all hover:border-cyan-500/40 hover:shadow-cyber-glow group">
      {/* Top row */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-wider text-slate-300">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl border bg-gradient-to-br flex items-center justify-center transition-transform group-hover:scale-110 ${selectedColor}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Main stat value */}
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {value !== undefined ? value : '—'}
        </span>
        {trend && (
          <span className="text-[11px] font-mono font-medium text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {/* Description caption */}
      {description && (
        <p className="mt-2 text-xs text-slate-300 leading-relaxed font-sans">
          {description}
        </p>
      )}

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};

export default DashboardCard;
