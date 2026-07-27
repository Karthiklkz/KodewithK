'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Send,
  Code2,
  Keyboard,
  Sparkles,
  Lightbulb,
} from 'lucide-react';
import { Question, AnswerEvaluation } from '@/lib/types';
import { formatTime } from '@/lib/utils';
import { InstantFeedbackCard } from './InstantFeedbackCard';

interface InterviewCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onEvaluateAnswer: (
    userAnswer: string,
    timeSpentSeconds: number
  ) => Promise<AnswerEvaluation>;
  onPrevious: () => void;
  onNextQuestion: () => void;
  isEvaluating: boolean;
  evaluationResult?: AnswerEvaluation | null;
}

export const InterviewCard: React.FC<InterviewCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onEvaluateAnswer,
  onPrevious,
  onNextQuestion,
  isEvaluating,
  evaluationResult,
}) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Timer effect per question
  useEffect(() => {
    setTimeSpent(0);
    setUserAnswer('');

    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [question.id]);

  // Enhanced speed-focused keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Global shortcut help toggle
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Enter key flow: Next question if evaluated, else Submit if answer selected
      if (e.key === 'Enter' && !isInput) {
        e.preventDefault();
        if (evaluationResult) {
          onNextQuestion();
        } else if (!isEvaluating) {
          handleSubmit();
        }
        return;
      }

      // Space key: Skip question when not inside text area
      if (e.key === ' ' && !isInput && !evaluationResult) {
        e.preventDefault();
        onEvaluateAnswer('Skipped', timeSpent);
        return;
      }

      // MCQ option selection hotkeys: 1-4 or A-D
      if (question.type === 'mcq' && !isInput && question.options && !evaluationResult) {
        const lowerKey = e.key.toLowerCase();
        let idx = -1;

        if (['1', '2', '3', '4'].includes(e.key)) {
          idx = parseInt(e.key) - 1;
        } else if (['a', 'b', 'c', 'd'].includes(lowerKey)) {
          idx = ['a', 'b', 'c', 'd'].indexOf(lowerKey);
        }

        if (idx >= 0 && question.options[idx]) {
          setUserAnswer(question.options[idx]);
        }
      }

      // True/False selection hotkeys: T or F
      if (question.type === 'true_false' && !isInput && !evaluationResult) {
        if (e.key.toLowerCase() === 't') setUserAnswer('True');
        if (e.key.toLowerCase() === 'f') setUserAnswer('False');
      }

      // Ctrl+Enter for text input submission
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && isInput) {
        e.preventDefault();
        if (!evaluationResult && !isEvaluating) {
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, evaluationResult, isEvaluating, userAnswer, timeSpent, onNextQuestion]);

  const handleSubmit = async () => {
    await onEvaluateAnswer(userAnswer || 'Skipped', timeSpent);
  };

  const progressPercentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header Controls & Progress */}
      <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-4 sm:p-5 rounded-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Question Badge Counter */}
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
              Question {currentIndex + 1} / {totalQuestions}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
              {question.technology}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-mono text-xs">
              {question.difficulty}
            </span>
          </div>

          {/* Right Timer & Shortcuts Trigger */}
          <div className="flex items-center gap-3">
            {/* Live Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Time: {formatTime(timeSpent)}</span>
            </div>

            {/* Keyboard Shortcuts Button */}
            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white font-mono text-xs"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[11px]">Hotkeys</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Question Card Container */}
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />

        {/* Question Text */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Format: {question.type.replace('_', ' ')}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
            {question.question}
          </h3>


          {/* Scenario Context if present */}
          {question.scenarioContext && (
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 font-mono space-y-1">
              <span className="text-amber-400 font-bold">Scenario Context:</span>
              <p>{question.scenarioContext}</p>
            </div>
          )}

          {/* Code Snippet if present */}
          {question.codeSnippet && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto font-mono text-xs text-cyan-300">
              <div className="flex items-center justify-between text-slate-500 text-[10px] pb-2 border-b border-slate-800/80 mb-2">
                <span className="flex items-center gap-1">
                  <Code2 className="w-3 h-3 text-cyan-400" /> Code Snippet
                </span>
                <span>{question.technology}</span>
              </div>
              <pre>{question.codeSnippet}</pre>
            </div>
          )}
        </div>

        {/* Input Interface depending on question.type */}
        {!evaluationResult && (
          <div className="space-y-4 pt-2">
            {/* MCQ Options */}
            {question.type === 'mcq' && question.options && (
              <div className="grid grid-cols-1 gap-3">
                {question.options.map((opt, idx) => {
                  const isSelected = userAnswer === opt;
                  const keyLetters = ['A', 'B', 'C', 'D'];
                  return (
                    <button
                      key={idx}
                      onClick={() => setUserAnswer(opt)}
                      className={`p-4 rounded-xl border text-left font-mono text-sm transition-all duration-200 flex items-center justify-between group ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border-cyan-500/60 text-white shadow-md shadow-cyan-500/10'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="pr-4">{opt}</span>
                      <div className="flex items-center gap-1 shrink-0 text-xs">
                        <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold">
                          {keyLetters[idx]} / {idx + 1}
                        </kbd>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* True / False Toggle Buttons */}
            {question.type === 'true_false' && (
              <div className="grid grid-cols-2 gap-4">
                {['True', 'False'].map((val) => {
                  const isSelected = userAnswer.toLowerCase() === val.toLowerCase();
                  const keyShortcut = val === 'True' ? 'T' : 'F';
                  return (
                    <button
                      key={val}
                      onClick={() => setUserAnswer(val)}
                      className={`p-5 rounded-xl border text-center font-mono font-bold text-base transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{val}</span>
                      <kbd className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                        Key [{keyShortcut}]
                      </kbd>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Text / Scenario / Free Form Input */}
            {question.type !== 'mcq' && question.type !== 'true_false' && (
              <div className="space-y-2">
                <textarea
                  rows={5}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your technical explanation or solution here... (Mention core principles, syntax, edge cases, and trade-offs)"
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono text-sm leading-relaxed transition-all"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-500">
                  <span>Press <kbd className="text-cyan-400">Ctrl + Enter</kbd> to submit answer</span>
                  <span>{userAnswer.length} characters</span>
                </div>
              </div>
            )}

            {/* Submit & Navigation Bar */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
              <button
                onClick={onPrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-mono disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onEvaluateAnswer('Skipped', timeSpent)}
                  className="px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-mono transition-colors flex items-center gap-1.5"
                >
                  <span>Skip</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-900 border border-slate-700 text-slate-400 rounded">
                    Space
                  </kbd>
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={isEvaluating}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Evaluating Answer...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Answer</span>
                      <kbd className="px-1.5 py-0.5 text-[10px] bg-cyan-700/50 border border-cyan-400 text-white rounded font-mono">
                        Enter
                      </kbd>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Render Instant Feedback Component if Answer Submitted */}
      {evaluationResult && (
        <InstantFeedbackCard
          question={question}
          evaluation={evaluationResult}
          onNextQuestion={onNextQuestion}
          isLastQuestion={currentIndex === totalQuestions - 1}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-cyan-400" /> Speed Hotkey Guide
              </h4>
              <button
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Keys 1 - 4 or A - D</span>
                <span className="text-cyan-400">Select MCQ Options</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Keys T / F</span>
                <span className="text-cyan-400">Select True / False</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Enter</span>
                <span className="text-cyan-400">Submit Answer / Next Question</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Space</span>
                <span className="text-cyan-400">Skip Question</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Ctrl + Enter</span>
                <span className="text-cyan-400">Submit Text Response</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">?</span>
                <span className="text-cyan-400">Toggle Shortcuts Guide</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
