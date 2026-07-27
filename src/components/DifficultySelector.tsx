'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Flame, Zap, Award, ArrowLeft, Lightbulb } from 'lucide-react';
import { Difficulty, QuestionCount } from '@/lib/types';

interface DifficultySelectorProps {
  selectedDifficulty: Difficulty;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  questionCount: QuestionCount;
  onBack: () => void;
  onStartInterview: () => void;
  isLoading: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  selectedDifficulty,
  onSelectDifficulty,
  questionCount,
  onBack,
  onStartInterview,
  isLoading,
}) => {
  const difficulties: Array<{
    level: Difficulty;
    title: string;
    description: string;
    targetRole: string;
    icon: any;
    color: string;
    borderColor: string;
    bgGlow: string;
    badge: string;
  }> = [
    {
      level: 'Easy',
      title: 'Easy Level',
      description: 'Core concepts, fundamental syntax, standard library functions, and basic problem solving.',
      targetRole: 'Junior / Intern Engineers',
      icon: Zap,
      color: 'text-emerald-400',
      borderColor: 'border-emerald-500/50',
      bgGlow: 'from-emerald-500/10 via-slate-900 to-slate-900',
      badge: 'Fundamentals',
    },
    {
      level: 'Medium',
      title: 'Medium Level',
      description: 'Intermediate logic, API design, common software patterns, data structure manipulations, and async flow.',
      targetRole: 'Mid-Level Engineers (2-4 YOE)',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      borderColor: 'border-cyan-500/50',
      bgGlow: 'from-cyan-500/10 via-slate-900 to-slate-900',
      badge: 'Recommended',
    },
    {
      level: 'Hard',
      title: 'Hard Level',
      description: 'Complex architecture scenarios, optimization, performance bottlenecks, edge cases, and concurrency.',
      targetRole: 'Senior / Staff Engineers (5+ YOE)',
      icon: Flame,
      color: 'text-indigo-400',
      borderColor: 'border-indigo-500/50',
      bgGlow: 'from-indigo-500/10 via-slate-900 to-slate-900',
      badge: 'Advanced',
    },
    {
      level: 'Expert',
      title: 'Expert Level',
      description: 'Deep internals, low-level execution details, high-throughput distributed design, and production incident debugging.',
      targetRole: 'Principal / Lead AI Engineers',
      icon: Award,
      color: 'text-purple-400',
      borderColor: 'border-purple-500/50',
      bgGlow: 'from-purple-500/10 via-slate-900 to-slate-900',
      badge: 'Hardcore',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Step 2 of 3: Select Difficulty
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Choose Difficulty Level
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Tailor the complexity of your {questionCount} AI-generated interview questions.
          </p>
        </div>

        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono transition-colors self-start md:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Setup
        </button>
      </div>

      {/* PRO INTERVIEW TIP BEFORE STARTING */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-500/10 border border-amber-500/30 flex items-start gap-4 shadow-xl"
      >
        <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div className="space-y-1 font-mono text-xs">
          <span className="font-bold text-amber-400 uppercase tracking-wider text-xs">
            💡 Pro Interview Tip (Before You Begin)
          </span>
          <p className="text-slate-200 leading-relaxed">
            For Multiple Choice questions, use instant hotkeys <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400">1-4</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-400">A-D</kbd>. For behavioral questions, structure responses using the <strong>STAR Method</strong> (Situation, Task, Action, Result) to maximize your AI score.
          </p>
        </div>
      </motion.div>

      {/* Difficulty Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {difficulties.map((item) => {
          const isSelected = selectedDifficulty === item.level;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.level}
              whileHover={{ scale: 1.02 }}
              onClick={() => onSelectDifficulty(item.level)}
              className={`cursor-pointer rounded-2xl p-6 border transition-all duration-300 relative overflow-hidden bg-gradient-to-b ${
                item.bgGlow
              } ${
                isSelected
                  ? `${item.borderColor} shadow-2xl shadow-cyan-500/10 ring-2 ring-cyan-500/40`
                  : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Card Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-800 ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400">
                  {item.badge}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">{item.description}</p>

              {/* Targeted Role */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Target Level:</span>
                <span className={`font-bold ${item.color}`}>{item.targetRole}</span>
              </div>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-lg shadow-cyan-400" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Action Footer Bar */}
      <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400 font-mono">
          Selected Difficulty:{' '}
          <strong className="text-cyan-400 font-bold">{selectedDifficulty}</strong> ({questionCount} Qs)
        </div>

        <button
          onClick={onStartInterview}
          disabled={isLoading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating {questionCount} AI Questions...</span>
            </>
          ) : (
            <>
              <span>Start {questionCount}-Question Interview</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
