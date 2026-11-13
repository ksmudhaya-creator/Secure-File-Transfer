import React from 'react';
import { Shield } from 'lucide-react';

const LoadingSpinner = ({ text = 'Securing session pipeline...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 min-h-[300px]">
      <div className="relative">
        <div className="w-16 h-16 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="w-6 h-6 text-cyan-400 animate-pulse" />
        </div>
      </div>
      <p className="mt-4 text-xs font-mono text-cyan-400/80 tracking-widest uppercase">
        {text}
      </p>
    </div>
  );
};

export default LoadingSpinner;
