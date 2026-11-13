import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Activity,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Terminal,
} from 'lucide-react';
import DashboardCard from '../components/DashboardCard';
import SessionStatus from '../components/SessionStatus';
import SecurityActivity from '../components/SecurityActivity';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  getUsers,
  toggleUserBlock,
  getAdminSessions,
  getSecurityLogs,
  getAdminTelemetry,
} from '../services/adminService';
import { useToast } from '../context/ToastContext';

const AdminDashboard = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'sessions' | 'logs'
  const [telemetry, setTelemetry] = useState(null);
  const [users, setUsers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingUserId, setTogglingUserId] = useState(null);
  const [logStatusFilter, setLogStatusFilter] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [telemetryRes, usersRes, sessionsRes, logsRes] = await Promise.all([
        getAdminTelemetry(),
        getUsers(),
        getAdminSessions(),
        getSecurityLogs({ status: logStatusFilter }),
      ]);

      setTelemetry(telemetryRes.telemetry || {});
      setUsers(usersRes.users || []);
      setSessions(sessionsRes.sessions || []);
      setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
      addToast('Error fetching administrative telemetry data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [logStatusFilter]);

  const handleToggleBlock = async (user) => {
    setTogglingUserId(user._id);
    try {
      const res = await toggleUserBlock(user._id);
      addToast(res.message, user.isBlocked ? 'success' : 'warning');
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, isBlocked: !u.isBlocked } : u))
      );
      // Refresh telemetry
      const tel = await getAdminTelemetry();
      setTelemetry(tel.telemetry || {});
    } catch (err) {
      addToast(
        `Failed to alter user status: ${err.response?.data?.message || err.message}`,
        'error'
      );
    } finally {
      setTogglingUserId(null);
    }
  };

  if (loading && !telemetry) {
    return <LoadingSpinner text="Elevating security credentials & gathering telemetry..." />;
  }

  const t = telemetry || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Admin Command Header */}
      <div className="relative overflow-hidden rounded-2xl border border-rose-500/30 bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-950 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-[11px] mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>HIGH PRIVILEGE SECURITY COMMAND (LEVEL 5 ROOT)</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Cybersecurity Administration & Audit Gateway
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-mono mt-1">
              User Access Governance &bull; System-Wide FSM Surveillance &bull; Threat & Violation Logging
            </p>
          </div>

          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-rose-300 hover:border-rose-500/30 transition-all text-xs font-mono flex items-center gap-2 self-start md:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
        </div>
      </div>

      {/* Security Telemetry KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Operatives"
          value={t.totalUsers || 0}
          icon={Users}
          color="cyan"
          description="Registered system identities"
        />
        <DashboardCard
          title="Blocked Operatives"
          value={t.blockedUsers || 0}
          icon={Lock}
          color="rose"
          description="Accounts suspended for security"
        />
        <DashboardCard
          title="Security Incidents"
          value={t.securityAlerts || 0}
          icon={AlertTriangle}
          color="amber"
          description="Warnings & intrusion alerts"
        />
        <DashboardCard
          title="Unauthorized Attempts"
          value={t.unauthorizedAttempts || 0}
          icon={ShieldAlert}
          color="rose"
          description="Prevented illegal access attempts"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Operatives Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'sessions'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          All System Sessions ({sessions.length})
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          Security Audit Logs ({logs.length})
        </button>
      </div>

      {/* Tab 1: Operatives Directory & Blocking */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Identity & Access Governance
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Manage accounts, role assignments, and suspension status
              </p>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Operative</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Vault Assets</th>
                  <th className="py-3 px-4">FSM Sessions</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Enrolled Date</th>
                  <th className="py-3 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-slate-100">{u.username}</div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.role === 'admin'
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                            : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{u.fileCount || 0}</td>
                    <td className="py-3 px-4 text-slate-300">{u.sessionCount || 0}</td>
                    <td className="py-3 px-4">
                      {u.isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded text-[10px]">
                          <Lock className="w-3 h-3" /> BLOCKED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.role !== 'admin' ? (
                        <button
                          onClick={() => handleToggleBlock(u)}
                          disabled={togglingUserId === u._id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ml-auto ${
                            u.isBlocked
                              ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                              : 'bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
                          }`}
                        >
                          {u.isBlocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Block User</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic">Protected Root</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: System-Wide Sessions Monitor */}
      {activeTab === 'sessions' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                System-Wide FSM Sessions
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Monitoring active, completed, and failed transfers across all users
              </p>
            </div>
          </div>

          <div className="w-full overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Session ID</th>
                  <th className="py-3 px-4">Operative</th>
                  <th className="py-3 px-4">File Name</th>
                  <th className="py-3 px-4">Current State</th>
                  <th className="py-3 px-4">Progress</th>
                  <th className="py-3 px-4">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {sessions.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-cyan-300">{s.sessionId}</td>
                    <td className="py-3 px-4 text-slate-200">
                      {s.userId?.username || 'System User'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">{s.fileName}</td>
                    <td className="py-3 px-4">
                      <SessionStatus state={s.currentState} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-bold">{s.transferProgress}%</td>
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      {new Date(s.updatedAt || s.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Security Audit Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400" />
                Immutable Security & Audit Ledger
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Log of cryptographic operations, authentication attempts, and FSM transition alerts
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">FILTER STATUS:</span>
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-400"
              >
                <option value="">All Statuses</option>
                <option value="ALERT">ALERT</option>
                <option value="WARNING">WARNING</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
              </select>
            </div>
          </div>

          <SecurityActivity logs={logs} />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
