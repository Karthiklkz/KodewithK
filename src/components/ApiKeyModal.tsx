'use client';

import React, { useState } from 'react';
import { Key, ShieldCheck, Check, X, ExternalLink, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  currentApiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(currentApiKey);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(inputKey.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-3xl max-w-lg w-full space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Engine API Key</h3>
            <p className="text-xs text-slate-400 font-mono">
              Configure Custom AI Engine Key
            </p>
          </div>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <p className="text-slate-300 leading-relaxed">
            Enter your <code className="text-cyan-400">Groq (gsk_...)</code> API Key.
            If no key is provided, the platform automatically utilizes its intelligent
            dynamic question & semantic evaluation fallback engine.
          </p>

          <input
            type="password"
            value={inputKey}
            onChange={(e) => setInputKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm"
          />

          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
            <span className="flex items-center gap-1 text-slate-400 text-[11px] mb-1">
              Configure Groq API access
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px]">
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                Groq Console <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold font-mono text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform"
          >
            {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            <span>{saved ? 'Key Saved!' : 'Save Key'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
