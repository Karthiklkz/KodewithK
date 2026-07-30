export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';
export type QuestionCount = 10 | 15 | 20 | 25 | 30;
export type InterviewMode = 'technical' | 'hr';

export type QuestionType = 
  | 'text'
  | 'mcq'
  | 'true_false'
  | 'scenario'
  | 'debugging'
  | 'code_output'
  | 'fill_blanks';

export interface Question {
  id: string;
  question: string;
  type: QuestionType;
  difficulty: Difficulty;
  technology: string;
  options?: string[]; // for mcq
  correctAnswer: string;
  explanation: string;
  keywords: string[];
  codeSnippet?: string;
  scenarioContext?: string;
}

export interface AnswerEvaluation {
  questionId: string;
  isCorrect: boolean;
  score: number; // 0 to 10
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  interviewerExpectation: string;
  commonMistakes: string;
  interviewTip: string;
  keywordsMatched: string[];
  feedbackSummary: string;
}

export interface QuestionResult {
  question: Question;
  userAnswer: string;
  evaluation: AnswerEvaluation;
  timeSpentSeconds: number;
}

export interface InterviewSession {
  sessionId: string;
  interviewMode?: InterviewMode;
  selectedTechs: string[];
  difficulty: Difficulty;
  questionCount: QuestionCount;
  questions: Question[];
  results: QuestionResult[];
  startedAt: number;
  completedAt?: number;
  status: 'configuring' | 'in_progress' | 'completed';
}

export interface FinalAnalytics {
  totalScore: number;
  maxScore: number;
  percentage: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  accuracy: number; // 0 - 100%
  totalTimeSeconds: number;
  avgTimePerQuestion: number;
  performanceRating: 'Interview Ready' | 'Excellent' | 'Good' | 'Needs Improvement';
  hiringRecommendation: string;
  summary: string;
  strongAreas: string[];
  weakAreas: string[];
  techPerformance: Record<string, { total: number; score: number; percentage: number }>;
  difficultyPerformance: Record<string, { total: number; score: number; percentage: number }>;
  performanceInsights: string[];
}

export interface CategoryTechMap {
  category: string;
  icon: string;
  techs: string[];
}
