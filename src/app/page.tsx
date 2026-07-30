'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { LandingHero } from '@/components/LandingHero';
import { TechSelector } from '@/components/TechSelector';
import { DifficultySelector } from '@/components/DifficultySelector';
import { InterviewCard } from '@/components/InterviewCard';
import { InstantFeedbackCard } from '@/components/InstantFeedbackCard';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { ParticleBackground } from '@/components/ParticleBackground';
import { ResumeQA } from '@/components/ResumeQA';

import {
  Question,
  QuestionResult,
  Difficulty,
  AnswerEvaluation,
  FinalAnalytics,
  QuestionCount,
} from '@/lib/types';
import { generateAIQuestions, evaluateAIAnswer, extractSkillsFromResume } from '@/lib/nvidiaClient';

const RENDER_BACKEND_URL = 'https://kodewithk.onrender.com';

export default function Home() {
  // Navigation step state
  const [currentStep, setCurrentStep] = useState<
    'landing' | 'tech' | 'difficulty' | 'interview' | 'analytics' | 'resumeQA'
  >('landing');

  // UI & Theme state
  const theme = 'dark';
  const [apiKey, setApiKey] = useState<string>(process.env.NEXT_PUBLIC_GROQ_API_KEY || '');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Configuration state
  const [questionCount, setQuestionCount] = useState<QuestionCount>(10);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(['Python']);

  // Suppress Next.js / React DevTools console prompts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalConsoleInfo = console.info;
      console.info = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('React DevTools')) {
          return;
        }
        originalConsoleInfo(...args);
      };

      const originalConsoleLog = console.log;
      console.log = (...args) => {
        if (
          args[0] &&
          typeof args[0] === 'string' &&
          (args[0].includes('React DevTools') || args[0].includes('Download the React DevTools'))
        ) {
          return;
        }
        originalConsoleLog(...args);
      };
    }
  }, []);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');

  // Interview execution state
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<AnswerEvaluation | null>(null);

  // Final analytics state
  const [finalAnalytics, setFinalAnalytics] = useState<FinalAnalytics | null>(null);

  // Load stored API key if exists in localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem('groq_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKey(process.env.NEXT_PUBLIC_GROQ_API_KEY || '');
    }
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('groq_api_key', key);
    } else {
      localStorage.removeItem('groq_api_key');
    }
  };



  // Start interview generation process
  const handleStartInterview = async (resumeContent?: string) => {
    setIsLoadingQuestions(true);
    
    let targetTechs = selectedTechs.length > 0 ? selectedTechs : ['Python'];
    if (resumeContent) {
      const extracted = extractSkillsFromResume(resumeContent);
      setSelectedTechs(extracted);
      targetTechs = extracted;
    }

    let questionsList: Question[] = [];
    let newSessionId = `session_${Date.now()}`;

    try {
      // 1. Try Next.js internal API route first
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCount,
          selectedTechs: resumeContent ? [] : targetTechs,
          difficulty,
          apiKey,
          resumeText: resumeContent,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        newSessionId = data.sessionId || newSessionId;
        questionsList = data.questions || [];
      }
    } catch (e) {
      console.warn('Next.js API route failed, trying direct Render backend...');
    }

    // 2. Direct Render backend fallback for static hosting environment
    if (!questionsList || questionsList.length === 0) {
      try {
        const pyRes = await fetch(`${RENDER_BACKEND_URL}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectedTechs: resumeContent ? [] : targetTechs,
            difficulty,
            questionCount,
            apiKey,
            resumeText: resumeContent,
          }),
        });

        if (pyRes.ok) {
          const pyData = await pyRes.json();
          questionsList = pyData.questions || [];
        }
      } catch (pyErr) {
        console.warn('Render backend failed, using dynamic local fallback...');
      }
    }

    // 3. Client dynamic engine fallback if network offline
    if (!questionsList || questionsList.length === 0) {
      questionsList = await generateAIQuestions(
        targetTechs,
        difficulty,
        questionCount,
        'technical',
        apiKey,
        resumeContent
      );
    }

    setSessionId(newSessionId);
    setQuestions(questionsList);
    setCurrentIndex(0);
    setResults([]);
    setCurrentEvaluation(null);
    setCurrentStep('interview');
    setIsLoadingQuestions(false);
  };

  // Evaluate candidate answer for single question
  const handleEvaluateAnswer = async (
    userAnswer: string,
    timeSpentSeconds: number
  ): Promise<AnswerEvaluation> => {
    setIsEvaluating(true);
    const currentQ = questions[currentIndex];
    let evaluation: AnswerEvaluation | null = null;
    let questionResult: QuestionResult | null = null;

    try {
      // 1. Try Next.js API route
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          question: currentQ,
          userAnswer,
          timeSpentSeconds,
          apiKey,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        evaluation = data.evaluation;
        questionResult = data.questionResult;
      }
    } catch (e) {
      console.warn('Next.js evaluate route failed, trying direct Render backend...');
    }

    // 2. Direct Render backend fallback
    if (!evaluation) {
      try {
        const pyRes = await fetch(`${RENDER_BACKEND_URL}/evaluate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: currentQ,
            userAnswer,
            apiKey,
          }),
        });

        if (pyRes.ok) {
          const pyData = await pyRes.json();
          evaluation = pyData.evaluation;
        }
      } catch (pyErr) {
        console.warn('Render evaluate failed, using local client evaluator...');
      }
    }

    // 3. Client evaluator fallback
    if (!evaluation) {
      evaluation = await evaluateAIAnswer(currentQ, userAnswer, apiKey);
    }

    if (!questionResult) {
      questionResult = {
        question: currentQ,
        userAnswer: userAnswer || 'Skipped',
        evaluation,
        timeSpentSeconds,
      };
    }

    setCurrentEvaluation(evaluation);
    setResults((prev) => {
      const filtered = prev.filter((r) => r.question.id !== currentQ.id);
      return [...filtered, questionResult!];
    });

    setIsEvaluating(false);
    return evaluation;
  };

  // Handle navigating to next question or completing interview
  const handleNextQuestion = () => {
    setCurrentEvaluation(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishInterview();
    }
  };

  // Finish interview and calculate final analytics
  const finishInterview = () => {
    const totalQuestions = questions.length;
    const correctCount = results.filter((r) => r.evaluation.isCorrect).length;
    const incorrectCount = totalQuestions - correctCount;
    const totalScore = results.reduce((acc, r) => acc + r.evaluation.score, 0);
    const maxScore = totalQuestions * 10;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const totalTimeSeconds = results.reduce((acc, r) => acc + r.timeSpentSeconds, 0);
    const avgTimePerQuestion = totalQuestions > 0 ? Math.round(totalTimeSeconds / totalQuestions) : 0;

    const rating: 'Interview Ready' | 'Excellent' | 'Good' | 'Needs Improvement' =
      percentage >= 85
        ? 'Interview Ready'
        : percentage >= 70
        ? 'Excellent'
        : percentage >= 50
        ? 'Good'
        : 'Needs Improvement';

    const techPerf: Record<string, { total: number; score: number; percentage: number }> = {};
    results.forEach((r) => {
      const tech = r.question.technology || 'General';
      if (!techPerf[tech]) {
        techPerf[tech] = { total: 0, score: 0, percentage: 0 };
      }
      techPerf[tech].total += 1;
      techPerf[tech].score += r.evaluation.score;
      techPerf[tech].percentage = Math.round((techPerf[tech].score / (techPerf[tech].total * 10)) * 100);
    });

    const diffPerf: Record<string, { total: number; score: number; percentage: number }> = {};
    results.forEach((r) => {
      const diff = r.question.difficulty || 'Medium';
      if (!diffPerf[diff]) {
        diffPerf[diff] = { total: 0, score: 0, percentage: 0 };
      }
      diffPerf[diff].total += 1;
      diffPerf[diff].score += r.evaluation.score;
      diffPerf[diff].percentage = Math.round((diffPerf[diff].score / (diffPerf[diff].total * 10)) * 100);
    });

    const analytics: FinalAnalytics = {
      totalScore,
      maxScore,
      percentage,
      correctCount,
      incorrectCount,
      skippedCount: 0,
      accuracy: percentage,
      totalTimeSeconds,
      avgTimePerQuestion,
      performanceRating: rating,
      hiringRecommendation:
        percentage >= 80
          ? 'Strong Hire — Demonstrates technical depth and structured problem solving.'
          : percentage >= 60
          ? 'Consider — Solid core understanding with minor technical gaps.'
          : 'Needs Practice — Review core concepts and syntax.',
      summary: `Completed ${totalQuestions} questions across ${selectedTechs.join(', ')} with an overall score of ${percentage}%.`,
      strongAreas: [
        'Demonstrated foundational principles',
        'Structured technical explanations',
      ],
      weakAreas: [
        'Practice concise time management for complex scenarios',
        'Elaborate with concrete syntax examples',
      ],
      techPerformance: techPerf,
      difficultyPerformance: diffPerf,
      performanceInsights: [
        `Average speed per question: ${avgTimePerQuestion} seconds`,
        `Overall accuracy rating: ${percentage}%`,
      ],
    };

    setFinalAnalytics(analytics);
    setCurrentStep('analytics');
  };

  // Restart interview
  const handleRestart = () => {
    setQuestions([]);
    setResults([]);
    setCurrentIndex(0);
    setCurrentEvaluation(null);
    setFinalAnalytics(null);
    setCurrentStep('tech');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-950 text-slate-100">
      {/* Background Particles Visual FX */}
      <ParticleBackground theme="dark" />

      {/* Top Navbar */}
      <Navbar
        currentStep={currentStep}
        onNavigateHome={() => setCurrentStep('landing')}
        onNavigateToResumeQA={() => setCurrentStep('resumeQA')}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey)}
        apiKey={apiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col justify-center">
        {currentStep === 'landing' && (
          <LandingHero 
            onStart={() => setCurrentStep('tech')} 
            onStartResumeQA={() => setCurrentStep('resumeQA')}
          />
        )}

        {currentStep === 'tech' && (
          <TechSelector
            questionCount={questionCount}
            onSelectQuestionCount={setQuestionCount}
            selectedTechs={selectedTechs}
            onToggleTech={(t) =>
              setSelectedTechs((prev) =>
                prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
              )
            }
            onSelectCategory={(techs) => setSelectedTechs(techs)}
            onClearAll={() => setSelectedTechs([])}
            onNext={() => setCurrentStep('difficulty')}
          />
        )}

        {currentStep === 'difficulty' && (
          <DifficultySelector
            selectedDifficulty={difficulty}
            onSelectDifficulty={setDifficulty}
            questionCount={questionCount}
            onBack={() => setCurrentStep('tech')}
            onStartInterview={handleStartInterview}
            isLoading={isLoadingQuestions}
          />
        )}

        {currentStep === 'interview' && questions.length > 0 && (
          <div className="space-y-6 max-w-4xl mx-auto w-full">
            <InterviewCard
              question={questions[currentIndex]}
              currentIndex={currentIndex}
              totalQuestions={questions.length}
              onEvaluateAnswer={handleEvaluateAnswer}
              onPrevious={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              onNextQuestion={handleNextQuestion}
              isEvaluating={isEvaluating}
              evaluationResult={currentEvaluation}
            />
          </div>
        )}

        {currentStep === 'analytics' && finalAnalytics && (
          <AnalyticsDashboard
            analytics={finalAnalytics}
            results={results}
            onAutoPurgeComplete={handleRestart}
          />
        )}

        {currentStep === 'resumeQA' && (
          <ResumeQA 
            apiKey={apiKey} 
            onStartResumeInterview={(resumeText) => handleStartInterview(resumeText)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onClearSession={handleRestart} />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        currentApiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
