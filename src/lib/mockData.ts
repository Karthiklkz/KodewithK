import { Question, Difficulty, QuestionType, AnswerEvaluation, FinalAnalytics, QuestionResult, QuestionCount, InterviewMode } from './types';

export const TECH_CATEGORIES = [
  {
    category: 'Frontend',
    icon: 'Layout',
    techs: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Angular', 'Vue'],
  },
  {
    category: 'Backend',
    icon: 'Server',
    techs: ['Node.js', 'Express', 'FastAPI', 'Django', 'Flask', 'Laravel', 'Spring Boot'],
  },
  {
    category: 'Programming',
    icon: 'Code2',
    techs: ['Python', 'Java', 'C', 'C++', 'C#', 'Go', 'Rust', 'Kotlin'],
  },
  {
    category: 'Database',
    icon: 'Database',
    techs: ['SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis'],
  },
  {
    category: 'Cloud',
    icon: 'Cloud',
    techs: ['AWS', 'Azure', 'GCP'],
  },
  {
    category: 'Data Engineering',
    icon: 'Cpu',
    techs: ['PySpark', 'Hadoop', 'Hive', 'Kafka', 'Databricks'],
  },
  {
    category: 'AI & ML',
    icon: 'BrainCircuit',
    techs: [
      'Machine Learning',
      'Deep Learning',
      'Generative AI',
      'Prompt Engineering',
      'LangChain',
      'LlamaIndex',
      'Vector Database',
      'RAG',
      'Transformers',
      'LLM',
      'OpenAI',
      'NVIDIA AI',
      'Embeddings',
    ],
  },
  {
    category: 'DevOps & Infrastructure',
    icon: 'Wrench',
    techs: ['Git', 'Docker', 'Kubernetes', 'Linux', 'REST API', 'GraphQL', 'JSON', 'CI/CD'],
  },
  {
    category: 'Behavioral & HR Skills',
    icon: 'Users',
    techs: ['STAR Method', 'Leadership', 'Conflict Resolution', 'Communication', 'Teamwork', 'Work Ethics', 'Problem Solving', 'Project Deadlines'],
  },
];

export const HR_CATEGORIES = TECH_CATEGORIES.slice(-1);

