import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  AlertOctagon,
  XCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StateMachineDiagram from '../components/StateMachineDiagram';
import TransferProgress from '../components/TransferProgress';
import SessionStatus from '../components/SessionStatus';
import { createSession, cancelSession } from '../services/sessionService';
import { uploadFile } from '../services/fileService';
import { useToast } from '../context/ToastContext';

const FileUpload = () => {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [currentState, setCurrentState] = useState('INITIATED');
  const [progress, setProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        addToast('Security Violation: File exceeds maximum allowed size of 50MB.', 'error');
        return;
      }
      setSelectedFile(file);
      setTransferResult(null);
      setCurrentState('INITIATED');
      setProgress(0);
    }
  };

  const handleStartTransfer = async () => {
    if (!selectedFile) {
      addToast('Please select a file to transfer.', 'warning');
      return;
    }

    setIsTransferring(true);
    setTransferResult(null);

    try {
      // 1. Initialize FSM Session
      addToast('FSM: Creating transfer session handshake...', 'info');
      setCurrentState('INITIATED');
      setProgress(10);

      const sessionRes = await createSession({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        transferType: 'UPLOAD',
      });

      const session = sessionRes.session;
      setActiveSession(session);

      // 2. Upload file through FSM pipeline
      setCurrentState('AUTHENTICATING');
      setProgress(25);
      await new Promise((r) => setTimeout(r, 400));

      setCurrentState('READY');
      setProgress(40);
      await new Promise((r) => setTimeout(r, 400));

      setCurrentState('UPLOADING');
      setProgress(60);

      const uploadRes = await uploadFile(selectedFile, session.sessionId, (pct) => {
        // Map upload progress into the 60-85 range
        const mappedPct = Math.round(60 + (pct * 0.25));
        setProgress(mappedPct);
      });

      // 3. Verifying AES-256-GCM and SHA-256
      setCurrentState('VERIFYING');
      setProgress(85);
      await new Promise((r) => setTimeout(r, 500));

      // 4. Completed
      setCurrentState('COMPLETED');
      setProgress(100);
      setTransferResult(uploadRes);
      addToast(
        `Transfer Completed! File encrypted with AES-256-GCM. SHA-256 integrity hash registered.`,
        'success',
        6000
      );
    } catch (error) {
      setCurrentState('FAILED');
      setProgress(0);
      const msg = error.response?.data?.message || error.message || 'File transfer failed.';
      addToast(`Transfer Error: ${msg}`, 'error');
    } finally {
      setIsTransferring(false);
    }
  };

  const handleCancelTransfer = async () => {
    if (!activeSession) return;

    try {
      await cancelSession(activeSession.sessionId, 'Transfer terminated by user request.');
      setCurrentState('CANCELLED');
      setProgress(0);
      setIsTransferring(false);
      addToast('Transfer session successfully cancelled via FSM.', 'warning');
    } catch (err) {
      addToast(`Cancellation failed: ${err.message}`, 'error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setActiveSession(null);
    setCurrentState('INITIATED');
    setProgress(0);
    setTransferResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const copyChecksum = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    addToast('SHA-256 Checksum copied to clipboard.', 'info');
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide uppercase flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-cyan-400" />
          Secure File Transfer Gateway
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-1">
          AES-256-GCM Encrypted Ingestion Channel with Finite State Machine Lifecycle Control
        </p>
      </div>

      {/* Dynamic FSM Visualization */}
      <StateMachineDiagram currentState={currentState} />

      {/* Main Upload Staging Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Drop Zone & Controls */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Cryptographic Transfer Channel
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Select local asset for authenticated encryption
              </p>
            </div>
            {activeSession && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-lg">
                SESSION: {activeSession.sessionId}
              </span>
            )}
          </div>

          {/* Drag & Drop Area */}
          <div
            onClick={() => !isTransferring && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              selectedFile
                ? 'border-cyan-500/50 bg-cyan-950/10'
                : 'border-slate-800 hover:border-cyan-500/30 bg-slate-950/40 hover:bg-slate-900/40'
            } ${isTransferring ? 'pointer-events-none opacity-80' : ''}`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isTransferring}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-cyber-glow">
              <UploadCloud className="w-7 h-7" />
            </div>

            {selectedFile ? (
              <div>
                <p className="text-sm font-bold text-white font-sans">{selectedFile.name}</p>
                <p className="text-xs font-mono text-cyan-400 mt-1">
                  Size: {formatFileSize(selectedFile.size)} &bull; Type: {selectedFile.type || 'binary/stream'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-2">
                  Click to replace selected asset
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  Click or drag file to stage for secure transfer
                </p>
                <p className="text-xs font-mono text-slate-500 mt-1">
                  Max file size: 50MB &bull; Automatic AES-256-GCM Ciphering
                </p>
              </div>
            )}
          </div>

          {/* Transfer Progress Bar */}
          {(isTransferring || currentState !== 'INITIATED') && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
              <TransferProgress progress={progress} state={currentState} />
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>STATUS: {currentState}</span>
                <span>FSM PIPELINE ACTIVE</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleStartTransfer}
                disabled={!selectedFile || isTransferring || currentState === 'COMPLETED'}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:from-cyan-400 hover:to-blue-500 shadow-cyber-glow transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTransferring ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Initiate Secure Transfer</span>
                  </>
                )}
              </button>

              {isTransferring && (
                <button
                  type="button"
                  onClick={handleCancelTransfer}
                  className="px-4 py-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 text-xs font-mono font-bold uppercase transition-all flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Abort Transfer</span>
                </button>
              )}
            </div>

            {(selectedFile || currentState === 'COMPLETED' || currentState === 'FAILED') && (
              <button
                type="button"
                onClick={handleReset}
                disabled={isTransferring}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all"
              >
                Reset Gateway
              </button>
            )}
          </div>
        </div>

        {/* Cryptographic Verification & Audit Receipt */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="border-b border-slate-800/80 pb-3 mb-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Cryptographic Receipt
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Integrity specifications & telemetry
              </p>
            </div>

            {transferResult ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Payload Encrypted & Vaulted Successfully</span>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase text-slate-400">
                    File Asset
                  </label>
                  <p className="text-xs font-semibold text-slate-200">
                    {transferResult.file?.fileName}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400 mb-1">
                    <span>SHA-256 Checksum</span>
                    <button
                      onClick={() => copyChecksum(transferResult.file?.fileHash)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                    >
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 break-all select-all">
                    {transferResult.file?.fileHash}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">CIPHER</div>
                    <div className="font-bold text-slate-200 mt-0.5">AES-256-GCM</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400">INTEGRITY</div>
                    <div className="font-bold text-emerald-400 mt-0.5">AUTHENTICATED</div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/files"
                    className="w-full py-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-mono font-bold uppercase transition-all flex items-center justify-center gap-2"
                  >
                    <span>View in Vault</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs font-mono text-slate-400">
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="text-[10px] text-cyan-400 font-bold mb-1">CIPHER ALGORITHM:</div>
                  <div>AES-256-GCM (Galois/Counter Mode) with 128-bit authentication tag</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="text-[10px] text-cyan-400 font-bold mb-1">INTEGRITY STANDARD:</div>
                  <div>SHA-256 cryptographic hashing verified upon download</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80">
                  <div className="text-[10px] text-cyan-400 font-bold mb-1">STATE MACHINE ENFORCEMENT:</div>
                  <div>Handshake state transition validation on every lifecycle event</div>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-3 flex items-center justify-between">
            <span>ZERO EXPOSURE POLICY</span>
            <span className="text-cyan-400">STRICT MEMORY/DISK</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
