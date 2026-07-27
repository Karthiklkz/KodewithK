'use client';

import React from 'react';
import { Cpu, ShieldCheck, Zap, Trash2, Heart } from 'lucide-react';

interface FooterProps {
  onClearSession?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onClearSession }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-8 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-cyan-400">
            K
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              KodeWithK — Technical AI Interview Platform
            </p>
            <p className="text-xs text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>Developed by <strong className="text-white font-semibold">Karthik</strong></span>
              <span>•</span>
              <span className="text-slate-400">Powered by AI Engine</span>
            </p>
          </div>
        </div>

        {/* Middle Badges */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Zero Database Storage
          </span>
          <span className="flex items-center gap-1 text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
            <Zap className="w-3.5 h-3.5" /> 30s Auto Purge
          </span>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-3">
          {onClearSession && (
            <button
              onClick={onClearSession}
              className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg border border-rose-500/30 transition-colors font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Memory Cache
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
