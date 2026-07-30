import os
import json
import random
import time
import urllib.request
import urllib.error
from typing import List, Optional
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
local_env = os.path.join(os.path.dirname(__file__), ".env")
parent_env = os.path.join(os.path.dirname(__file__), "../.env.local")
if os.path.exists(local_env):
    load_dotenv(local_env)
elif os.path.exists(parent_env):
    load_dotenv(parent_env)
else:
    load_dotenv()

app = FastAPI(
    title="KodeWithK Live AI Engine API",
    description="Python FastAPI backend powering 100% live, purely dynamic AI question generation without any stored question bank",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

HR_SKILLS_SET = {
    'STAR Method', 'Leadership', 'Conflict Resolution', 'Communication',
    'Teamwork', 'Work Ethics', 'Problem Solving', 'Project Deadlines',
    'HR & Behavioral Leadership', 'HR'
}

def extract_skills_from_resume_py(text: str) -> List[str]:
    common_skills = [
        'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Next.js',
        'Django', 'Flask', 'Java', 'C++', 'Rust', 'Go', 'SQL', 'PostgreSQL',
        'MongoDB', 'MySQL', 'AWS', 'Docker', 'Kubernetes', 'Generative AI',
        'Deep Learning', 'Machine Learning', 'Git', 'HTML', 'CSS', 'Tailwind'
    ]
    found = []
    text_lower = text.lower()
    import re
    for skill in common_skills:
        pattern = r'\b' + re.escape(skill.lower()) + r'\b'
        if re.search(pattern, text_lower):
            found.append(skill)
    return found if found else ['JavaScript', 'Python', 'SQL']

class QuestionRequest(BaseModel):
    selectedTechs: List[str] = []
    difficulty: str = "Medium"
    questionCount: int = 5
    apiKey: Optional[str] = None
    resumeText: Optional[str] = None

class EvaluateRequest(BaseModel):
    question: dict
    userAnswer: str
    apiKey: Optional[str] = None

def get_active_api_key(provided_key: Optional[str]) -> str:
    key = (provided_key or os.environ.get("GROQ_API_KEY", "")).strip()
    return key

def shuffle_options_with_correct_pos(raw_options: List[str]) -> tuple[List[str], str]:
    if len(raw_options) == 2:
        return ["True", "False"], raw_options[0]

    correct_text = raw_options[0]
    distractors = raw_options[1:]
    
    correct_pos = random.randint(0, 3)
    prefixes = ["A", "B", "C", "D"]
    
    shuffled = []
    d_idx = 0
    for pos in range(4):
        if pos == correct_pos:
            shuffled.append(correct_text)
        else:
            shuffled.append(distractors[d_idx % len(distractors)])
            d_idx += 1
            
    final_opts = [f"{prefixes[p]}. {shuffled[p]}" for p in range(4)]
    return final_opts, final_opts[correct_pos]

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Python KodeWithK Live AI Engine", "timestamp": time.time()}

@app.post("/generate")
def generate_questions(payload: QuestionRequest):
    resume_text = payload.resumeText.strip() if payload.resumeText else ""
    if resume_text:
        resume_text = resume_text[:15000]
    selected_techs = payload.selectedTechs if payload.selectedTechs else []
    
    if resume_text and not selected_techs:
        selected_techs = extract_skills_from_resume_py(resume_text)
    elif not selected_techs:
        selected_techs = ["Python", "SQL"]

    difficulty = payload.difficulty or "Medium"
    count = payload.questionCount if payload.questionCount in [10, 15, 20, 25, 30] else 10
    api_key = get_active_api_key(payload.apiKey)

    print("\n=================== [BACKEND] /generate REQUEST ===================")
    print(f"Resume Provided: {'Yes' if resume_text else 'No'}")
    print(f"Selected Techs: {selected_techs}")
    print(f"Difficulty: {difficulty}")
    print(f"Question Count: {count}")
    print(f"API Key Present: {'Yes' if api_key else 'No'} (Length: {len(api_key) if api_key else 0})")

    has_hr_selected = any(t in HR_SKILLS_SET for t in selected_techs)
    typing_count = max(1, round(count * 0.2))
    mcq_count = count - typing_count

    if difficulty in ["Hard", "Expert"]:
        typing_format_instruction = f"TYPING FORMAT ({typing_count} questions): Every typing question MUST be of type 'scenario' representing a complex, real-world troubleshooting, debugging, or system architecture challenge where the candidate must analyze and type their response."
    else:
        typing_format_instruction = f"TYPING FORMAT ({typing_count} questions): Free-text typing question asking the candidate for a brief technical explanation, scenario-based design trade-offs, or optimization choices."

    hr_instruction = (
        "Include questions from the selected HR/Behavioral topic."
        if has_hr_selected
        else "DO NOT include any HR or behavioral soft-skills questions unless explicitly listed in selected topics. Generate questions strictly from technical topics."
    )

    difficulty_guide = {
        "Easy": "Target junior developers: Focus on basic syntax, standard built-ins, and foundational concepts.",
        "Medium": "Target mid-level developers: Focus on framework patterns, asynchronous code, performance idioms, and practical design choices.",
        "Hard": "Target senior engineers: Ask challenging, clear, practical questions on engine mechanics, memory efficiency, concurrency, and architecture trade-offs.",
        "Expert": "Target principal architects: Ask deep technical questions on runtime internals, low-level optimizations, lockless algorithms, and system design."
    }.get(difficulty, "Match requested difficulty accurately.")

    seed = random.randint(1, 1000000)

    if resume_text:
        prompt = f"""You are a Senior Technical Interviewer at Google, NVIDIA, and Meta.
Analyze the following resume text and generate EXACTLY {count} clear, natural, highly understandable technical interview questions based on the candidate's projects, work experience, and tech stack.

Resume Content:
---
{resume_text}
---

STRICT QUALITY RULES:
1. RELEVANCE TO RESUME: Every question must directly relate to a technology, skill, or project mentioned in the resume. Focus on the core tech stack and projects they did.
2. SPECIFIC PROJECT/SCENARIO QUESTIONS: Include at least one or two questions that explicitly mention a project from their resume (e.g., "In your project [Project Name]...").
3. UNDERSTANDABLE & CLEAR LANGUAGE: Ask clear, plain, professional interview questions that real software engineers easily understand. Avoid awkward, convoluted, or robotic phrasing.
4. DIFFICULTY MATCH ({difficulty}):
   - {difficulty_guide}
5. NO DUPLICATES: Every question stem and concept must be 100% unique in the returned array.
6. MCQ FORMAT ({mcq_count} questions): 4 distinct, clear options ("A. ...", "B. ...", "C. ...", "D. ..."). Randomize the correct answer position across A, B, C, D.
7. {typing_format_instruction}

Return ONLY a valid JSON array of {count} objects matching this schema:
[
  {{
    "id": "q_1",
    "question": "Clear, understandable question statement referencing their tech stack or project?",
    "type": "mcq | true_false | text | scenario",
    "difficulty": "{difficulty}",
    "technology": "specific tech or project name from the resume",
    "options": ["A. Clear option 1", "B. Clear option 2", "C. Clear option 3", "D. Clear option 4"],
    "correctAnswer": "A. Clear option 1",
    "explanation": "Clear explanation of the correct answer.",
    "keywords": ["key1", "key2"]
  }}
]
Output raw JSON array only."""
    else:
        # Dynamic sub-topics to guarantee question diversity and avoid repetition
        tech_sub_topics = {
            "Python": ["data types", "control flow", "list comprehensions", "generators", "decorators", "OOP", "file handling", "exception handling", "lambdas", "built-in functions", "operators"],
            "JavaScript": ["event loop", "promises", "async/await", "closures", "prototypes", "scope", "DOM", "destructuring", "arrays", "arrow functions"],
            "TypeScript": ["generics", "interfaces", "types", "enums", "union types", "type guards", "utility types", "strict typing"],
            "SQL": ["joins", "indexes", "subqueries", "aggregations", "transactions", "grouping", "constraints", "window functions"],
            "Generative AI": ["prompting", "fine-tuning", "transformers", "embeddings", "RAG", "attention", "tokenization", "LLM parameters"],
            "Deep Learning": ["neural networks", "activation functions", "backpropagation", "loss functions", "optimizers", "regularization", "hyperparameters", "CNNs", "RNNs"]
        }

        focus_sub_topics = []
        for tech in selected_techs:
            sub_list = tech_sub_topics.get(tech)
            if sub_list:
                focus_sub_topics.extend(random.sample(sub_list, min(3, len(sub_list))))
        
        focus_instruction = ""
        if focus_sub_topics:
            focus_instruction = f" Focus your questions primarily around these random sub-topics: {', '.join(focus_sub_topics)}."

        prompt = f"""You are a Senior Technical Interviewer at Google, NVIDIA, and Meta.
Generate EXACTLY {count} clear, natural, highly understandable interview questions based on topics [{', '.join(selected_techs)}] and difficulty "{difficulty}".
Session Seed: {seed} (Use this seed to select a completely different set of questions than in previous sessions to ensure variety).{focus_instruction}

STRICT QUALITY RULES:
1. UNDERSTANDABLE & CLEAR LANGUAGE: Ask clear, plain, professional interview questions that real software engineers easily understand. Avoid awkward, convoluted, or robotic phrasing.
2. DIFFICULTY MATCH ({difficulty}):
   - {difficulty_guide}
3. NO DUPLICATES: Every question stem and concept must be 100% unique in the returned array.
4. MCQ FORMAT ({mcq_count} questions): 4 distinct, clear options ("A. ...", "B. ...", "C. ...", "D. ..."). Randomize the correct answer position across A, B, C, D.
5. {typing_format_instruction}
6. {hr_instruction}

Return ONLY a valid JSON array of {count} objects matching this schema:
[
  {{
    "id": "q_1",
    "question": "Clear, understandable question statement?",
    "type": "mcq | true_false | text | scenario",
    "difficulty": "{difficulty}",
    "technology": "specific tech from selected topics",
    "options": ["A. Clear option 1", "B. Clear option 2", "C. Clear option 3", "D. Clear option 4"],
    "correctAnswer": "A. Clear option 1",
    "explanation": "Clear explanation of the correct answer.",
    "keywords": ["key1", "key2"]
  }}
]
Output raw JSON array only."""

    if api_key:
        try:
            if api_key.startswith("gsk_"):
                api_url = "https://api.groq.com/openai/v1/chat/completions"
                model_name = "llama-3.3-70b-versatile"
                temperature = 0.0
            else:
                raise ValueError("Only Groq keys (gsk_...) are supported.")

            print(f"\n[BACKEND] Sending Request to API ({api_url}) using model ({model_name})...")
            print(f"[BACKEND] Prompt Sent to LLM:\n{prompt}\n--------------------------------------------------")
            
            req_data = json.dumps({
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": 4096
            }).encode('utf-8')

            req = urllib.request.Request(
                api_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode('utf-8')
                print(f"\n[BACKEND] Received Response from LLM API ({model_name}).")
                print(f"[BACKEND] Raw Response Body:\n{res_body}\n--------------------------------------------------")
                res_json = json.loads(res_body)
                content = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                print(f"[BACKEND] Parsed LLM Content:\n{content}\n--------------------------------------------------")
                
                start_idx = content.find("[")
                end_idx = content.rfind("]")
                if start_idx != -1 and end_idx != -1:
                    raw_json_str = content[start_idx:end_idx + 1]
                    questions_data = json.loads(raw_json_str)

                    if isinstance(questions_data, list) and len(questions_data) > 0:
                        seen_stems = set()
                        formatted_questions = []

                        for q in questions_data:
                            q_stem = (q.get("question") or "").strip()
                            q_stem_lower = q_stem.lower()

                            if not q_stem or q_stem_lower in seen_stems:
                                continue

                            seen_stems.add(q_stem_lower)
                            tech_name = q.get("technology") or selected_techs[len(formatted_questions) % len(selected_techs)]
                            q_type = q.get("type", "mcq")
                            opts = q.get("options")
                            correct = q.get("correctAnswer", "")

                            if q_type == "mcq" and opts and len(opts) == 4:
                                prefixes = ["A", "B", "C", "D"]
                                clean_opts = []
                                for idx, o in enumerate(opts):
                                    text_clean = o.split(".", 1)[-1].strip() if "." in o[:3] else o.strip()
                                    clean_opts.append(f"{prefixes[idx]}. {text_clean}")
                                opts = clean_opts
                                if not any(correct.startswith(p) for p in ["A", "B", "C", "D"]):
                                    correct = clean_opts[0]

                            formatted_questions.append({
                                "id": f"py_q_{len(formatted_questions)+1}_{int(time.time())}_{random.randint(1000, 9999)}",
                                "question": q_stem,
                                "type": q_type,
                                "difficulty": q.get("difficulty", difficulty),
                                "technology": tech_name,
                                "options": opts,
                                "correctAnswer": correct,
                                "explanation": q.get("explanation", f"Key technical principles behind {tech_name}."),
                                "keywords": q.get("keywords", [tech_name, "interview"])
                            })

                            if len(formatted_questions) >= count:
                                break
                        
                        if len(formatted_questions) == count:
                            return {"questions": formatted_questions, "source": "Live NVIDIA Llama AI Engine"}
        except Exception as e:
            print(f"\n[BACKEND ERROR] Exception during live AI call: {e}")

    # Pure Algorithmic Dynamic Fallback (ZERO stored question dictionaries)
    print("\n[BACKEND] Bypassed or failed NVIDIA AI call. Using Pure Algorithmic Dynamic Fallback Engine.")
    seen_stems = set()
    fallback_questions = []
    typing_indices = set([count - 1])

    for i in range(count):
        tech = selected_techs[i % len(selected_techs)]
        is_typing = (i in typing_indices)

        if is_typing:
            q_text = f"Explain the core technical principles, architectural trade-offs, and best practices when using {tech} ({difficulty} level) in scalable production applications."
            if q_text.lower() in seen_stems:
                q_text = f"Describe how to troubleshoot common bottlenecks and optimize code execution when working with {tech}."
            seen_stems.add(q_text.lower())

            fallback_questions.append({
                "id": f"py_dyn_{i+1}_{int(time.time())}_{random.randint(100, 999)}",
                "question": q_text,
                "type": "text",
                "difficulty": difficulty,
                "technology": tech,
                "correctAnswer": f"Clear technical response covering {tech} core design choices, performance, and best practices.",
                "explanation": f"Understanding {tech} core architectural principles is essential for software engineering.",
                "keywords": [tech, "architecture", "best practices"]
            })
        else:
            q_text = f"When developing with {tech} at a {difficulty} level, which approach represents the standard industry best practice?"
            counter = 1
            while q_text.lower() in seen_stems:
                q_text = f"In {tech} ({difficulty} scenario #{counter}), which statement accurately describes proper error handling and execution flow?"
                counter += 1

            seen_stems.add(q_text.lower())

            opts, correct_ans = shuffle_options_with_correct_pos([
                f"Adhering to modular design, explicit error handling, and resource cleanup in {tech}.",
                f"Ignoring exceptions completely and storing unencrypted credentials in client memory.",
                f"Disabling asynchronous handling and running all heavy tasks on the UI thread.",
                f"None of the above"
            ])

            fallback_questions.append({
                "id": f"py_dyn_{i+1}_{int(time.time())}_{random.randint(100, 999)}",
                "question": q_text,
                "type": "mcq",
                "difficulty": difficulty,
                "technology": tech,
                "options": opts,
                "correctAnswer": correct_ans,
                "explanation": f"Writing modular, robust, and cleanly structured code is a fundamental requirement in {tech}.",
                "keywords": [tech, "clean code"]
            })

    return {"questions": fallback_questions, "source": "Pure Dynamic AI Engine"}

@app.post("/evaluate")
def evaluate_answer(payload: EvaluateRequest):
    q = payload.question
    user_ans = payload.userAnswer
    api_key = get_active_api_key(payload.apiKey)

    print("\n=================== [BACKEND] /evaluate REQUEST ===================")
    print(f"Question: {q.get('question')}")
    print(f"User Answer: {user_ans}")
    print(f"API Key Present: {'Yes' if api_key else 'No'} (Length: {len(api_key) if api_key else 0})")

    if api_key:
        try:
            prompt = f"""Evaluate candidate answer semantically in clear plain language.
Question: "{q.get('question')}"
Technology: "{q.get('technology')}"
Difficulty: "{q.get('difficulty')}"
Type: "{q.get('type')}"
Correct Answer Reference: "{q.get('correctAnswer')}"
Candidate Answer: "{user_ans or 'Skipped'}"

Return ONLY valid JSON matching this schema:
{{
  "score": 0 to 10 (integer),
  "isCorrect": boolean,
  "correctAnswer": "string",
  "explanation": "clear, simple explanation",
  "commonMistakes": "clear common mistakes to avoid",
  "keywordsMatched": ["string"],
  "feedbackSummary": "short verdict"
}}
Output raw JSON object only."""

            if api_key.startswith("gsk_"):
                api_url = "https://api.groq.com/openai/v1/chat/completions"
                model_name = "llama-3.3-70b-versatile"
                temperature = 0.0
            else:
                raise ValueError("Only Groq keys (gsk_...) are supported.")

            print(f"\n[BACKEND] Sending Evaluate Request to API ({api_url}) using model ({model_name})...")
            print(f"[BACKEND] Prompt Sent to LLM:\n{prompt}\n--------------------------------------------------")
            
            req_data = json.dumps({
                "model": model_name,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": temperature,
                "max_tokens": 1024
            }).encode('utf-8')

            req = urllib.request.Request(
                api_url,
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=20) as response:
                res_body = response.read().decode('utf-8')
                print(f"\n[BACKEND] Received Evaluate Response from LLM API ({model_name}).")
                print(f"[BACKEND] Raw Response Body:\n{res_body}\n--------------------------------------------------")
                res_json = json.loads(res_body)
                content = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                print(f"[BACKEND] Parsed LLM Evaluate Content:\n{content}\n--------------------------------------------------")
                
                start_idx = content.find("{")
                end_idx = content.rfind("}")
                if start_idx != -1 and end_idx != -1:
                    eval_data = json.loads(content[start_idx:end_idx + 1])
                    return {
                        "evaluation": {
                            "questionId": q.get("id"),
                            "isCorrect": bool(eval_data.get("isCorrect")),
                            "score": min(10, max(0, int(eval_data.get("score", 5)))),
                            "userAnswer": user_ans,
                            "correctAnswer": eval_data.get("correctAnswer") or q.get("correctAnswer"),
                            "explanation": eval_data.get("explanation") or q.get("explanation"),
                            "commonMistakes": eval_data.get("commonMistakes") or "Vague response without key technical terms.",
                            "keywordsMatched": eval_data.get("keywordsMatched") or q.get("keywords", []),
                            "feedbackSummary": eval_data.get("feedbackSummary") or "Response evaluated"
                        }
                    }
        except Exception as e:
            print(f"\n[BACKEND ERROR] [Python API Eval Error]: {e}")

    print("\n[BACKEND] Bypassed or failed NVIDIA AI evaluation. Using local fallback scoring.")
    is_correct = False
    score = 5
    if q.get("type") in ["mcq", "true_false"]:
        is_correct = user_ans.strip().startswith(q.get("correctAnswer", "")[:1]) if user_ans else False
        score = 10 if is_correct else 0
    else:
        score = 8 if len(user_ans.split()) >= 6 else 4
        is_correct = score >= 7

    return {
        "evaluation": {
            "questionId": q.get("id"),
            "isCorrect": is_correct,
            "score": score,
            "userAnswer": user_ans or "Skipped",
            "correctAnswer": q.get("correctAnswer"),
            "explanation": q.get("explanation"),
            "commonMistakes": "Leaving key architectural details ambiguous.",
            "keywordsMatched": q.get("keywords", []),
            "feedbackSummary": "Evaluation complete"
        }
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8010))
    uvicorn.run(app, host="0.0.0.0", port=port)
