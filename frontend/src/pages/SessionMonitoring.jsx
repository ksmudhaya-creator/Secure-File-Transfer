import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  Search,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import StateMachineDiagram from '../components/StateMachineDiagram';
import SessionStatus from '../components/SessionStatus';
import SessionHistory from '../components/SessionHistory';
import TransferProgress from '../components/TransferProgress';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getSessions,
  getSessionById,
  updateSessionState,
  cancelSession,
} from '../services/sessionService';
import { useToast } from '../context/ToastContext';

const SessionMonitoring = () => {
  const [searchParams] = useSearchParams();
  const initialSessionId = searchParams.get('session');
  const { addToast } = useToast();

  const [sessionsList, setSessionsList] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(initialSessionId || '');
  const [currentSession, setCurrentSession] = useState(null);
  const [availableTransitions, setAvailableTransitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulatingTarget, setSimulatingTarget] = useState('');
  const [transitionReason, setTransitionReason] = useState('');

  // Fetch session list
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await getSessions();
        const list = res.sessions || [];
        setSessionsList(list);

        if (list.length > 0) {
          const toSelect = initialSessionId
            ? list.find((s) => s.sessionId === initialSessionId)?.sessionId || list[0].sessionId
            : list[0].sessionId;
          setSelectedSessionId(toSelect);
        }
      } catch (err) {
        console.error('Failed to load session list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [initialSessionId]);

  // Fetch specific selected session details
  useEffect(() => {
    if (!selectedSessionId) return;

    const fetchDetail = async () => {
      try {
        const res = await getSessionById(selectedSessionId);
        setCurrentSession(res.session);
        setAvailableTransitions(res.availableTransitions || []);
        if (res.availableTransitions?.length > 0) {
          setSimulatingTarget(res.availableTransitions[0]);
        } else {
          setSimulatingTarget('');
        }
      } catch (err) {
        console.error('Failed to fetch session detail:', err);
      }
    };

    fetchDetail();
  }, [selectedSessionId]);

  const handleExecuteTransition = async (target) => {
    if (!target) return;

    try {
      addToast(`Sending transition instruction: ${currentSession.currentState} ➔ ${target}...`, 'info');
      const res = await updateSessionState(
        currentSession.sessionId,
        target,
        transitionReason || `Evaluator transition to ${target}`
      );
      setCurrentSession(res.session);
      setAvailableTransitions(res.availableTransitions || []);
      setTransitionReason('');
      addToast(`FSM accepted transition to ${target}. MongoDB state updated.`, 'success');
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      addToast(`FSM Engine Rejected Transition: ${msg}`, 'error', 7000);
    }
  };

  const handleCancel = async () => {
    if (!currentSession) return;
    try {
      const res = await cancelSession(currentSession.sessionId, 'Cancelled via FSM Monitor.');
      setCurrentSession(res.session);
      addToast('Session transitioned to CANCELLED.', 'warning');
    } catch (err) {
      addToast(`Cancellation rejected: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Accessing FSM state engine telemetry..." />;
  }

  const allPossibleStates = [
    'INITIATED',
    'AUTHENTICATING',
    'READY',
    'UPLOADING',
    'VERIFYING',
    'COMPLETED',
    'FAILED',
    'CANCELLED',
    'EXPIRED',
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            FSM Session State Monitor & Inspector
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Real-Time State Machine Observation, Transition Audit Trail & Integrity Engine
          </p>
        </div>

        {/* Session Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 uppercase hidden sm:block">
            Inspect Session:
          </label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="bg-slate-900 border border-cyan-500/30 rounded-xl py-2 px-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400 shadow-cyber-glow"
          >
            {sessionsList.map((s) => (
              <option key={s.sessionId} value={s.sessionId} className="bg-slate-950 text-slate-200">
                {s.sessionId} — {s.fileName} ({s.currentState})
              </option>
            ))}
          </select>
        </div>
      </div>

      {currentSession ? (
        <>
          {/* Dynamic FSM Diagram */}
          <StateMachineDiagram currentState={currentSession.currentState} />

          {/* Core Session Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Session ID</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300 mt-1 truncate">
                {currentSession.sessionId}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Type: {currentSession.transferType}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Operative & Asset</span>
                <User className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-sm font-bold font-mono text-white mt-1 truncate">
                {currentSession.userId?.username || 'Authenticated Operative'}
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate mt-1">
                File: {currentSession.fileName}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Current State</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              </div>
              <div className="mt-2">
                <SessionStatus state={currentSession.currentState} size="sm" />
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Progress: {currentSession.transferProgress}%
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 uppercase">
                <span>Expiration Threshold</span>
                <Clock className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xs font-bold font-mono text-purple-300 mt-1 truncate">
                {new Date(currentSession.expiresAt).toLocaleTimeString()}
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">
                Auto-Expires if Inactive
              </div>
            </div>
          </div>

          {/* Interactive State Machine Transition Simulator & Tester */}
          <div className="rounded-2xl border border-cyan-500/25 bg-slate-900/80 backdrop-blur-xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  Interactive FSM Transition Engine & Validator
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Test valid state progressions or attempt illegal transitions to verify server-side rejection
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">PERMISSIBLE TARGETS:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {availableTransitions.length > 0 ? (
                    availableTransitions.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">
                      Terminal State (None)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                  Target State to Execute:
                </label>
                <select
                  value={simulatingTarget}
                  onChange={(e) => setSimulatingTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
                >
                  {allPossibleStates.map((st) => {
                    const isAllowed = availableTransitions.includes(st);
                    return (
                      <option key={st} value={st} className="bg-slate-950 text-slate-200">
                        {st} {isAllowed ? '(VALID)' : '(ILLEGAL TRANSITION)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 mb-1.5">
                  Audit Reason / Notes:
                </label>
                <input
                  type="text"
                  value={transitionReason}
                  onChange={(e) => setTransitionReason(e.target.value)}
                  placeholder="e.g., Simulated manual verification test"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExecuteTransition(simulatingTarget)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 shadow-cyber-glow transition-all flex items-center justify-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Transition</span>
                </button>

                {['INITIATED', 'READY', 'UPLOADING'].includes(currentSession.currentState) && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2.5 px-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 text-xs font-mono transition-all"
                    title="Cancel Session"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>SECURITY AUDIT:</span>
              <span>All illegal transitions are rejected by backend and logged to SecurityLog</span>
            </div>
          </div>

          {/* Transition History Ledger */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Cryptographic State Transition Ledger
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Chronological tamper-evident audit history for session {currentSession.sessionId}
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {currentSession.stateHistory?.length || 0} Events Recorded
              </span>
            </div>

            <SessionHistory history={currentSession.stateHistory} />
          </div>
        </>
      ) : (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 font-mono text-xs text-slate-500">
          No transfer session available to monitor. Create or upload a file to begin.
        </div>
      )}
    </div>
  );
};

export default SessionMonitoring;
