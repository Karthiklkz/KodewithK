'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { AnswerEvaluation, Question } from '@/lib/types';

interface InstantFeedbackCardProps {
  question: Question;
  evaluation: AnswerEvaluation;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

export const InstantFeedbackCard: React.FC<InstantFeedbackCardProps> = ({
  question,
  evaluation,
  onNextQuestion,
  isLastQuestion,
}) => {
  const isCorrect = evaluation.isCorrect;
  const score = evaluation.score;
  const hasCommonMistakes = Boolean(
    evaluation.commonMistakes && evaluation.commonMistakes.trim().length > 0
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl"
    >
      {/* Top Banner Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          {isCorrect ? (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="w-7 h-7" />
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <XCircle className="w-7 h-7" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`font-extrabold text-lg ${
                  isCorrect ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isCorrect ? '✅ Correct Answer' : '⚠️ Incorrect / Partial Answer'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Semantic AI Evaluation Complete
            </p>
          </div>
        </div>

        {/* Score Gained Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Award className="w-5 h-5 text-amber-400" />
          <span className="text-sm font-mono text-slate-400">Score Gained:</span>
          <span className="text-lg font-black font-mono text-cyan-400">
            {score} / 10 Points
          </span>
        </div>
      </div>

      {/* Comparison Grid: Candidate Answer vs Model Answer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Your Answer */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>Your Submitted Answer</span>
          </div>
          <p className="text-sm text-slate-200 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {evaluation.userAnswer || 'No response provided (Skipped)'}
          </p>
        </div>

        {/* Ideal Reference Answer */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Expected Technical Answer</span>
          </div>
          <p className="text-sm text-emerald-300 font-mono leading-relaxed bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
            {evaluation.correctAnswer}
          </p>
        </div>
      </div>

      {/* Detailed Explanation Breakdown */}
      <div className="space-y-4 pt-2">
        {/* Concept Explanation */}
        <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-900/40 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Detailed Concept Explanation</span>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            {evaluation.explanation}
          </p>
        </div>

        {/* Common Mistakes (Clean full-width card shown only if relevant/present) */}
        {hasCommonMistakes && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
              <AlertTriangle className="w-4 h-4" />
              <span>Common Pitfalls & Mistakes to Avoid</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              {evaluation.commonMistakes}
            </p>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Keywords Matched:</span>
          <div className="flex flex-wrap gap-1">
            {evaluation.keywordsMatched.map((kw, i) => (
              <span
                key={i}
                className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded text-[10px]"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={onNextQuestion}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform"
        >
          <span>{isLastQuestion ? 'View Final Analytics' : 'Next Question'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
