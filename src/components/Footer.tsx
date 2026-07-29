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

        {/* Right Action - Simple copyright */}
        <div className="text-xs text-slate-500 font-mono">
          &copy; {new Date().getFullYear()} KodeWithK. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
