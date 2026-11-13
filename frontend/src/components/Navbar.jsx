import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, UploadCloud, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-cyan-500/15 bg-slate-950/70 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left status telemetry */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-slate-300 font-medium">NODE PIPELINE:</span>
          <span className="text-emerald-400 font-semibold tracking-wider">ACTIVE (FSM v2)</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-300 border-l border-slate-800 pl-6">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>CIPHER:</span>
          <span className="text-cyan-300">AES-256-GCM + SHA-256</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Real-time Clock */}
        <div className="hidden sm:block text-right">
          <div className="text-xs font-mono text-cyan-300 font-semibold tracking-wider">
            {time}
          </div>
          <div className="text-[10px] font-mono text-slate-300">
            SYSTEM UTC+05:30
          </div>
        </div>

        {/* Quick Upload CTA */}
        <Link
          to="/upload"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-semibold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-cyber-glow"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Secure Upload</span>
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
