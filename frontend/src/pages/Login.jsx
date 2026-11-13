import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, Terminal, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      addToast('Authenticated successfully. FSM session initialized.', 'success');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication handshake failed.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      {/* Background Cyber Glow Grids */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.15)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-cyber-glow mb-4">
            <Shield className="w-7 h-7 text-slate-950" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-wide uppercase">
            Cyber Security Access Portal
          </h2>
          <p className="text-xs font-mono text-cyan-400/80 mt-1">
            SECURE FILE TRANSFER &bull; FSM STATE ENGINE
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 backdrop-blur-2xl p-8 shadow-2xl">
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/40 text-rose-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Identity / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="analyst@cybersec.io"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Security Passphrase
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950/90 border border-slate-800 rounded-xl py-2.5 pl-10 pr-10 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 transition-all shadow-cyber-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Token...</span>
                </>
              ) : (
                <>
                  <span>Authenticate Session</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials for Academic Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              Quick Academic Demo Accounts:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin@cybersec.io', 'AdminPassword123!')}
                className="p-2 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-[10px] font-mono hover:bg-rose-900/40 text-left transition-colors"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>ROOT ADMIN</span>
                  <span className="text-[9px] bg-rose-500/20 px-1 py-0.2 rounded">AUTO</span>
                </div>
                <div className="text-slate-400 truncate">admin@cybersec.io</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('user@cybersec.io', 'UserPassword123!')}
                className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono hover:bg-cyan-900/40 text-left transition-colors"
              >
                <div className="font-bold flex items-center justify-between">
                  <span>USER ALICE</span>
                  <span className="text-[9px] bg-cyan-500/20 px-1 py-0.2 rounded">AUTO</span>
                </div>
                <div className="text-slate-400 truncate">user@cybersec.io</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 font-mono">
            New operative?{' '}
            <Link to="/register" className="text-cyan-400 hover:text-cyan-300 underline font-semibold">
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
