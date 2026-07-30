import { NextRequest, NextResponse } from 'next/server';
import { generateAIQuestions, extractSkillsFromResume } from '@/lib/nvidiaClient';
import { sessionStore } from '@/lib/sessionStore';
import { generateSessionId } from '@/lib/utils';
import { Difficulty, InterviewSession, QuestionCount } from '@/lib/types';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://kodewithk.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { selectedTechs, difficulty, questionCount, apiKey, resumeText } = body as {
      selectedTechs?: string[];
      difficulty: Difficulty;
      questionCount?: QuestionCount;
      apiKey?: string;
      resumeText?: string;
    };

    const cleanResume = (resumeText || '').slice(0, 15000);

    const targetTechs = selectedTechs && selectedTechs.length > 0
      ? selectedTechs
      : (cleanResume ? extractSkillsFromResume(cleanResume) : ['JavaScript', 'Python', 'SQL']);

    const targetDifficulty = difficulty || 'Medium';
    const targetCount: QuestionCount = (questionCount && [10, 15, 20, 25, 30].includes(questionCount)) ? questionCount : 10;

    let questions = [];

    // Call Python FastAPI backend service
    try {
      const pyRes = await fetch(`${PYTHON_BACKEND_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedTechs: targetTechs,
          difficulty: targetDifficulty,
          questionCount: targetCount,
          apiKey,
          resumeText: cleanResume,
        }),
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (Array.isArray(pyData.questions) && pyData.questions.length > 0) {
          questions = pyData.questions;
          console.log(`[Next.js API] Generated ${questions.length} questions via Python FastAPI Service (${PYTHON_BACKEND_URL})`);
        }
      }
    } catch (pyErr) {
      console.warn('[Next.js API] Python FastAPI service offline, calling TypeScript fallback engine');
    }

    // Fallback to TypeScript AI engine if Python server is not reachable
    if (!questions || questions.length === 0) {
      questions = await generateAIQuestions(
        targetTechs,
        targetDifficulty,
        targetCount,
        'technical',
        apiKey,
        cleanResume
      );
    }

    const sessionId = generateSessionId();
    const newSession: InterviewSession = {
      sessionId,
      selectedTechs: targetTechs,
      difficulty: targetDifficulty,
      questionCount: targetCount,
      questions,
      results: [],
      startedAt: Date.now(),
      status: 'in_progress',
    };

    // Store in temporary in-memory session cache
    sessionStore.createSession(newSession);

    return NextResponse.json({
      sessionId,
      questions,
      totalQuestions: questions.length,
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json(
      { error: 'Failed to generate interview questions.' },
      { status: 500 }
    );
  }
}
