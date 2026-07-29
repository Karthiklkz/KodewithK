'use client';

import React from 'react';
import { Key, Terminal, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentStep: 'landing' | 'tech' | 'difficulty' | 'interview' | 'analytics';
  onNavigateHome: () => void;
  onOpenApiKeyModal: () => void;
  hasApiKey: boolean;
  apiKey?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentStep,
  onNavigateHome,
  onOpenApiKeyModal,
  hasApiKey,
  apiKey,
}) => {
  const steps = [
    { key: 'landing', label: 'Home' },
    { key: 'tech', label: 'Setup' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'interview', label: 'Interview' },
    { key: 'analytics', label: 'Analytics' },
  ];

  const getStepIndex = (stepKey: string) => {
    return steps.findIndex((s) => s.key === stepKey);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo - KodeWithK */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-indigo-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center font-mono font-black text-cyan-400 text-lg">
              K
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                Kode<span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">WithK</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase flex items-center gap-1">
              <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="hidden sm:inline">Technical AI Prep • </span>
              <span className="text-cyan-400 font-semibold normal-case">By Karthik</span>
            </p>
          </div>
        </button>

        {/* Dynamic Navigation Progress Steps */}
        {currentStep !== 'landing' && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1.5 rounded-full border border-slate-800/80">
            {steps.slice(1).map((step, idx) => {
              const stepIdx = idx + 1;
              const isActive = currentStep === step.key;
              const isPassed = currentIndex > stepIdx;

              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-300 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 scale-105'
                        : isPassed
                        ? 'text-cyan-400 bg-slate-800/50'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-slate-950/40 flex items-center justify-center text-[10px] font-bold">
                      {stepIdx}
                    </span>
                    <span>{step.label}</span>
                  </div>
                  {idx < steps.length - 2 && (
                    <div
                      className={`w-3 h-0.5 mx-0.5 transition-colors ${
                        isPassed ? 'bg-cyan-500/60' : 'bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </nav>
        )}

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          {/* API Key Status Pill */}
          <button
            onClick={onOpenApiKeyModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${
              hasApiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 shadow-md shadow-amber-500/10'
            }`}
            title="Configure AI API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasApiKey ? (
                (() => {
                  if (apiKey?.startsWith('gsk_')) return 'Groq Key Active';
                  return 'AI Key Active';
                })()
              ) : (
                'Set AI Key'
              )}
            </span>
            <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
          </button>


        </div>
      </div>
    </header>
  );
};
