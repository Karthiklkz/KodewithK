import { NextRequest, NextResponse } from 'next/server';
import { evaluateAIAnswer } from '@/lib/nvidiaClient';
import { sessionStore } from '@/lib/sessionStore';
import { Question, QuestionResult, AnswerEvaluation } from '@/lib/types';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://kodewithk.onrender.com';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, question, userAnswer, timeSpentSeconds, apiKey } = body as {
      sessionId: string;
      question: Question;
      userAnswer: string;
      timeSpentSeconds: number;
      apiKey?: string;
    };

    if (!question || !sessionId) {
      return NextResponse.json({ error: 'Missing required evaluation payload' }, { status: 400 });
    }

    let evaluation: AnswerEvaluation | null = null;

    // Call Python FastAPI backend service
    try {
      const pyRes = await fetch(`${PYTHON_BACKEND_URL}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          userAnswer,
          apiKey,
        }),
      });

      if (pyRes.ok) {
        const pyData = await pyRes.json();
        if (pyData.evaluation) {
          evaluation = pyData.evaluation;
        }
      }
    } catch (pyErr) {
      console.warn('[Next.js API] Python FastAPI evaluate offline, using TS engine');
    }

    if (!evaluation) {
      evaluation = await evaluateAIAnswer(question, userAnswer, apiKey);
    }

    const questionResult: QuestionResult = {
      question,
      userAnswer: userAnswer || 'Skipped',
      evaluation,
      timeSpentSeconds: timeSpentSeconds || 0,
    };

    // Update in-memory session store
    const existingSession = sessionStore.getSession(sessionId);
    if (existingSession) {
      const filteredResults = existingSession.results.filter(
        (r) => r.question.id !== question.id
      );
      filteredResults.push(questionResult);
      sessionStore.updateSession(sessionId, { results: filteredResults });
    }

    return NextResponse.json({
      evaluation,
      questionResult,
    });
  } catch (error) {
    console.error('Error in /api/evaluate:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate candidate answer.' },
      { status: 500 }
    );
  }
}
