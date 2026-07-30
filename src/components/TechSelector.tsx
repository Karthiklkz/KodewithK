'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  Search,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCheck,
  HelpCircle,
} from 'lucide-react';
import { TECH_CATEGORIES } from '@/lib/mockData';
import { QuestionCount } from '@/lib/types';

interface TechSelectorProps {
  questionCount: QuestionCount;
  onSelectQuestionCount: (count: QuestionCount) => void;
  selectedTechs: string[];
  onToggleTech: (tech: string) => void;
  onSelectCategory: (techs: string[]) => void;
  onClearAll: () => void;
  onNext: () => void;
}

export const TechSelector: React.FC<TechSelectorProps> = ({
  questionCount,
  onSelectQuestionCount,
  selectedTechs,
  onToggleTech,
  onSelectCategory,
  onClearAll,
  onNext,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const questionCountOptions: QuestionCount[] = [10, 15, 20, 25, 30];

  const handleCategorySelectAll = (categoryTechs: string[]) => {
    onSelectCategory(categoryTechs);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Step Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Step 1 of 3: Setup Topics & Question Count
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Configure Your KodeWithK Interview
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Select your technologies, behavioral topics, and question count.
          </p>
        </div>

        {/* Selected Counter & Next Action */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm text-cyan-400 flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-cyan-400" />
            <span>
              <strong className="text-white font-bold">{selectedTechs.length}</strong> Topics Selected
            </span>
          </div>

          {selectedTechs.length > 0 && (
            <button
              onClick={onClearAll}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
              title="Clear Selections"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onNext}
            disabled={selectedTechs.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg ${
              selectedTechs.length > 0
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-cyan-500/25 hover:scale-105'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>Proceed to Difficulty</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Question Count Selector Bar */}
      <div className="bg-slate-900/80 border border-slate-800/90 p-5 rounded-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Select Number of Questions to Ask:</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Selected: <strong className="text-cyan-400 font-bold">{questionCount} Questions</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {questionCountOptions.map((count) => {
            const isSelected = questionCount === count;
            return (
              <button
                key={count}
                onClick={() => onSelectQuestionCount(count)}
                className={`py-2.5 px-3 rounded-xl font-mono text-xs font-bold border transition-all duration-200 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 border-cyan-400 text-white shadow-md shadow-cyan-500/20 scale-105'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                {count} Questions
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search topics (e.g., Python, SQL, React, Leadership, STAR Method)..."
          className="w-full pl-12 pr-10 py-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Grids */}
      <div className="space-y-8">
        {TECH_CATEGORIES.map((catGroup) => {
          const filteredTechs = catGroup.techs.filter((t) =>
            t.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredTechs.length === 0) return null;

          const allCatSelected = filteredTechs.every((t) => selectedTechs.includes(t));

          return (
            <div
              key={catGroup.category}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4"
            >
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <h3 className="text-base font-bold text-white tracking-wide">
                    {catGroup.category}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    ({filteredTechs.length})
                  </span>
                </div>

                <button
                  onClick={() => handleCategorySelectAll(filteredTechs)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 hover:underline"
                >
                  {allCatSelected ? 'Deselect Category' : 'Select All'}
                </button>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredTechs.map((tech) => {
                  const isSelected = selectedTechs.includes(tech);
                  return (
                    <motion.button
                      key={tech}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onToggleTech(tech)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between font-mono text-xs transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/60 text-cyan-300 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate pr-1">{tech}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Bar */}
      <div className="sticky bottom-4 z-40 bg-slate-950/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
          {selectedTechs.length === 0 ? (
            <span className="text-amber-400">⚠️ Please select at least 1 topic to continue.</span>
          ) : (
            <span>
              Session Setup: <strong className="text-cyan-400 font-bold">{questionCount} Questions</strong>
              <span className="hidden sm:inline"> — <span className="text-white font-bold">{selectedTechs.join(', ')}</span></span>
            </span>
          )}
        </div>

        <button
          onClick={onNext}
          disabled={selectedTechs.length === 0}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${
            selectedTechs.length > 0
              ? 'bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:scale-105'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <span>Choose Difficulty</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
