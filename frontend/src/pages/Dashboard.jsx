import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Activity,
  CheckCircle2,
  AlertOctagon,
  XCircle,
  Clock,
  HardDrive,
  UploadCloud,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import DashboardCard from '../components/DashboardCard';
import SessionStatus from '../components/SessionStatus';
import LoadingSpinner from '../components/LoadingSpinner';
import { getDashboardStats } from '../services/sessionService';
import { getFiles } from '../services/fileService';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, filesRes] = await Promise.all([
          getDashboardStats(),
          getFiles(),
        ]);
        setStats(statsRes);
        setFiles(filesRes.files || []);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Compiling cryptographic telemetry..." />;
  }

  const s = stats?.stats || {};
  const stateDistribution = stats?.stateDistribution || [];
  const recentSessions = stats?.recentSessions || [];

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/60 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CRYPTOGRAPHIC PROTOCOL INITIALIZED</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Security Command Center
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-mono mt-1">
              Active Operative: <span className="text-cyan-300 font-semibold">{user?.username}</span> &bull; Finite State Machine v2.0 Operational
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 shadow-cyber-glow transition-all flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Initialize Transfer</span>
            </Link>
          </div>
        </div>

        {/* Ambient background accent */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-cyan-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 7 Core FSM & Storage Statistic Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Files Vaulted"
          value={s.totalFiles || 0}
          icon={FolderLock}
          color="cyan"
          description="AES-256-GCM encrypted disk objects"
        />
        <DashboardCard
          title="Total Transfer Sessions"
          value={s.totalSessions || 0}
          icon={Activity}
          color="purple"
          description="All instantiated FSM sessions"
        />
        <DashboardCard
          title="Active Transfers"
          value={s.activeSessions || 0}
          icon={TrendingUp}
          color="blue"
          trend="In Progress"
          description="Initiated, Ready, Uploading, Verifying"
        />
        <DashboardCard
          title="Completed Transfers"
          value={s.completedTransfers || 0}
          icon={CheckCircle2}
          color="emerald"
          description="Transfers cryptographically verified"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <DashboardCard
          title="Failed Transfers"
          value={s.failedTransfers || 0}
          icon={AlertOctagon}
          color="rose"
          description="Aborted or verification mismatch"
        />
        <DashboardCard
          title="Cancelled Transfers"
          value={s.cancelledTransfers || 0}
          icon={XCircle}
          color="amber"
          description="Client-aborted handshake sessions"
        />
        <DashboardCard
          title="Expired Sessions"
          value={s.expiredSessions || 0}
          icon={Clock}
          color="purple"
          description="Inactivity timeout reached"
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Distribution Pie Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                FSM State Machine Distribution
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Real-time session outcomes by state
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              Total: {s.totalSessions || 0}
            </span>
          </div>

          <div className="h-64 w-full">
            {stateDistribution.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stateDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {stateDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
                Awaiting first transfer session to render state distribution chart.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-4 border-t border-slate-800/80">
            {stateDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs font-mono">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-400">{item.name}:</span>
                <span className="text-white font-bold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Throughput / Breakdown Bar Chart */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Session Lifecycle Metrics
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Transfer session statuses comparison
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-400 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span>Storage: {formatFileSize(s.totalBytes || 0)}</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'Active', count: s.activeSessions || 0, fill: '#3B82F6' },
                  { name: 'Completed', count: s.completedTransfers || 0, fill: '#10B981' },
                  { name: 'Failed', count: s.failedTransfers || 0, fill: '#EF4444' },
                  { name: 'Cancelled', count: s.cancelledTransfers || 0, fill: '#F59E0B' },
                  { name: 'Expired', count: s.expiredSessions || 0, fill: '#6B7280' },
                ]}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <YAxis stroke="#64748b" fontSize={11} fontFamily="monospace" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '0.75rem',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <span>FSM INTEGRITY ENGINE: VALIDATED</span>
            <Link to="/monitoring" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Open Live Monitor &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Transfer Activity Feed & Quick File Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transfer Sessions */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Recent Transfer Sessions
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Latest FSM session invocations
              </p>
            </div>
            <Link
              to="/history"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View All History &rarr;
            </Link>
          </div>

          {recentSessions.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No recent transfer sessions initiated.
            </div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session._id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {session.fileName || 'Transfer Session'}
                      </span>
                      <SessionStatus state={session.currentState} size="xs" />
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center gap-3">
                      <span>ID: {session.sessionId}</span>
                      <span>Progress: {session.transferProgress}%</span>
                    </div>
                  </div>
                  <Link
                    to={`/monitoring?session=${session.sessionId}`}
                    className="px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900/50 text-[11px] font-mono transition-colors"
                  >
                    Inspect
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Encrypted Vault Snapshot */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Vault Storage Snapshot
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Encrypted file assets on secure disk
              </p>
            </div>
            <Link
              to="/files"
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              Open Vault &rarr;
            </Link>
          </div>

          {files.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No files currently stored in encrypted vault.
            </div>
          ) : (
            <div className="space-y-3">
              {files.slice(0, 4).map((file) => (
                <div
                  key={file._id}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950/50 flex items-center justify-between gap-3 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {file.fileName}
                    </p>
                    <p className="text-[10px] font-mono text-cyan-400 truncate mt-0.5">
                      SHA-256: {file.fileHash?.slice(0, 24)}...
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {formatFileSize(file.fileSize)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
