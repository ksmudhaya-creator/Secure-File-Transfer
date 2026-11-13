import React, { useState, useEffect } from 'react';
import { FolderLock, Search, UploadCloud, RefreshCw, HardDrive } from 'lucide-react';
import { Link } from 'react-router-dom';
import FileTable from '../components/FileTable';
import LoadingSpinner from '../components/LoadingSpinner';
import { getFiles } from '../services/fileService';

const FileManagement = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await getFiles();
      setFiles(res.files || []);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileDeleted = (deletedId) => {
    setFiles((prev) => prev.filter((f) => f._id !== deletedId));
  };

  const filteredFiles = files.filter((f) =>
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.fileHash?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalVaultSize = files.reduce((acc, f) => acc + (f.fileSize || 0), 0);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
            <FolderLock className="w-6 h-6 text-cyan-400" />
            Encrypted File Vault
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            AES-256-GCM Encrypted Storage & SHA-256 Integrity Verification Repository
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFiles}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/30 transition-all text-xs font-mono flex items-center gap-1.5"
            title="Refresh Vault Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            to="/upload"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 shadow-cyber-glow transition-all flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Asset</span>
          </Link>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Total Encrypted Assets</div>
            <div className="text-xl font-bold font-mono text-white mt-1">{files.length}</div>
          </div>
          <FolderLock className="w-8 h-8 text-cyan-400/40" />
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Total Vault Volume</div>
            <div className="text-xl font-bold font-mono text-cyan-300 mt-1">
              {formatFileSize(totalVaultSize)}
            </div>
          </div>
          <HardDrive className="w-8 h-8 text-cyan-400/40" />
        </div>

        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Active Encryption Standard</div>
            <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
              AES-256-GCM + SHA-256
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
            COMPLIANT
          </span>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name or SHA-256 hash checksum..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* Main File Table */}
      {loading ? (
        <LoadingSpinner text="Retrieving cryptographic file records..." />
      ) : (
        <FileTable files={filteredFiles} onFileDeleted={handleFileDeleted} />
      )}
    </div>
  );
};

export default FileManagement;
