import React, { useState, useEffect } from 'react';
import { History, Search, Filter, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import SessionStatus from '../components/SessionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSessions } from '../services/sessionService';

const TransferHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedState) params.state = selectedState;
      if (searchQuery) params.search = searchQuery;
      const res = await getSessions(params);
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to fetch session history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedState]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSessions();
  };

  const fsmStateFilterOptions = [
    { label: 'All States', value: '' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Active / Uploading', value: 'UPLOADING' },
    { label: 'Initiated', value: 'INITIATED' },
    { label: 'Ready', value: 'READY' },
    { label: 'Verifying', value: 'VERIFYING' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Expired', value: 'EXPIRED' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <History className="w-6 h-6 text-cyan-400" />
            Transfer Session Ledger & Audit History
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Complete Historical Log of Finite State Machine Session Transitions
          </p>
        </div>

        <button
          onClick={fetchSessions}
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all text-xs font-mono flex items-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Session ID or File Name..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400 shrink-0" />
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-xl py-2.5 px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            {fsmStateFilterOptions.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Session History Table */}
      {loading ? (
        <LoadingSpinner text="Querying FSM audit ledger..." />
      ) : sessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40 font-mono text-xs text-slate-500">
          No transfer sessions match the selected query criteria.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Session ID</th>
                <th className="py-3.5 px-4">File Name</th>
                <th className="py-3.5 px-4">Current FSM State</th>
                <th className="py-3.5 px-4">Progress</th>
                <th className="py-3.5 px-4">Transitions Count</th>
                <th className="py-3.5 px-4">Created / Updated</th>
                <th className="py-3.5 px-4 text-right">Inspection</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sessions.map((sess) => (
                <tr key={sess._id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-cyan-300">
                    {sess.sessionId}
                  </td>
                  <td className="py-3.5 px-4 font-sans font-medium text-slate-200 max-w-[200px] truncate">
                    {sess.fileName || 'Pending File'}
                  </td>
                  <td className="py-3.5 px-4">
                    <SessionStatus state={sess.currentState} size="xs" />
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-300">
                    {sess.transferProgress}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {sess.stateHistory?.length || 1} transitions
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-slate-400">
                    <div>{new Date(sess.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(sess.updatedAt || sess.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/monitoring?session=${sess.sessionId}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-200 text-xs transition-colors"
                    >
                      <span>Monitor FSM</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TransferHistory;
