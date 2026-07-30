'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Code2,
  BrainCircuit,
  Target,
  Zap,
  CheckCircle2,
  Layers,
  Terminal,
  Users,
  Quote,
  FileText,
} from 'lucide-react';
import { TECH_CATEGORIES, HR_CATEGORIES } from '@/lib/mockData';

interface LandingHeroProps {
  onStart: () => void;
  onStartResumeQA: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStart, onStartResumeQA }) => {
  // Typing animation text phrases
  const phrases = [
    'Master Technical Coding & Behavioral Interviews',
    'Get Real-Time Semantic AI Evaluation',
    'Custom Session Lengths & Instant Feedback',
    'Practice Python, React, System Design, STAR & Leadership',
  ];

  const [currentPhraseIdx, setCurrentPhraseIdx] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIdx];
    let speed = isDeleting ? 30 : 60;

    if (!isDeleting && displayedText === currentPhrase) {
      const timeout = setTimeout(() => setIsDeleting(true), 2200);
      return () => clearTimeout(timeout);
    } else if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setCurrentPhraseIdx((prev) => (prev + 1) % phrases.length);
      return;
    }

    const timer = setTimeout(() => {
      setDisplayedText((prev) =>
        isDeleting
          ? currentPhrase.substring(0, prev.length - 1)
          : currentPhrase.substring(0, prev.length + 1)
      );
    }, speed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentPhraseIdx]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Hero Container */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Heading & Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7 text-center lg:text-left space-y-6"
          >
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono shadow-lg shadow-cyan-500/10">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>KodeWithK • Premier AI Interview Simulator</span>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                PRO
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
              Ace Every Interview <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
                with KodeWithK AI
              </span>
            </h1>

            {/* Dynamic Typing Animation Box */}
            <div className="h-12 flex items-center justify-center lg:justify-start">
              <p className="text-lg sm:text-xl font-mono text-slate-300 flex items-center gap-1">
                <Terminal className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>{displayedText}</span>
                <span className="w-2 h-5 bg-cyan-400 animate-pulse inline-block" />
              </p>
            </div>

            {/* Descriptive Subtitle */}
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Welcome to <strong className="text-white font-bold">KodeWithK</strong>. Elevate your preparation with AI-generated technical and behavioral interviews. Experience interactive MCQs, instant semantic grading, deep explanations, and complete session privacy.
            </p>

            {/* Motivational Quote Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30 flex items-start gap-3 backdrop-blur-md shadow-lg">
              <Quote className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs sm:text-sm italic text-slate-200 font-serif leading-relaxed">
                  &ldquo;Success is where preparation and opportunity meet. Practice with purpose, command every question, and claim your dream role.&rdquo;
                </p>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold block mt-1">
                  — KodeWithK Career Motto
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onStart}
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 transition-all duration-300 focus:outline-none"
              >
                <span>Start Interview Now</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onStartResumeQA}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-300 hover:text-white font-bold text-base backdrop-blur-md transition-all duration-300 hover:scale-105"
              >
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Upload Resume & Chat</span>
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-sm backdrop-blur-md transition-all duration-300 hover:bg-slate-800/60"
              >
                <span>How It Works</span>
              </button>

              <button
                onClick={() => scrollToSection('supported-tech')}
                className="inline-flex items-center gap-2 px-5 py-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-medium text-sm backdrop-blur-md transition-all duration-300 hover:bg-slate-800/60"
              >
                <Code2 className="w-4 h-4 text-cyan-400" />
                <span>Explore Topics</span>
              </button>
            </div>

            {/* Feature Check Highlights */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Custom Question Session</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>High MCQ Ratio & Fast Input</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Technical Interview Tracks</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Floating Cards Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-5 relative"
          >
            <div className="relative mx-auto max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl shadow-cyan-500/10 space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs text-slate-400 font-mono ml-2">Question 1 / 5</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-mono">
                  KodeWithK • MCQ
                </span>
              </div>

              {/* Sample Question */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-slate-200">
                  What is the primary objective of using the STAR method in behavioral interviews?
                </h4>
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="p-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-200">
                    A. Structure Situation, Task, Action, and Result
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400">
                    B. Skip details and give one-word answers
                  </div>
                </div>
              </div>

              {/* AI Evaluation Snapshot */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>AI Semantic Evaluation</span>
                  <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                    10/10 Points
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  The STAR technique provides structured evidence of past performance and leadership impact.
                </p>
              </div>

              {/* Floating Decorative Badges */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -top-6 -right-6 bg-slate-900 border border-cyan-500/40 p-3 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-3"
              >
                <BrainCircuit className="w-6 h-6 text-cyan-400" />
                <div>
                  <p className="text-xs font-bold text-white">Advanced AI Engine</p>
                  <p className="text-[10px] text-slate-400">Instant AI Grading</p>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-6 -left-6 bg-slate-900 border border-indigo-500/40 p-3 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-3"
              >
                <Users className="w-6 h-6 text-indigo-400" />
                <div>
                  <p className="text-xs font-bold text-white">Technical Interview Tracks</p>
                  <p className="text-[10px] text-slate-400">Customizable Sessions</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/60">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            How KodeWithK Works
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            4 simple steps to prepare for your next technical coding or HR interview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Track & Length Setup',
              desc: 'Select Technical or HR track and configure your preferred question count.',
              icon: Layers,
              color: 'text-cyan-400',
              bg: 'bg-cyan-500/10 border-cyan-500/20',
            },
            {
              step: '02',
              title: 'Difficulty Level',
              desc: 'Select Easy, Medium, Hard, or Expert level aligned with your experience tier.',
              icon: Target,
              color: 'text-indigo-400',
              bg: 'bg-indigo-500/10 border-indigo-500/20',
            },
            {
              step: '03',
              title: 'Interactive Question Runner',
              desc: 'Answer MCQs, True/False, and scenarios with keyboard shortcuts.',
              icon: Terminal,
              color: 'text-teal-400',
              bg: 'bg-teal-500/10 border-teal-500/20',
            },
            {
              step: '04',
              title: 'Scorecard & Auto-Purge',
              desc: 'Complete your interview round, review analytics, and auto-delete session data.',
              icon: Zap,
              color: 'text-amber-400',
              bg: 'bg-amber-500/10 border-amber-500/20',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -5 }}
              className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl relative overflow-hidden backdrop-blur-sm group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl border ${item.bg}`}>
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <span className="text-2xl font-black font-mono text-slate-700 group-hover:text-slate-500 transition-colors">
                  {item.step}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Technologies Section */}
      <section id="supported-tech" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800/60">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Available Interview Topics
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Choose from Technical Engineering stacks and HR Behavioral tracks.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...TECH_CATEGORIES, ...HR_CATEGORIES].map((cat, idx) => (
            <div
              key={idx}
              className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-slate-700 transition-all"
            >
              <h4 className="text-sm font-bold text-cyan-400 font-mono tracking-wider uppercase">
                {cat.category}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {cat.techs.map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 font-mono hover:text-white hover:border-cyan-500/40 transition-colors"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-16 bg-gradient-to-r from-cyan-900/40 via-slate-900 to-indigo-900/40 border border-cyan-500/30 rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-white">
              Ready for Your Next Interview?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base">
              Start your customized KodeWithK interview session now.
            </p>
            <button
              onClick={onStart}
              className="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-base shadow-xl shadow-cyan-500/20 hover:scale-105 transition-transform"
            >
              <span>Configure Interview</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
