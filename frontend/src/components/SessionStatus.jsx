import React from 'react';
import { FSM_STATE_CONFIG } from '../utils/fsmConstants';

const SessionStatus = ({ state, showPulse = true, size = 'sm' }) => {
  const config = FSM_STATE_CONFIG[state] || {
    label: state || 'UNKNOWN',
    badge: 'bg-slate-500/10 text-slate-400 border border-slate-600/30',
    color: 'text-slate-400',
  };

  const isActive = [
    'INITIATED',
    'AUTHENTICATING',
    'READY',
    'UPLOADING',
    'VERIFYING',
  ].includes(state);

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium tracking-wide ${
        sizeClasses[size] || sizeClasses.sm
      } ${config.badge}`}
    >
      {showPulse && isActive && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
        </span>
      )}
      {!isActive && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default SessionStatus;
