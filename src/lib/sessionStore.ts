import { InterviewSession, FinalAnalytics } from './types';

// In-memory runtime session cache
interface StoredSessionData {
  session: InterviewSession;
  analytics?: FinalAnalytics;
  createdAt: number;
  autoDeleteTimer?: NodeJS.Timeout;
}

class SessionStore {
  private sessions: Map<string, StoredSessionData> = new Map();

  public createSession(session: InterviewSession): InterviewSession {
    this.sessions.set(session.sessionId, {
      session,
      createdAt: Date.now(),
    });
    return session;
  }

  public getSession(sessionId: string): InterviewSession | undefined {
    return this.sessions.get(sessionId)?.session;
  }

  public updateSession(sessionId: string, updated: Partial<InterviewSession>): InterviewSession | undefined {
    const existing = this.sessions.get(sessionId);
    if (!existing) return undefined;

    const newSession = { ...existing.session, ...updated };
    this.sessions.set(sessionId, {
      ...existing,
      session: newSession,
    });
    return newSession;
  }

  public saveAnalytics(sessionId: string, analytics: FinalAnalytics): void {
    const existing = this.sessions.get(sessionId);
    if (existing) {
      existing.analytics = analytics;
    }
  }

  public getAnalytics(sessionId: string): FinalAnalytics | undefined {
    return this.sessions.get(sessionId)?.analytics;
  }

  public deleteSession(sessionId: string): boolean {
    const existing = this.sessions.get(sessionId);
    if (existing?.autoDeleteTimer) {
      clearTimeout(existing.autoDeleteTimer);
    }
    return this.sessions.delete(sessionId);
  }

  public scheduleAutoDelete(sessionId: string, seconds: number = 30): void {
    const existing = this.sessions.get(sessionId);
    if (!existing) return;

    if (existing.autoDeleteTimer) {
      clearTimeout(existing.autoDeleteTimer);
    }

    existing.autoDeleteTimer = setTimeout(() => {
      console.log(`[SessionStore] Auto-deleting session ${sessionId} after ${seconds} seconds.`);
      this.sessions.delete(sessionId);
    }, seconds * 1000);
  }

  public clearAll(): void {
    for (const [id, item] of this.sessions.entries()) {
      if (item.autoDeleteTimer) {
        clearTimeout(item.autoDeleteTimer);
      }
    }
    this.sessions.clear();
  }

  public activeCount(): number {
    return this.sessions.size;
  }
}

// Global instance (persists across hot reloads in dev mode)
const globalStore = global as unknown as { __sessionStore?: SessionStore };
export const sessionStore = globalStore.__sessionStore || new SessionStore();
if (process.env.NODE_ENV !== 'production') {
  globalStore.__sessionStore = sessionStore;
}
