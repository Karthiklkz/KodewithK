import { NextRequest, NextResponse } from 'next/server';
import { sessionStore } from '@/lib/sessionStore';
import { generateFinalAnalytics } from '@/lib/mockData';
import { QuestionResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, results, selectedTechs, difficulty } = body;

    if (action === 'complete') {
      const session = sessionStore.getSession(sessionId);
      const resultsToUse: QuestionResult[] = results || session?.results || [];
      const techList: string[] = selectedTechs || session?.selectedTechs || ['General Tech'];
      const diff = difficulty || session?.difficulty || 'Medium';

      const analytics = generateFinalAnalytics(resultsToUse, techList, diff);

      sessionStore.saveAnalytics(sessionId, analytics);
      sessionStore.updateSession(sessionId, { status: 'completed', completedAt: Date.now() });

      // Schedule auto-deletion after 30 seconds
      sessionStore.scheduleAutoDelete(sessionId, 30);

      return NextResponse.json({
        success: true,
        analytics,
        autoDeleteScheduledSeconds: 30,
      });
    }

    if (action === 'clear' || action === 'delete') {
      sessionStore.deleteSession(sessionId);
      return NextResponse.json({ success: true, message: `Session ${sessionId} deleted from runtime memory.` });
    }

    if (action === 'clear_all') {
      sessionStore.clearAll();
      return NextResponse.json({ success: true, message: 'All in-memory interview session data cleared.' });
    }

    return NextResponse.json({ error: 'Invalid session action' }, { status: 400 });
  } catch (error) {
    console.error('Error in /api/session:', error);
    return NextResponse.json({ error: 'Session management error' }, { status: 500 });
  }
}
