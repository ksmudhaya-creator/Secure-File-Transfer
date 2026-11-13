import React, { useState } from 'react';
import {
  FileText,
  Download,
  Trash2,
  ShieldCheck,
  Copy,
  Check,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { downloadFile, verifyFile, deleteFile } from '../services/fileService';
import { useToast } from '../context/ToastContext';

const FileTable = ({ files = [], onFileDeleted }) => {
  const { addToast } = useToast();
  const [copiedId, setCopiedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleCopyHash = (hash, id) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    addToast('SHA-256 checksum copied to clipboard', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (file) => {
    setDownloadingId(file._id);
    try {
      addToast(`Initiating AES-256-GCM decryption for '${file.fileName}'...`, 'info');
      const result = await downloadFile(file._id, file.fileName);
      addToast(
        `File decrypted and downloaded! SHA-256 integrity verified (${result.sha256?.slice(0, 10)}...).`,
        'success'
      );
    } catch (error) {
      addToast(
        `Download failed: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleVerify = async (file) => {
    setVerifyingId(file._id);
    try {
      const res = await verifyFile(file._id);
      if (res.verified) {
        addToast(
          `Integrity Verified! AES-256-GCM AuthTag and SHA-256 (${res.computedHash.slice(0, 12)}...) are valid and uncorrupted.`,
          'success',
          6000
        );
      } else {
        addToast('File verification failed! Potential tampering detected.', 'error', 6000);
      }
    } catch (error) {
      addToast(
        `Verification error: ${error.response?.data?.message || error.message}`,
        'error'
      );
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete '${file.fileName}'? Encrypted data will be permanently wiped.`)) {
      return;
    }

    try {
      await deleteFile(file._id);
      addToast(`File '${file.fileName}' securely deleted.`, 'success');
      if (onFileDeleted) onFileDeleted(file._id);
    } catch (error) {
      addToast(`Deletion failed: ${error.response?.data?.message || error.message}`, 'error');
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl border border-slate-800 bg-slate-900/40">
        <Lock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">Secure Vault Empty</h4>
        <p className="text-xs text-slate-500 font-mono mt-1">
          No encrypted files stored in your cryptographic partition.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl">
      <table className="w-full text-left text-xs font-mono">
        <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
          <tr>
            <th className="py-3.5 px-4">File Name</th>
            <th className="py-3.5 px-4">Size</th>
            <th className="py-3.5 px-4">Cipher & Hash (SHA-256)</th>
            <th className="py-3.5 px-4">Owner / Date</th>
            <th className="py-3.5 px-4 text-right">Cryptographic Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-slate-300">
          {files.map((file) => (
            <tr
              key={file._id}
              className="hover:bg-slate-800/40 transition-colors group"
            >
              {/* File Name */}
              <td className="py-3 px-4 font-sans font-medium text-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                      {file.fileName}
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        AES-GCM
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {file.mimeType || 'binary/stream'}
                    </span>
                  </div>
                </div>
              </td>

              {/* Size */}
              <td className="py-3 px-4 font-mono text-slate-400">
                {formatFileSize(file.fileSize)}
              </td>

              {/* SHA-256 Hash with Copy */}
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-cyan-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 max-w-[180px] truncate">
                    {file.fileHash}
                  </span>
                  <button
                    onClick={() => handleCopyHash(file.fileHash, file._id)}
                    title="Copy SHA-256 Checksum"
                    className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                  >
                    {copiedId === file._id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </td>

              {/* Owner & Date */}
              <td className="py-3 px-4">
                <div className="text-[11px] text-slate-300">
                  {file.owner?.username || 'Current User'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {new Date(file.createdAt).toLocaleDateString()}
                </div>
              </td>

              {/* Actions */}
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {/* Verify Integrity Button */}
                  <button
                    onClick={() => handleVerify(file)}
                    disabled={verifyingId === file._id}
                    title="Audit Cryptographic Integrity"
                    className="p-2 rounded-lg bg-purple-950/30 border border-purple-500/30 text-purple-400 hover:bg-purple-900/40 hover:text-purple-300 transition-all text-xs font-mono flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Verify</span>
                  </button>

                  {/* Decrypt & Download Button */}
                  <button
                    onClick={() => handleDownload(file)}
                    disabled={downloadingId === file._id}
                    title="Decrypt with AES-256-GCM & Download"
                    className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 hover:text-cyan-200 transition-all text-xs font-mono flex items-center gap-1 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Decrypt</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDelete(file)}
                    title="Secure Wipe"
                    className="p-2 rounded-lg bg-rose-950/20 border border-rose-500/20 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 transition-all text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;
