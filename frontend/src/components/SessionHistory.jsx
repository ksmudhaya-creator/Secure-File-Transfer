import React from 'react';
import { ArrowRight, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import SessionStatus from './SessionStatus';

const SessionHistory = ({ history = [] }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono text-xs">
        No state transition history recorded for this session.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
      {history.map((record, index) => {
        const isLatest = index === history.length - 1;
        const isFailed = record.toState === 'FAILED';

        return (
          <div key={index} className="relative group">
            {/* Timeline Dot */}
            <div
              className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125 ${
                isFailed
                  ? 'border-rose-500 bg-rose-950'
                  : isLatest
                  ? 'border-cyan-400 bg-cyan-950 animate-pulse'
                  : 'border-emerald-500 bg-slate-900'
              }`}
            />

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 transition-all hover:border-cyan-500/30">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <SessionStatus state={record.fromState} size="xs" showPulse={false} />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  <SessionStatus state={record.toState} size="xs" showPulse={isLatest} />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(record.timestamp).toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                {record.reason || 'Transition recorded in FSM ledger.'}
              </p>

              {record.progress !== undefined && (
                <div className="mt-2 text-[10px] font-mono text-cyan-400/80 flex items-center justify-between">
                  <span>PROGRESS AT TRANSITION:</span>
                  <span className="font-bold">{record.progress}%</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SessionHistory;
