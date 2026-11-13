import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FolderLock,
  History,
  Activity,
  User,
  ShieldAlert,
  LogOut,
  Terminal,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Upload File', path: '/upload', icon: UploadCloud },
    { name: 'File Vault', path: '/files', icon: FolderLock },
    { name: 'Transfer History', path: '/history', icon: History },
    { name: 'FSM Session Monitor', path: '/monitoring', icon: Activity },
    { name: 'Security Profile', path: '/profile', icon: User },
  ];

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-cyan-500/15 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-6 border-b border-cyan-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-cyber-glow">
            <Terminal className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
              SecureTrans <span className="text-cyan-400 font-mono text-xs">FSM</span>
            </h1>
            <p className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-widest">
              State Engine v2.0
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-slate-300">
          Operation Center
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-cyber-glow font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="pt-6">
            <div className="px-3 mb-2 text-[10px] font-mono uppercase tracking-wider text-rose-400 flex items-center justify-between">
              <span>Admin Oversight</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                ROOT
              </span>
            </div>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-rose-500/20 to-pink-500/10 text-rose-300 border border-rose-500/30 font-semibold'
                    : 'text-rose-400/80 hover:text-rose-200 hover:bg-rose-950/30'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Security Command</span>
            </NavLink>
          </div>
        )}
      </div>

      {/* User Footer Card */}
      <div className="p-4 border-t border-cyan-500/15 bg-slate-900/40">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/30 flex items-center justify-center font-mono text-xs text-cyan-300 font-bold shrink-0">
              {user?.username?.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-slate-200 truncate">{user?.username}</p>
              <p className="text-[10px] font-mono text-cyan-400/80 capitalize">{user?.role} Tier</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Terminate Session"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] font-mono text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            AES-GCM Cipher
          </span>
          <span className="text-cyan-400 font-semibold">256-BIT</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
