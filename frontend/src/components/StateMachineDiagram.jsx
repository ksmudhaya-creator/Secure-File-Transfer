import React from 'react';
import {
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  Clock,
  ArrowRight,
  Database,
  CloudUpload,
  Fingerprint,
} from 'lucide-react';
import { ORDERED_HAPPY_PATH, FSM_STATE_CONFIG } from '../utils/fsmConstants';

const StateMachineDiagram = ({ currentState = 'INITIATED' }) => {
  const isTerminalFailure = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(currentState);
  const happyPathIndex = ORDERED_HAPPY_PATH.indexOf(currentState);

  const stateIcons = {
    INITIATED: KeyRound,
    AUTHENTICATING: Fingerprint,
    READY: Database,
    UPLOADING: CloudUpload,
    VERIFYING: ShieldCheck,
    COMPLETED: CheckCircle2,
    FAILED: AlertOctagon,
    CANCELLED: XCircle,
    EXPIRED: Clock,
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-xl p-6 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-800/80 gap-3">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 rotate-45" />
            Finite State Machine (FSM) Lifecycle Pipeline
          </h3>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            Strict State Transition Map & Handshake Flow
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-300">ACTIVE STATE:</span>
          <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold shadow-cyber-glow">
            {currentState}
          </span>
        </div>
      </div>

      {/* Primary Pipeline (Happy Path) */}
      <div className="overflow-x-auto pb-4">
        <div className="flex items-center justify-between min-w-[720px] gap-2 px-2">
          {ORDERED_HAPPY_PATH.map((state, idx) => {
            const Icon = stateIcons[state] || ShieldCheck;
            const isCurrent = currentState === state;
            const isPassed = !isTerminalFailure && happyPathIndex > idx;
            const isUpcoming = isTerminalFailure || happyPathIndex < idx;

            let nodeStyles = 'border-slate-800 bg-slate-950/60 text-slate-500';
            let lineStyles = 'bg-slate-800';

            if (isPassed) {
              nodeStyles = 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400';
              lineStyles = 'bg-emerald-500/60';
            } else if (isCurrent) {
              nodeStyles =
                state === 'COMPLETED'
                  ? 'border-emerald-400 bg-emerald-950/60 text-emerald-300 shadow-cyber-glow-success scale-105'
                  : 'border-cyan-400 bg-cyan-950/60 text-cyan-300 shadow-cyber-glow scale-105 animate-pulse';
            }

            return (
              <React.Fragment key={state}>
                {/* State Node */}
                <div className="flex flex-col items-center flex-1 min-w-[100px] text-center group">
                  <div
                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all duration-300 mb-2 relative ${nodeStyles}`}
                  >
                    <Icon className="w-5 h-5" />
                    {isCurrent && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-mono font-semibold tracking-wide uppercase ${
                      isCurrent
                        ? 'text-cyan-300 font-bold'
                        : isPassed
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {state}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono mt-0.5">
                    Step 0{idx + 1}
                  </span>
                </div>

                {/* Connector Arrow Line */}
                {idx < ORDERED_HAPPY_PATH.length - 1 && (
                  <div className="flex-1 flex items-center justify-center -mt-6">
                    <div className={`h-[2px] w-full transition-all duration-500 ${lineStyles}`} />
                    <ArrowRight className={`w-3.5 h-3.5 -ml-1 transition-all ${isPassed ? 'text-emerald-400' : 'text-slate-700'}`} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Terminal Deviation States Section */}
      <div className="mt-6 pt-5 border-t border-slate-800/80">
        <div className="text-[11px] font-mono uppercase text-slate-300 tracking-wider mb-3">
          Deviation & Exceptional Terminal States:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              state: 'FAILED',
              icon: AlertOctagon,
              color: 'rose',
              text: 'Operation aborted due to verification, cipher, or authorization error.',
            },
            {
              state: 'CANCELLED',
              icon: XCircle,
              color: 'amber',
              text: 'Session terminated prematurely upon authorized client request.',
            },
            {
              state: 'EXPIRED',
              icon: Clock,
              color: 'slate',
              text: 'Session exceeded timeout window without state progression.',
            },
          ].map((item) => {
            const Icon = item.icon;
            const isCurrent = currentState === item.state;
            const colorClasses = {
              rose: isCurrent
                ? 'border-rose-500 bg-rose-950/40 text-rose-300 shadow-cyber-glow-danger'
                : 'border-slate-800/70 bg-slate-950/40 text-slate-400',
              amber: isCurrent
                ? 'border-amber-500 bg-amber-950/40 text-amber-300'
                : 'border-slate-800/70 bg-slate-950/40 text-slate-400',
              slate: isCurrent
                ? 'border-slate-500 bg-slate-800/40 text-slate-300'
                : 'border-slate-800/70 bg-slate-950/40 text-slate-400',
            };

            return (
              <div
                key={item.state}
                className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${colorClasses[item.color]}`}
              >
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold">{item.state}</span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-mono">
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    {item.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StateMachineDiagram;
