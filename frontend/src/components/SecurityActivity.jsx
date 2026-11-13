import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle, XCircle, Clock } from 'lucide-react';

const SecurityActivity = ({ logs = [] }) => {
  if (!logs || logs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No recent security incidents logged. All systems within normal operating parameters.
      </div>
    );
  }

  const statusBadges = {
    SUCCESS: {
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      icon: ShieldCheck,
    },
    WARNING: {
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      icon: AlertTriangle,
    },
    ALERT: {
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse',
      icon: ShieldAlert,
    },
    FAILURE: {
      color: 'text-red-400 bg-red-500/10 border-red-500/30',
      icon: XCircle,
    },
  };

  return (
    <div className="space-y-3">
      {logs.map((log, index) => {
        const badgeConfig = statusBadges[log.status] || statusBadges.SUCCESS;
        const Icon = badgeConfig.icon;

        return (
          <div
            key={log._id || index}
            className="flex items-start justify-between gap-4 p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 transition-all hover:border-cyan-500/20"
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-lg border shrink-0 mt-0.5 ${badgeConfig.color}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {log.activity}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeConfig.color}`}
                  >
                    {log.status}
                  </span>
                </div>
                {log.userId?.username && (
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    User: <span className="text-cyan-300">{log.userId.username}</span>
                  </p>
                )}
                {log.details && (
                  <p className="text-xs text-slate-400 mt-1 font-mono break-all line-clamp-2">
                    {typeof log.details === 'object'
                      ? JSON.stringify(log.details)
                      : log.details}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-[10px] font-mono text-cyan-400">
                IP: {log.ipAddress || '127.0.0.1'}
              </div>
              <div className="text-[10px] font-mono text-slate-500 flex items-center justify-end gap-1 mt-1">
                <Clock className="w-3 h-3" />
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SecurityActivity;
