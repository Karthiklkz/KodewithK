'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { FinalAnalytics, QuestionResult } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface AnalyticsDashboardProps {
  analytics: FinalAnalytics;
  results: QuestionResult[];
  onAutoPurgeComplete: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  analytics,
  results,
  onAutoPurgeComplete,
}) => {
  // Trigger celebratory confetti on initial load
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (e) {
      console.log('Confetti failed to run', e);
    }
  }, []);

  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'Interview Ready':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'Excellent':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50';
      case 'Good':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Sleek Header Section */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-5 rounded-2xl backdrop-blur-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            Performance Analytics
          </h2>
          <p className="text-xs text-slate-400">
            Review your technical feedback and recommended areas of practice below.
          </p>
        </div>
        <div>
          <button
            onClick={onAutoPurgeComplete}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-xs font-mono text-white font-bold hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl p-6 sm:p-10 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Circular Score Gauge */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-48 h-48 transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  className="text-slate-800"
                  fill="transparent"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  strokeDasharray={502}
                  strokeDashoffset={502 - (502 * analytics.percentage) / 100}
                  className="text-cyan-400 transition-all duration-1000"
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-black font-mono text-white">
                  {analytics.totalScore}
                </span>
                <span className="text-xs font-mono text-slate-400">/ 150 Points</span>
                <span className="text-sm font-bold font-mono text-cyan-400 mt-1">
                  {analytics.percentage}% Score
                </span>
              </div>
            </div>

            <span
              className={`px-4 py-1.5 rounded-full border text-xs font-mono font-extrabold uppercase tracking-wider ${getRatingBadgeColor(
                analytics.performanceRating
              )}`}
            >
              Rating: {analytics.performanceRating}
            </span>
          </div>

          {/* Hiring Recommendation & Score Metric Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                <BrainCircuit className="w-4 h-4" />
                <span>AI Hiring Recommendation</span>
              </div>
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-900/40 text-slate-200 text-sm font-medium leading-relaxed">
                {analytics.hiringRecommendation}
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Correct
                </span>
                <p className="text-xl font-bold font-mono text-white">
                  {analytics.correctCount} / {results.length}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-400" /> Incorrect
                </span>
                <p className="text-xl font-bold font-mono text-white">
                  {analytics.incorrectCount}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" /> Total Time
                </span>
                <p className="text-xl font-bold font-mono text-white">
                  {formatTime(analytics.totalTimeSeconds)}
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" /> Accuracy
                </span>
                <p className="text-xl font-bold font-mono text-cyan-400">
                  {analytics.accuracy}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology-wise & Difficulty Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tech Performance */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Technology Performance
          </h4>
          <div className="space-y-3">
            {Object.entries(analytics.techPerformance).map(([tech, perf]) => (
              <div key={tech} className="space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{tech}</span>
                  <span className="text-cyan-400">{perf.percentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                    style={{ width: `${perf.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h4 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" /> Difficulty Level Mastery
          </h4>
          <div className="space-y-3">
            {Object.entries(analytics.difficultyPerformance).map(([diff, perf]) => (
              <div key={diff} className="space-y-1 font-mono text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{diff} Difficulty</span>
                  <span className="text-indigo-400">{perf.percentage}%</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${perf.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strengths & AI Insights Bullet Points */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4">
        <h4 className="text-base font-bold text-white flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400" /> Dynamic AI Performance Insights
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Strong Areas */}
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 space-y-2">
            <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Check className="w-4 h-4" /> Strong Technical Areas
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {analytics.strongAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weak Areas */}
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-2">
            <span className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> Recommended Areas to Practice
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {analytics.weakAreas.map((area, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rose-400">•</span>
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
