import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Key,
  FolderLock,
  Activity,
  Calendar,
  Lock,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const UserProfile = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(user);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const u = await refreshProfile();
        setProfileData(u || user);
      } catch (err) {
        console.error('Error refreshing profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await logout();
    addToast('Security session terminated cleanly.', 'info');
    navigate('/login');
  };

  if (loading && !profileData) {
    return <LoadingSpinner text="Retrieving identity record..." />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
          <User className="w-6 h-6 text-cyan-400" />
          Operative Security Profile
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Identity Credentials, Access Level & Cryptographic Allocation
        </p>
      </div>

      {/* Main Profile Identity Card */}
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-400/40 flex items-center justify-center font-mono text-xl font-bold text-slate-950 shadow-cyber-glow">
              {profileData?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">{profileData?.username}</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                  {profileData?.role} TIER
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1">
                {profileData?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 hover:bg-rose-900/40 text-xs font-mono font-bold transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>End Session</span>
          </button>
        </div>

        {/* Security Parameters & Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Account Status</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ACTIVE / VERIFIED</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Encrypted Vault Files</span>
              <FolderLock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {profileData?.stats?.filesCount || 0} Assets
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="text-[10px] font-mono uppercase text-slate-500 flex items-center justify-between">
              <span>Transfer Sessions</span>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-sm font-bold font-mono text-white mt-1">
              {profileData?.stats?.sessionsCount || 0} Sessions
            </div>
          </div>
        </div>

        {/* Enrolled Details */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Enrollment Timestamp</span>
            <span className="text-slate-300">
              {profileData?.createdAt
                ? new Date(profileData.createdAt).toLocaleString()
                : 'Registered via System'}
            </span>
          </div>

          <div>
            <span className="text-slate-500 uppercase text-[10px] block">Cryptographic Privileges</span>
            <span className="text-cyan-400">
              AES-256-GCM Decryption &bull; SHA-256 Validation &bull; FSM Execution
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