const HR_SKILLS_SET = new Set([
  'STAR Method', 'Leadership', 'Conflict Resolution', 'Communication',
  'Teamwork', 'Work Ethics', 'Problem Solving', 'Project Deadlines',
  'HR & Behavioral Leadership', 'HR'
]);

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateMockQuestions(
  techs: string[],
  difficulty: Difficulty,
  questionCount: number = 5,
  mode: InterviewMode = 'technical'
): Question[] {
  const questions: Question[] = [];
  const selectedTechList = techs.length > 0 ? techs : ['JavaScript', 'Python', 'SQL'];
  
  // Calculate 80% MCQ / 20% Typing ratio
  const typingCount = Math.max(1, Math.round(questionCount * 0.2));
  const typingIndices = new Set<number>();
  for (let t = 0; t < typingCount; t++) {
    const idx = Math.floor(((t + 1) * questionCount) / (typingCount + 1));
    typingIndices.add(idx < questionCount ? idx : questionCount - 1);
  }

  for (let i = 0; i < questionCount; i++) {
    const tech = selectedTechList[i % selectedTechList.length];
    const isTypingQ = typingIndices.has(i);

    if (isTypingQ) {
      questions.push({
        id: `gen_q_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        question: `Explain how you design, optimize, and debug applications using ${tech} under ${difficulty} conditions.`,
        type: 'text',
        difficulty,
        technology: tech,
        correctAnswer: `A comprehensive technical response detailing ${tech} principles, syntax patterns, error handling, and performance tuning.`,
        explanation: `Demonstrating hands-on mastery of ${tech} involves clear reasoning on architecture and best practices.`,
        keywords: [tech, 'architecture', 'best practice'],
      });
    } else {
      const isTrueFalse = i % 4 === 3;
      if (isTrueFalse) {
        const tfOptions = ['True', 'False'];
        const correctVal = tfOptions[i % 2];
        questions.push({
          id: `gen_q_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          question: `True or False: Standard design practices in ${tech} facilitate reliable scalability and maintainability under ${difficulty} requirements.`,
          type: 'true_false',
          difficulty,
          technology: tech,
          options: tfOptions,
          correctAnswer: correctVal,
          explanation: `Following foundational patterns in ${tech} ensures long-term system stability.`,
          keywords: [tech, 'scalability'],
        });
      } else {
        const rawAnswers = [
          `Standard non-blocking design pattern for ${tech}`,
          `Deprecated legacy syntax unsupported in modern environments`,
          `Global state mutations without atomic locking controls`,
          `Disabling server-side validation and caching mechanisms`,
        ];

        const targetCorrectIdx = Math.floor(Math.random() * 4);
        const correctText = rawAnswers[0];
        const distractors = rawAnswers.slice(1);

        const optionTexts: string[] = [];
        let distIdx = 0;
        for (let o = 0; o < 4; o++) {
          if (o === targetCorrectIdx) {
            optionTexts.push(correctText);
          } else {
            optionTexts.push(distractors[distIdx % distractors.length]);
            distIdx++;
          }
        }

        const prefixes = ['A', 'B', 'C', 'D'];
        const finalOptions = optionTexts.map((txt, idx) => `${prefixes[idx]}. ${txt}`);

        questions.push({
          id: `gen_q_${i + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          question: `What is a primary engineering best practice when working with ${tech}?`,
          type: 'mcq',
          difficulty,
          technology: tech,
          options: finalOptions,
          correctAnswer: finalOptions[targetCorrectIdx],
          explanation: `Leveraging core best practices in ${tech} optimizes code clarity and execution efficiency.`,
          keywords: [tech, 'best practice'],
        });
      }
    }
  }

  return questions;
}

export function evaluateAnswerLocally(
  question: Question,
  userAnswer: string
): AnswerEvaluation {
  const normalizedUser = (userAnswer || '').trim().toLowerCase();
  const normalizedCorrect = question.correctAnswer.toLowerCase();

  if (!normalizedUser || normalizedUser === 'skipped') {
    return {
      questionId: question.id,
      isCorrect: false,
      score: 0,
      userAnswer: userAnswer || 'Skipped',
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      interviewerExpectation: 'Candidate skipped the question. Highlighting key principles is expected.',
      commonMistakes: 'Leaving interview questions blank.',
      interviewTip: 'Always state your initial approach even if unsure.',
      keywordsMatched: [],
      feedbackSummary: 'Skipped response. 0 points awarded.',
    };
  }

  const matchedKeywords = question.keywords.filter((kw) =>
    normalizedUser.includes(kw.toLowerCase())
  );
  
  let score = 0;
  let isCorrect = false;

  if (question.type === 'mcq' || question.type === 'true_false') {
    const isExact = normalizedUser.slice(0, 1) === normalizedCorrect.slice(0, 1) || normalizedUser.includes(normalizedCorrect.slice(0, 4));
    score = isExact ? 10 : 0;
    isCorrect = isExact;
  } else {
    const keywordRatio = question.keywords.length > 0 ? matchedKeywords.length / question.keywords.length : 0.5;
    const textLength = normalizedUser.split(' ').length;
    
    if (keywordRatio >= 0.75 && textLength > 6) {
      score = 10;
      isCorrect = true;
    } else if (keywordRatio >= 0.3 || textLength >= 6) {
      score = Math.min(9, Math.max(6, Math.floor(keywordRatio * 10) + 4));
      isCorrect = score >= 7;
    } else {
      score = Math.max(3, Math.floor(keywordRatio * 10));
      isCorrect = false;
    }
  }

  return {
    questionId: question.id,
    isCorrect,
    score,
    userAnswer,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    interviewerExpectation: `Interviewer expects clear articulation of ${question.technology} concepts and practical trade-offs.`,
    commonMistakes: `Providing vague answers without concrete examples.`,
    interviewTip: `Structure your response clearly using action-oriented language.`,
    keywordsMatched: matchedKeywords,
    feedbackSummary: isCorrect 
      ? `✅ Strong response! Demonstrated solid understanding of ${question.technology}.` 
      : `⚠️ Partial response. Review key principles of ${question.technology}.`,
  };
}

export function generateFinalAnalytics(
  results: QuestionResult[],
  selectedTechs: string[],
  difficulty: Difficulty
): FinalAnalytics {
  const maxScore = results.length * 10;
  let totalScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  let totalTime = 0;

  const techPerfMap: Record<string, { total: number; score: number; percentage: number }> = {};
  const diffPerfMap: Record<string, { total: number; score: number; percentage: number }> = {};

  results.forEach((res) => {
    totalScore += res.evaluation.score;
    totalTime += res.timeSpentSeconds;

    if (res.userAnswer === 'Skipped' || !res.userAnswer) {
      skippedCount++;
    } else if (res.evaluation.isCorrect) {
      correctCount++;
    } else {
      incorrectCount++;
    }

    const t = res.question.technology;
    if (!techPerfMap[t]) techPerfMap[t] = { total: 0, score: 0, percentage: 0 };
    techPerfMap[t].total += 10;
    techPerfMap[t].score += res.evaluation.score;

    const d = res.question.difficulty;
    if (!diffPerfMap[d]) diffPerfMap[d] = { total: 0, score: 0, percentage: 0 };
    diffPerfMap[d].total += 10;
    diffPerfMap[d].score += res.evaluation.score;
  });

  Object.keys(techPerfMap).forEach((t) => {
    techPerfMap[t].percentage = Math.round((techPerfMap[t].score / techPerfMap[t].total) * 100);
  });
  Object.keys(diffPerfMap).forEach((d) => {
    diffPerfMap[d].percentage = Math.round((diffPerfMap[d].score / diffPerfMap[d].total) * 100);
  });

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgTime = results.length > 0 ? Math.round(totalTime / results.length) : 0;

  let rating: FinalAnalytics['performanceRating'] = 'Needs Improvement';
  let hiringRecommendation = 'Needs Improvement';

  if (percentage >= 85) {
    rating = 'Interview Ready';
    hiringRecommendation = 'Strong Hire 🚀 - Outstanding depth, clear communication, and precise problem solving.';
  } else if (percentage >= 70) {
    rating = 'Excellent';
    hiringRecommendation = 'Hire 👍 - Solid proficiency with minor areas for refinement.';
  } else if (percentage >= 55) {
    rating = 'Good';
    hiringRecommendation = 'Leaning Hire / Re-evaluate ⚖️ - Baseline core competency; targeted practice recommended.';
  } else {
    rating = 'Needs Improvement';
    hiringRecommendation = 'Needs Improvement 📈 - Recommend focused review on key fundamentals.';
  }

  const strongAreas: string[] = [];
  const weakAreas: string[] = [];

  Object.entries(techPerfMap).forEach(([tech, perf]) => {
    if (perf.percentage >= 70) {
      strongAreas.push(`Excellent mastery of ${tech} (${perf.percentage}%)`);
    } else {
      weakAreas.push(`Struggles with ${tech} concepts (${perf.percentage}%)`);
    }
  });

  if (strongAreas.length === 0) strongAreas.push('Solid effort across interview questions');
  if (weakAreas.length === 0) weakAreas.push('Minor edge cases in situational scenarios');

  const performanceInsights = [
    `Your overall score is ${totalScore}/${maxScore} (${percentage}%) across ${results.length} questions (${selectedTechs.join(', ')}).`,
    `Average response time per question was ${avgTime} seconds.`,
    ...strongAreas.slice(0, 2),
    ...weakAreas.slice(0, 2),
  ];

  return {
    totalScore,
    maxScore,
    percentage,
    correctCount,
    incorrectCount,
    skippedCount,
    accuracy,
    totalTimeSeconds: totalTime,
    avgTimePerQuestion: avgTime,
    performanceRating: rating,
    hiringRecommendation,
    summary: `Candidate completed a ${results.length}-question ${difficulty} interview covering ${selectedTechs.join(', ')}. Scored ${totalScore}/${maxScore} with ${accuracy}% accuracy.`,
    strongAreas,
    weakAreas,
    techPerformance: techPerfMap,
    difficultyPerformance: diffPerfMap,
    performanceInsights,
  };
}
