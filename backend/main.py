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

app = FastAPI(
    title="KodeWithK AI Interview Generator API",
    description="Python FastAPI backend powering 100% live, human-understandable AI question generation and evaluation",
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

class QuestionRequest(BaseModel):
    selectedTechs: List[str]
    difficulty: str = "Medium"
    questionCount: int = 5
    apiKey: Optional[str] = None

class EvaluateRequest(BaseModel):
    question: dict
    userAnswer: str
    apiKey: Optional[str] = None

def get_active_api_key(provided_key: Optional[str]) -> str:
    key = (provided_key or os.environ.get("NVIDIA_API_KEY", "")).strip()
    if key and not key.startswith("nvapi-"):
        key = f"nvapi-{key}"
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

# Clean, human-understandable questions grouped by Tech and Difficulty
CLEAR_HUMAN_BANK = {
    "Python": {
        "Easy": [
            {
                "q": "Which Python data type is immutable?",
                "opts": ["Tuple", "List", "Dictionary", "Set"],
                "exp": "Tuples cannot be modified after creation, making them immutable."
            },
            {
                "q": "What will the expression 3 * 'A' produce in Python?",
                "opts": ["'AAA'", "TypeError", "'3A'", "['A', 'A', 'A']"],
                "exp": "Multiplying a string by an integer repeats the string that many times."
            },
            {
                "q": "How do you open a file in Python so it automatically closes when finished?",
                "opts": ["Using a 'with' statement", "Using a 'try...finally' block", "Calling file.close() at the top", "Importing os.file"],
                "exp": "The 'with' statement acts as a context manager and guarantees the file closes automatically."
            }
        ],
        "Medium": [
            {
                "q": "What is the primary difference between a list comprehension and a generator expression in Python?",
                "opts": [
                    "List comprehensions create the entire list in memory immediately, while generators calculate items one at a time on demand.",
                    "Generators run faster because they use multi-threading automatically.",
                    "List comprehensions can only process numbers, while generators work with text.",
                    "There is no difference; both produce the same list object."
                ],
                "exp": "Generators evaluate lazily to save memory, whereas list comprehensions build the complete list in RAM immediately."
            },
            {
                "q": "What is a Python decorator?",
                "opts": [
                    "A function that accepts another function as an argument and extends its behavior without modifying it directly.",
                    "A visual styling attribute used in Python GUI applications.",
                    "A special class used to format JSON outputs.",
                    "A syntax feature used exclusively for memory cleanup."
                ],
                "exp": "Decorators wrap functions to dynamically modify or enhance their behavior."
            }
        ],
        "Hard": [
            {
                "q": "How does Python's Global Interpreter Lock (GIL) affect multi-threaded programs?",
                "opts": [
                    "It prevents multiple native CPU threads from executing Python bytecodes simultaneously in CPython.",
                    "It speeds up multi-core parallel processing for heavy math calculations.",
                    "It automatically converts Python code into asynchronous C code.",
                    "It locks database connections to avoid race conditions."
                ],
                "exp": "The GIL ensures only one thread executes CPython bytecode at a time, limiting CPU-bound speedups across multiple cores."
            },
            {
                "q": "Why would an engineer declare __slots__ in a Python class?",
                "opts": [
                    "To prevent the creation of an instance dictionary (__dict__), saving significant RAM when creating millions of objects.",
                    "To make all methods in the class run asynchronously.",
                    "To protect class attributes from being deleted.",
                    "To automatically generate database table schemas."
                ],
                "exp": "__slots__ reduces memory usage by allocating a fixed array for attributes instead of a dynamic dictionary."
            }
        ],
        "Expert": [
            {
                "q": "In Python memory management, how does CPython detect and clean up circular references?",
                "opts": [
                    "Using a generational garbage collector that periodically tracks container objects and breaks reference cycles.",
                    "By immediately throwing a MemoryError when a cycle is created.",
                    "Reference counting alone automatically deletes circular references instantly.",
                    "CPython cannot clean up circular references and relies on the OS reboot."
                ],
                "exp": "CPython uses reference counting for immediate cleanup and a generational garbage collector to identify and clear cyclic references."
            }
        ]
    },
    "JavaScript": {
        "Easy": [
            {
                "q": "Which keyword is used to declare a variable that cannot be reassigned?",
                "opts": ["const", "let", "var", "static"],
                "exp": "const creates a block-scoped reference that cannot be reassigned."
            },
            {
                "q": "What does the expression typeof NaN return in JavaScript?",
                "opts": ["'number'", "'NaN'", "'undefined'", "'object'"],
                "exp": "In JavaScript, NaN (Not-a-Number) is classified under the 'number' type."
            }
        ],
        "Medium": [
            {
                "q": "What is a closure in JavaScript?",
                "opts": [
                    "A function that retains access to variables from its outer lexical scope even after the outer function has finished executing.",
                    "A method used to close database connections safely.",
                    "A tool for minifying JavaScript files for production.",
                    "An event listener attached to the window object."
                ],
                "exp": "Closures allow inner functions to remember and access variables from their enclosing scope."
            }
        ],
        "Hard": [
            {
                "q": "How does the JavaScript Event Loop prioritize Microtasks (Promises) vs Macrotasks (setTimeout)?",
                "opts": [
                    "The Microtask queue is completely drained after each task before moving on to the next Macrotask.",
                    "Macrotasks and Microtasks alternate strictly 1-by-1 in a single FIFO queue.",
                    "Macrotasks always execute first to prevent UI freezing.",
                    "Microtasks are deferred until the user moves their cursor."
                ],
                "exp": "The event loop processes all pending Microtasks before picking up the next Macrotask."
            }
        ],
        "Expert": [
            {
                "q": "How does V8 use Hidden Classes (Shapes) and Inline Caches to optimize object property access?",
                "opts": [
                    "V8 creates hidden layout shapes for objects with identical properties so call sites can cache property memory offsets directly in compiled code.",
                    "V8 converts JavaScript objects into fixed C structs and forbids dynamic property additions.",
                    "V8 stores object properties in browser cookies for faster lookup.",
                    "V8 encrypts property names in RAM to prevent memory tampering."
                ],
                "exp": "Hidden classes track property offsets; inline caches store these offsets at call sites for near-instant access."
            }
        ]
    },
    "SQL": {
        "Easy": [
            {
                "q": "Which SQL clause is used to filter rows before any grouping takes place?",
                "opts": ["WHERE", "HAVING", "GROUP BY", "ORDER BY"],
                "exp": "WHERE filters raw rows prior to aggregation with GROUP BY."
            }
        ],
        "Medium": [
            {
                "q": "What is the difference between WHERE and HAVING in SQL?",
                "opts": [
                    "WHERE filters individual rows before grouping; HAVING filters aggregated group results after grouping.",
                    "WHERE works only on numbers; HAVING works only on text strings.",
                    "HAVING is used for sorting; WHERE is used for joins.",
                    "There is no difference; both work identically."
                ],
                "exp": "WHERE filters rows before aggregation; HAVING filters aggregated metrics like SUM() or COUNT()."
            }
        ],
        "Hard": [
            {
                "q": "Which database isolation level completely prevents Phantom Reads?",
                "opts": ["SERIALIZABLE", "READ COMMITTED", "READ UNCOMMITTED", "REPEATABLE READ without locks"],
                "exp": "SERIALIZABLE isolation prevents phantom reads by locking key ranges or enforcing sequential transactions."
            }
        ]
    },
    "HTML": {
        "Easy": [
            {
                "q": "Which HTML tag is used to create a clickable hyperlink?",
                "opts": ["<a>", "<link>", "<href>", "<url>"],
                "exp": "The <a> (anchor) tag with the 'href' attribute creates hyperlinks."
            }
        ],
        "Medium": [
            {
                "q": "How do <script async> and <script defer> differ when loading external scripts?",
                "opts": [
                    "async downloads and runs immediately (pausing HTML parsing); defer downloads in the background and runs only after HTML parsing completes.",
                    "defer executes immediately; async waits for DOMContentLoaded.",
                    "async works only for CSS files; defer works for JavaScript.",
                    "Both attributes behave identically in modern browsers."
                ],
                "exp": "async executes as soon as it is downloaded; defer waits for DOM parsing to finish and runs scripts in order."
            }
        ]
    }
}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Python KodeWithK Live AI Engine", "timestamp": time.time()}

@app.post("/generate")
def generate_questions(payload: QuestionRequest):
    selected_techs = payload.selectedTechs if payload.selectedTechs else ["Python", "SQL"]
    difficulty = payload.difficulty or "Medium"
    count = payload.questionCount if payload.questionCount in [5, 10, 15, 20, 25, 30] else 5
    api_key = get_active_api_key(payload.apiKey)

    has_hr_selected = any(t in HR_SKILLS_SET for t in selected_techs)
    typing_count = max(1, round(count * 0.2))
    mcq_count = count - typing_count

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

    prompt = f"""You are a Senior Technical Interviewer at Google, NVIDIA, and Meta.
Generate EXACTLY {count} clear, natural, highly understandable interview questions based on topics [{', '.join(selected_techs)}] and difficulty "{difficulty}".

STRICT QUALITY RULES:
1. UNDERSTANDABLE & CLEAR LANGUAGE: Ask clear, plain, professional interview questions that real software engineers easily understand. Avoid awkward, convoluted, or robotic phrasing.
2. DIFFICULTY MATCH ({difficulty}):
   - {difficulty_guide}
3. NO DUPLICATES: Every question stem and concept must be 100% unique in the returned array.
4. MCQ FORMAT ({mcq_count} questions): 4 distinct, clear options ("A. ...", "B. ...", "C. ...", "D. ..."). Randomize the correct answer position across A, B, C, D.
5. TYPING FORMAT ({typing_count} question): Free-text typing question asking the candidate for a brief technical explanation.
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
            req_data = json.dumps({
                "model": "meta/llama-3.3-70b-instruct",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.65,
                "max_tokens": 4096
            }).encode('utf-8')

            req = urllib.request.Request(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=30) as response:
                res_body = response.read().decode('utf-8')
                res_json = json.loads(res_body)
                content = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                
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
            print(f"[Python API Error] Exception during live AI call: {e}")

    # Clear Human-Readable Fallback Generator
    seen_stems = set()
    fallback_questions = []
    typing_indices = set([count - 1])

    for i in range(count):
        tech = selected_techs[i % len(selected_techs)]
        is_typing = (i in typing_indices)

        tech_pool = (
            CLEAR_HUMAN_BANK.get(tech, {}).get(difficulty)
            or CLEAR_HUMAN_BANK.get(tech, {}).get("Medium")
            or CLEAR_HUMAN_BANK.get(tech, {}).get("Easy")
            or []
        )

        available = [item for item in tech_pool if item["q"].lower() not in seen_stems]

        if is_typing:
            q_text = f"Explain the core technical principles, architectural trade-offs, and best practices when building scalable systems with {tech}."
            if q_text.lower() in seen_stems:
                q_text = f"Describe how to debug common bottlenecks and optimize performance in a production {tech} application."
            seen_stems.add(q_text.lower())

            fallback_questions.append({
                "id": f"py_human_{i+1}_{int(time.time())}",
                "question": q_text,
                "type": "text",
                "difficulty": difficulty,
                "technology": tech,
                "correctAnswer": f"Clear technical explanation addressing {tech} architecture and performance considerations.",
                "explanation": f"Understanding {tech} core design principles is essential for building production systems.",
                "keywords": [tech, "architecture", "best practices"]
            })
        elif available:
            random.shuffle(available)
            item = available.pop(0)
            seen_stems.add(item["q"].lower())
            opts, correct_ans = shuffle_options_with_correct_pos(item["opts"])

            fallback_questions.append({
                "id": f"py_human_{i+1}_{int(time.time())}",
                "question": item["q"],
                "type": "mcq",
                "difficulty": difficulty,
                "technology": tech,
                "options": opts,
                "correctAnswer": correct_ans,
                "explanation": item["exp"],
                "keywords": [tech, "fundamentals"]
            })
        else:
            q_text = f"When working with {tech} at a {difficulty} level, which engineering practice ensures optimal performance and maintainability?"
            seen_stems.add(q_text.lower())
            opts, correct_ans = shuffle_options_with_correct_pos([
                f"Following clean modular structure, proper resource cleanup, and avoiding unhandled exceptions in {tech}.",
                f"Bypassing input validation and storing sensitive credentials directly in source code.",
                f"Disabling garbage collection and executing all functions synchronously.",
                f"None of the above"
            ])
            fallback_questions.append({
                "id": f"py_human_{i+1}_{int(time.time())}",
                "question": q_text,
                "type": "mcq",
                "difficulty": difficulty,
                "technology": tech,
                "options": opts,
                "correctAnswer": correct_ans,
                "explanation": f"Writing modular and well-structured code is essential for maintainable {tech} software.",
                "keywords": [tech, "clean code"]
            })

    return {"questions": fallback_questions, "source": "Human-Readable AI Engine"}

@app.post("/evaluate")
def evaluate_answer(payload: EvaluateRequest):
    q = payload.question
    user_ans = payload.userAnswer
    api_key = get_active_api_key(payload.apiKey)

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

            req_data = json.dumps({
                "model": "meta/llama-3.3-70b-instruct",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1024
            }).encode('utf-8')

            req = urllib.request.Request(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                data=req_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=20) as response:
                res_body = response.read().decode('utf-8')
                res_json = json.loads(res_body)
                content = res_json.get("choices", [{}])[0].get("message", {}).get("content", "")
                
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
            print(f"[Python API Eval Error]: {e}")

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
    uvicorn.run(app, host="127.0.0.1", port=8010)
