import { Question, Difficulty, AnswerEvaluation, QuestionCount, InterviewMode } from './types';
import { generateMockQuestions, evaluateAnswerLocally } from './mockData';

function formatApiKey(key?: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  if (trimmed.startsWith('nvapi-')) return trimmed;
  return `nvapi-${trimmed}`;
}

const HR_SKILLS_SET = new Set([
  'STAR Method', 'Leadership', 'Conflict Resolution', 'Communication',
  'Teamwork', 'Work Ethics', 'Problem Solving', 'Project Deadlines',
  'HR & Behavioral Leadership', 'HR'
]);

export async function generateNVIDIAQuestions(
  selectedTechs: string[],
  difficulty: Difficulty,
  questionCount: number = 5,
  mode: InterviewMode = 'technical',
  apiKey?: string
): Promise<Question[]> {
  const activeKey = formatApiKey(apiKey || process.env.NVIDIA_API_KEY);

  if (!activeKey) {
    console.log('[NVIDIA AI] No API key provided. Using dynamic question generator.');
    return generateMockQuestions(selectedTechs, difficulty, questionCount, mode);
  }

  const hasHrSelected = selectedTechs.some((t) => HR_SKILLS_SET.has(t));
  const typingCount = Math.max(1, Math.round(questionCount * 0.2));
  const mcqCount = questionCount - typingCount;

  const hrRule = hasHrSelected
    ? "Include questions based on selected HR/Behavioral topics."
    : "DO NOT include any HR or behavioral soft-skills questions unless explicitly listed in selected topics. Generate questions strictly from the technical topics provided.";

  const difficultyGuide: Record<string, string> = {
    Easy: "Target junior engineers: Focus on basic syntax, foundational methods, and standard definitions.",
    Medium: "Target mid-level engineers: Focus on intermediate architectural patterns, asynchronous execution, framework idioms, and common optimization techniques.",
    Hard: "Target SENIOR/EXPERT STAFF ENGINEERS: Ask TOUGH, ADVANCED, EXPERT-LEVEL interview questions! Focus on deep engine mechanics, memory allocation (__slots__, V8 hidden classes, garbage collection cycles), GIL/concurrency primitives, race conditions, distributed systems trade-offs, and complex edge cases. DO NOT ask beginner or surface-level questions!",
    Expert: "Target PRINCIPAL/STAFF ARCHITECT ENGINEERS: Ask EXTREMELY TOUGH, DEEP-INTERNALS interview questions! Focus on core runtime internals, lockless concurrency, memory barrier semantics, low-level optimization, and high-scale distributed system trade-offs."
  };

  const prompt = `You are a Senior Technical and Engineering Interviewer at Google and NVIDIA.
Use the selected topics [${selectedTechs.join(', ')}] and difficulty level "${difficulty}" to create exactly ${questionCount} unique interview questions.

STRICT DIFFICULTY ENFORCEMENT (${difficulty}):
- ${difficultyGuide[difficulty] || "Match requested difficulty precisely."}

IMPORTANT RULES:
1. Generate EXACTLY ${questionCount} questions total.
2. QUESTION TYPE RATIO (STRICT 80:20 RULE):
   - EXACTLY ${mcqCount} questions MUST BE MULTIPLE CHOICE ('mcq') with 4 distinct options ("A. ...", "B. ...", "C. ...", "D. ...") or True/False ('true_false').
   - EXACTLY ${typingCount} question(s) MUST BE FREE-TEXT TYPING QUESTIONS ('text' or 'scenario') requiring the candidate to type a short technical explanation.
3. RANDOMIZE MCQ CORRECT ANSWERS:
   - For MCQ questions, vary the position of the correct answer across "A", "B", "C", and "D". DO NOT always place the correct answer as Option A!
4. Every single question must be completely distinct. DO NOT REPEAT any question stems or concepts in the same round.
5. ${hrRule}

Return ONLY a valid JSON array of ${questionCount} objects matching this JSON schema:
[
  {
    "id": "q_1",
    "question": "string",
    "type": "mcq | true_false | text | scenario",
    "difficulty": "${difficulty}",
    "technology": "string from selected topics",
    "options": ["A...", "B...", "C...", "D..."] (REQUIRED if type is mcq or true_false),
    "correctAnswer": "string",
    "explanation": "string",
    "keywords": ["string", "string"]
  }
]
Do not wrap in markdown codeblocks if possible, output raw JSON array.`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      console.warn(`[NVIDIA AI] API request failed with status ${response.status}. Falling back to dynamic generator.`);
      return generateMockQuestions(selectedTechs, difficulty, questionCount, mode);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    
    // Extract JSON from output
    const jsonMatch = content.match(/\[\s*\{[\s\S]*\}\s*\]/) || content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length >= 1) {
        const seenQuestions = new Set<string>();
        const uniqueQuestions: Question[] = [];

        for (let idx = 0; idx < parsed.length; idx++) {
          const item = parsed[idx];
          const qText = (item.question || '').trim().toLowerCase();

          if (qText && !seenQuestions.has(qText)) {
            seenQuestions.add(qText);
            uniqueQuestions.push({
              id: `nvidia_q_${uniqueQuestions.length + 1}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              question: item.question || `Explain key concepts of ${selectedTechs[0]}`,
              type: item.type || 'mcq',
              difficulty: item.difficulty || difficulty,
              technology: item.technology || selectedTechs[idx % selectedTechs.length],
              options: item.options || (item.type === 'mcq' ? ['A. Option 1', 'B. Option 2', 'C. Option 3', 'D. Option 4'] : undefined),
              correctAnswer: item.correctAnswer || (item.options ? item.options[0] : 'Correct response'),
              explanation: item.explanation || 'Detailed explanation.',
              keywords: item.keywords || [item.technology || selectedTechs[0]],
              codeSnippet: item.codeSnippet,
              scenarioContext: item.scenarioContext,
            });
          }

          if (uniqueQuestions.length >= questionCount) break;
        }

        if (uniqueQuestions.length > 0) {
          if (uniqueQuestions.length < questionCount) {
            const extra = generateMockQuestions(selectedTechs, difficulty, questionCount - uniqueQuestions.length, mode);
            return [...uniqueQuestions, ...extra];
          }
          return uniqueQuestions;
        }
      }
    }

    console.warn('[NVIDIA AI] Failed to parse JSON from response. Falling back to dynamic generator.');
    return generateMockQuestions(selectedTechs, difficulty, questionCount, mode);
  } catch (error) {
    console.error('[NVIDIA AI] Exception while calling NVIDIA API:', error);
    return generateMockQuestions(selectedTechs, difficulty, questionCount, mode);
  }
}

export async function evaluateNVIDIAAnswer(
  question: Question,
  userAnswer: string,
  apiKey?: string
): Promise<AnswerEvaluation> {
  const activeKey = formatApiKey(apiKey || process.env.NVIDIA_API_KEY);

  if (!activeKey) {
    return evaluateAnswerLocally(question, userAnswer);
  }

  const prompt = `Evaluate the candidate's answer semantically. Accept equivalent technical explanations.
Question: "${question.question}"
Topic: "${question.technology}"
Difficulty: "${question.difficulty}"
Type: "${question.type}"
Correct Answer Reference: "${question.correctAnswer}"
Expected Keywords: ${JSON.stringify(question.keywords)}

Candidate Answer: "${userAnswer || 'Skipped'}"

Return ONLY valid JSON matching this schema:
{
  "score": 0 to 10 (integer),
  "isCorrect": boolean,
  "correctAnswer": "string",
  "explanation": "string detailed explanation",
  "commonMistakes": "string common candidate pitfalls",
  "keywordsMatched": ["string"],
  "feedbackSummary": "string short verdict"
}
Output raw JSON object only.`;

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      return evaluateAnswerLocally(question, userAnswer);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        questionId: question.id,
        isCorrect: Boolean(parsed.isCorrect),
        score: typeof parsed.score === 'number' ? Math.min(10, Math.max(0, parsed.score)) : 5,
        userAnswer,
        correctAnswer: parsed.correctAnswer || question.correctAnswer,
        explanation: parsed.explanation || question.explanation,
        interviewerExpectation: 'Clear understanding and active communication.',
        commonMistakes: parsed.commonMistakes || 'Lack of concrete examples.',
        interviewTip: 'Highlight real-world outcomes and actionable results.',
        keywordsMatched: Array.isArray(parsed.keywordsMatched) ? parsed.keywordsMatched : question.keywords,
        feedbackSummary: parsed.feedbackSummary || (parsed.isCorrect ? 'Correct response' : 'Needs refinement'),
      };
    }

    return evaluateAnswerLocally(question, userAnswer);
  } catch (error) {
    console.error('[NVIDIA AI Evaluation] Error:', error);
    return evaluateAnswerLocally(question, userAnswer);
  }
}
