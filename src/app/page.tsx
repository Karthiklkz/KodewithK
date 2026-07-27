'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LandingHero } from '@/components/LandingHero';
import { TechSelector } from '@/components/TechSelector';
import { DifficultySelector } from '@/components/DifficultySelector';
import { InterviewCard } from '@/components/InterviewCard';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import {
  Difficulty,
  Question,
  QuestionResult,
  AnswerEvaluation,
  FinalAnalytics,
  QuestionCount,
} from '@/lib/types';
import { generateFinalAnalytics } from '@/lib/mockData';

type Step = 'landing' | 'tech' | 'difficulty' | 'interview' | 'analytics';

export default function Home() {
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // API Key state
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  // Configuration state
  const [questionCount, setQuestionCount] = useState<QuestionCount>(5);
  const [selectedTechs, setSelectedTechs] = useState<string[]>(['Python']);
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
    const storedKey = localStorage.getItem('nvidia_api_key');
    if (storedKey) setApiKey(storedKey);
  }, []);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('nvidia_api_key', key);
    } else {
      localStorage.removeItem('nvidia_api_key');
    }
  };

  const handleToggleTech = (tech: string) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const handleSelectCategory = (techs: string[]) => {
    const allPresent = techs.every((t) => selectedTechs.includes(t));
    if (allPresent) {
      setSelectedTechs((prev) => prev.filter((t) => !techs.includes(t)));
    } else {
      setSelectedTechs((prev) => Array.from(new Set([...prev, ...techs])));
    }
  };

  const handleClearAllTechs = () => {
    setSelectedTechs([]);
  };

  // Start Interview Generation with exact questionCount
  const handleStartInterview = async () => {
    setIsLoadingQuestions(true);
    const targetTechs = selectedTechs.length > 0 ? selectedTechs : ['Python', 'SQL'];

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCount,
          selectedTechs: targetTechs,
          difficulty,
          apiKey,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate interview questions');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setQuestions(data.questions);
      setCurrentIndex(0);
      setResults([]);
      setCurrentEvaluation(null);
      setCurrentStep('interview');
    } catch (error) {
      console.error('Failed to generate interview:', error);
      alert('Error initializing interview. Please check your network connection.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Evaluate candidate answer for single question
  const handleEvaluateAnswer = async (
    userAnswer: string,
    timeSpentSeconds: number
  ): Promise<AnswerEvaluation> => {
    setIsEvaluating(true);
    const currentQ = questions[currentIndex];

    try {
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

      const data = await res.json();
      const evaluation: AnswerEvaluation = data.evaluation;
      const questionResult: QuestionResult = data.questionResult;

      setCurrentEvaluation(evaluation);
      setResults((prev) => {
        const filtered = prev.filter((r) => r.question.id !== currentQ.id);
        return [...filtered, questionResult];
      });

      return evaluation;
    } catch (error) {
      console.error('Evaluation error:', error);
      const fallbackEval: AnswerEvaluation = {
        questionId: currentQ.id,
        isCorrect: false,
        score: 5,
        userAnswer,
        correctAnswer: currentQ.correctAnswer,
        explanation: currentQ.explanation,
        interviewerExpectation: 'Clear structured response.',
        commonMistakes: 'Lack of key details.',
        interviewTip: 'Focus on clear concise reasoning.',
        keywordsMatched: [],
        feedbackSummary: 'Completed',
      };
      setCurrentEvaluation(fallbackEval);
      return fallbackEval;
    } finally {
      setIsEvaluating(false);
    }
  };

  // Advance to next question OR stop immediately on exact question count completion
  const handleNextQuestion = async () => {
    setCurrentEvaluation(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Selected question count completed! Stop questions & calculate final analytics
      try {
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete',
            sessionId,
            results,
            selectedTechs,
            difficulty,
          }),
        });

        const data = await res.json();
        setFinalAnalytics(data.analytics);
      } catch (e) {
        console.error('Session complete error:', e);
        const fallbackAnalytics = generateFinalAnalytics(results, selectedTechs, difficulty);
        setFinalAnalytics(fallbackAnalytics);
      }
      setCurrentStep('analytics');
    }
  };

  // Full Purge of session data & return to Landing
  const handlePurgeAndReset = async () => {
    if (sessionId) {
      try {
        await fetch('/api/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear', sessionId }),
        });
      } catch (e) {
        console.error('Clear session error:', e);
      }
    }

    setSessionId('');
    setQuestions([]);
    setCurrentIndex(0);
    setResults([]);
    setCurrentEvaluation(null);
    setFinalAnalytics(null);
    setCurrentStep('landing');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950`}>
      {/* Particle Background */}
      <ParticleBackground />

      {/* Top Navbar with KodeWithK branding */}
      <Navbar
        currentStep={currentStep}
        onNavigateHome={handlePurgeAndReset}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasApiKey={Boolean(apiKey)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
      />

      {/* Main Body Flow */}
      <main className="flex-1 relative z-10">
        {currentStep === 'landing' && (
          <LandingHero onStart={() => setCurrentStep('tech')} />
        )}

        {currentStep === 'tech' && (
          <TechSelector
            questionCount={questionCount}
            onSelectQuestionCount={setQuestionCount}
            selectedTechs={selectedTechs}
            onToggleTech={handleToggleTech}
            onSelectCategory={handleSelectCategory}
            onClearAll={handleClearAllTechs}
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
          <InterviewCard
            question={questions[currentIndex]}
            currentIndex={currentIndex}
            totalQuestions={questions.length}
            onEvaluateAnswer={handleEvaluateAnswer}
            onPrevious={() => {
              if (currentIndex > 0) {
                setCurrentIndex((prev) => prev - 1);
                setCurrentEvaluation(null);
              }
            }}
            onNextQuestion={handleNextQuestion}
            isEvaluating={isEvaluating}
            evaluationResult={currentEvaluation}
          />
        )}

        {currentStep === 'analytics' && finalAnalytics && (
          <AnalyticsDashboard
            analytics={finalAnalytics}
            results={results}
            onAutoPurgeComplete={handlePurgeAndReset}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onClearSession={handlePurgeAndReset} />

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
