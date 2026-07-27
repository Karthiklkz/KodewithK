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
    description="Python FastAPI backend powering AI question generation and candidate answer evaluation",
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

# Large, non-repeating question bank per technology (Easy, Medium, Hard/Expert)
REALISTIC_TECH_BANK = {
    "HTML": {
        "Easy": [
            {
                "q": "What is the function of the HTML style attribute?",
                "rawOpts": [
                    "It is used to add inline styles to an HTML element.",
                    "It is used to uniquely identify a specific element across files.",
                    "It links external stylesheet files.",
                    "It defines JavaScript logic for the tag."
                ],
                "exp": "The style attribute applies inline CSS directly onto an HTML element."
            },
            {
                "q": "What is the purpose of the alt attribute in an <img> tag?",
                "rawOpts": [
                    "Provides alternative text for screen readers and broken image links.",
                    "Alters the image resolution and brightness.",
                    "Sets the alignment of the image.",
                    "Specifies an audio track for an image."
                ],
                "exp": "The alt attribute provides text descriptions for accessibility and broken links."
            }
        ],
        "Medium": [
            {
                "q": "How do <script async> and <script defer> differ during HTML document parsing?",
                "rawOpts": [
                    "async downloads asynchronously and executes immediately when ready, pausing parsing; defer downloads asynchronously but waits until HTML parsing finishes before executing in order.",
                    "defer executes synchronously; async executes after DOMContentLoaded.",
                    "async is only for inline scripts; defer is only for external CSS.",
                    "Both attributes behave identically in modern browsers."
                ],
                "exp": "async executes immediately upon load (pausing parser), whereas defer executes in script order after DOM parsing finishes."
            },
            {
                "q": "What is the primary function of the HTML5 Shadow DOM in Web Components?",
                "rawOpts": [
                    "Provides encapsulated DOM subtree and CSS scoping hidden from global document selectors.",
                    "Renders elements in dark mode automatically.",
                    "Improves SEO indexing for dynamic SPA content.",
                    "Accelerates Canvas 2D graphic rendering."
                ],
                "exp": "Shadow DOM provides component-level encapsulation for DOM tree nodes and scoped CSS."
            }
        ],
        "Hard": [
            {
                "q": "How does Content-Security-Policy (CSP) directive 'strict-dynamic' affect script execution and nonce propagation?",
                "rawOpts": [
                    "It trusts scripts dynamically loaded by an explicitly nonced script, invalidating static domain whitelists.",
                    "It blocks all asynchronous script tags regardless of nonces.",
                    "It forces all inline scripts to be evaluated via eval() in a sandboxed iframe.",
                    "It requires every single API request to be signed with an RSA public key."
                ],
                "exp": "'strict-dynamic' allows scripts instantiated by a trusted nonced script to execute dynamically without maintaining legacy domain whitelists."
            },
            {
                "q": "During critical rendering path execution, what occurs when the browser encounters a synchronous external stylesheet (<link rel='stylesheet'>) before an inline <script>?",
                "rawOpts": [
                    "The browser pauses script execution until the stylesheet is completely fetched and CSSOM construction finishes to prevent FOUC and script layout read mismatches.",
                    "The browser skips CSSOM construction and immediately executes JavaScript in parallel.",
                    "The script executes against stale DOM nodes and cancels stylesheet downloading.",
                    "The HTML parser discards the external stylesheet and applies default user-agent styles."
                ],
                "exp": "Browsers block script execution on pending stylesheets because scripts can query CSSOM layout properties."
            }
        ]
    },
    "CSS": {
        "Easy": [
            {
                "q": "What does box-sizing: border-box do in CSS?",
                "rawOpts": [
                    "Includes padding and border within the element's total declared width and height.",
                    "Removes all borders from the element.",
                    "Adds a 3D shadow around the element box.",
                    "Forces the element to occupy 100% of the viewport width."
                ],
                "exp": "border-box contains padding and borders inside the declared width/height."
            }
        ],
        "Medium": [
            {
                "q": "How does the CSS BFC (Block Formatting Context) contain internal floated elements?",
                "rawOpts": [
                    "A BFC creates a self-contained layout root that expands its height to enclose internal floats without requiring clearfix hacks.",
                    "It forces all child elements to display as inline-blocks.",
                    "It renders internal elements on a GPU composition layer.",
                    "It removes margins between sibling paragraphs."
                ],
                "exp": "Creating a new BFC (e.g. via display: flow-root or overflow: hidden) causes the container to enclose floated children."
            }
        ],
        "Hard": [
            {
                "q": "Which of the following CSS properties creates a new Stacking Context without requiring z-index positioning?",
                "rawOpts": [
                    "opacity less than 1, transform not none, or filter not none",
                    "font-size larger than 24px",
                    "border-style: solid",
                    "margin: auto on flex containers"
                ],
                "exp": "Properties such as opacity < 1, transform, filter, will-change, and isolation: isolate generate new Stacking Contexts."
            },
            {
                "q": "What is the architectural difference between CSS Container Queries (@container) and Media Queries (@media)?",
                "rawOpts": [
                    "Container Queries evaluate layout constraints relative to a parent container's inline size, enabling true modular component responsiveness regardless of viewport dimensions.",
                    "Container Queries only respond to screen orientation changes, while Media Queries respond to width.",
                    "Media Queries run on a separate Web Worker thread; Container Queries run synchronously on the GPU.",
                    "Container Queries require JavaScript resize observers to compute element bounds."
                ],
                "exp": "Container queries evaluate responsive rules against the dimensions of an ancestor container box rather than the browser viewport."
            }
        ]
    },
    "JavaScript": {
        "Easy": [
            {
                "q": "What is the evaluation of typeof NaN in JavaScript?",
                "rawOpts": [
                    "number",
                    "NaN",
                    "undefined",
                    "object"
                ],
                "exp": "In JS, NaN is categorized under the number data type."
            }
        ],
        "Medium": [
            {
                "q": "How does JavaScript's closure mechanism retain access to outer scope variables?",
                "rawOpts": [
                    "The inner function holds a reference to its lexical environment scope chain object, preventing those variables from being garbage collected.",
                    "Closures copy all outer variable values to a static global memory buffer at declaration time.",
                    "Variable values are serialized to JSON and attached to the function object prototype.",
                    "The V8 compiler converts lexical variables into global window parameters."
                ],
                "exp": "Functions retain a reference to their outer Lexical Environment, preserving scope variables across invocations."
            }
        ],
        "Hard": [
            {
                "q": "In V8 event loop execution order, what is the precise execution priority between Microtasks and Macrotasks?",
                "rawOpts": [
                    "The Microtask Queue (Promises, queueMicrotask, process.nextTick) is emptied completely after every single Macrotask (setTimeout, setInterval, I/O) before rendering or processing the next Macrotask.",
                    "Macrotasks and Microtasks alternate 1-to-1 in strict FIFO order.",
                    "Macrotasks take precedence over Microtasks during high CPU workloads.",
                    "Microtasks are deferred until the browser window triggers an animation frame."
                ],
                "exp": "After completing a Macrotask, V8 drains the entire Microtask queue completely before proceeding to the next event loop iteration."
            },
            {
                "q": "How do V8 Hidden Classes (Shapes) and Inline Caches (ICs) optimize dynamic property access performance?",
                "rawOpts": [
                    "V8 assigns hidden class offset maps to objects with identical shapes; ICs cache the memory offset of properties directly at call sites to avoid dictionary lookups.",
                    "V8 converts JavaScript objects into C++ structs at runtime and disables dynamic property additions.",
                    "Inline caches store property values in browser LocalStorage to avoid RAM lookups.",
                    "Hidden classes encrypt object keys in memory to prevent unauthorized property mutations."
                ],
                "exp": "Shapes track fixed property memory offsets; ICs cache these offsets directly in compiled machine code at property access points."
            }
        ]
    },
    "Python": {
        "Easy": [
            {
                "q": "Which keyword is used to define a function in Python?",
                "rawOpts": [
                    "def",
                    "function",
                    "fn",
                    "define"
                ],
                "exp": "def defines function signatures in Python."
            },
            {
                "q": "Which built-in Python function returns the length of a sequence?",
                "rawOpts": [
                    "len()",
                    "length()",
                    "count()",
                    "size()"
                ],
                "exp": "len() returns the total item count of sequences."
            }
        ],
        "Medium": [
            {
                "q": "What is the primary difference between a list comprehension and a generator expression in Python?",
                "rawOpts": [
                    "List comprehensions evaluate eagerly in RAM returning a list; generator expressions evaluate lazily producing items on demand via an iterator yielding low memory footprint.",
                    "Generator expressions return a tuple; list comprehensions return a dictionary.",
                    "List comprehensions cannot process conditional if statements.",
                    "Generator expressions execute on secondary CPU threads concurrently."
                ],
                "exp": "Generators evaluate lazily returning an iterator, whereas list comprehensions construct the entire list in memory immediately."
            }
        ],
        "Hard": [
            {
                "q": "How does CPython's Global Interpreter Lock (GIL) impact CPU-bound vs I/O-bound multi-threaded execution?",
                "rawOpts": [
                    "The GIL restricts execution to a single OS thread at a time per interpreter instance, bottlenecking CPU-bound multi-threading to single-core throughput while allowing I/O-bound threads to release the lock during blocking syscalls.",
                    "The GIL prevents I/O operations entirely unless using the multiprocessing module.",
                    "The GIL compiles Python bytecodes directly into C execution binaries at runtime for multi-core scaling.",
                    "The GIL only applies to asynchronous code written with asyncio."
                ],
                "exp": "CPython's GIL prevents multi-core parallel execution of Python bytecode in threads, though I/O-bound threads release the GIL while waiting for I/O."
            },
            {
                "q": "What is the exact memory optimization mechanism of __slots__ in Python class definitions?",
                "rawOpts": [
                    "__slots__ suppresses the creation of the dynamic __dict__ and __weakref__ instance dictionaries, replacing them with a fixed-size array of pointers allocated directly within the C struct.",
                    "It compresses class method bytecode using zlib compression in memory.",
                    "It converts class attributes into immutable C-level constants.",
                    "It prevents instances of the class from being garbage collected."
                ],
                "exp": "__slots__ eliminates instance __dict__ dictionaries, saving significant RAM per object when creating millions of instances."
            }
        ]
    },
    "SQL": {
        "Easy": [
            {
                "q": "Which SQL clause is used to filter records before grouping occurs?",
                "rawOpts": [
                    "WHERE",
                    "HAVING",
                    "GROUP BY",
                    "ORDER BY"
                ],
                "exp": "WHERE filters raw rows prior to aggregation."
            }
        ],
        "Medium": [
            {
                "q": "What is the difference between a WHERE clause and a HAVING clause in SQL?",
                "rawOpts": [
                    "WHERE filters individual rows prior to GROUP BY aggregation; HAVING filters aggregated groups after GROUP BY evaluation.",
                    "WHERE can only be used with SELECT statements; HAVING can only be used with UPDATE statements.",
                    "HAVING executes faster than WHERE because it skips index lookups.",
                    "WHERE filters string data; HAVING filters numeric data."
                ],
                "exp": "WHERE filters table rows before aggregation; HAVING filters aggregated group metrics (e.g. SUM, COUNT)."
            }
        ],
        "Hard": [
            {
                "q": "Which Transaction Isolation Level prevents Phantom Reads according to the SQL standard?",
                "rawOpts": [
                    "SERIALIZABLE (or REPEATABLE READ with Range/Predicate locks in InnoDB)",
                    "READ COMMITTED",
                    "READ UNCOMMITTED",
                    "SNAPSHOT ISOLATION WITHOUT WRITE LOCKS"
                ],
                "exp": "SERIALIZABLE isolation prevents phantom reads by acquiring predicate or range locks on query ranges."
            },
            {
                "q": "In RDBMS query engine optimization, when does a database engine choose a Hash Join over a B-Tree Index Nested Loop Join?",
                "rawOpts": [
                    "When joining two large unindexed datasets where one set fits into memory (hash table build side) and sequential scanning is faster than random index lookups.",
                    "When joining small tables with primary key indexes.",
                    "When performing single-row lookup queries via unique keys.",
                    "When sorting results in ascending order using ORDER BY."
                ],
                "exp": "Hash joins scan large datasets into an in-memory hash table, outperforming random index lookups when indexing is absent or bulk scanning is cheaper."
            }
        ]
    },
    "HR & Behavioral Leadership": {
        "Easy": [
            {
                "q": "What does the 'S' stand for in the STAR interview response method?",
                "rawOpts": [
                    "Situation",
                    "Strategy",
                    "Solution",
                    "Standard"
                ],
                "exp": "STAR stands for Situation, Task, Action, and Result."
            }
        ],
        "Medium": [
            {
                "q": "When leading a critical technical migration with cross-team dependencies, how do you handle unexpected delays?",
                "rawOpts": [
                    "Communicate transparently with affected stakeholders early, re-evaluate critical path risks, adjust scope/milestones, and document mitigation plans.",
                    "Work overtime silently without notifying project managers.",
                    "Blame dependent teams publicly during executive status updates.",
                    "Cut testing coverage completely to meet initial release dates."
                ],
                "exp": "Proactive transparency, risk re-assessment, and stakeholder alignment are essential leadership behaviors."
            }
        ],
        "Hard": [
            {
                "q": "Describe a scenario where architectural trade-offs forced you to choose between technical debt accumulation and missing a critical business product launch window.",
                "rawOpts": [
                    "Explicitly quantify technical trade-offs, gain leadership buy-in for temporary compromises, establish a post-launch remediation roadmap, and enforce architectural guardrails.",
                    "Refuse to launch until all code achieves 100% ideal architectural purity.",
                    "Bypass all code reviews and deploy unverified code directly to production.",
                    "Resign from the team to avoid accountability for future refactoring."
                ],
                "exp": "Senior leaders balance pragmatic business delivery with explicit risk management and post-launch tech debt repayment plans."
            }
        ]
    }
}

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
    return {"status": "ok", "service": "Python KodeWithK AI Interview Engine", "timestamp": time.time()}

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
        else "DO NOT include any HR or behavioral soft-skills questions unless explicitly listed in selected topics. Generate questions strictly from the technical topics provided."
    )

    difficulty_guide = {
        "Easy": "Target junior engineers: Focus on basic syntax, foundational methods, and standard definitions.",
        "Medium": "Target mid-level engineers: Focus on intermediate architectural patterns, asynchronous execution, framework idioms, and common optimization techniques.",
        "Hard": "Target SENIOR/EXPERT STAFF ENGINEERS: Ask TOUGH, ADVANCED, EXPERT-LEVEL interview questions! Focus on deep engine mechanics, memory allocation (__slots__, V8 hidden classes, garbage collection cycles), GIL/concurrency primitives, race conditions, distributed systems trade-offs, and complex edge cases. DO NOT ask beginner or surface-level questions!"
    }.get(difficulty, "Match the requested difficulty precisely.")

    prompt = f"""You are a Senior Technical Interviewer at Google, NVIDIA, and Meta.
Generate EXACTLY {count} unique interview questions based strictly on topics [{', '.join(selected_techs)}] and difficulty "{difficulty}".

STRICT DIFFICULTY ENFORCEMENT ({difficulty}):
- {difficulty_guide}

CRITICAL DEDUPLICATION REQUIREMENT:
- EVERY QUESTION MUST BE COMPLETELY UNIQUE AND FREELY RANDOMIZED. Absolutely zero duplicate question stems or repeated concepts in the JSON array!
- Match the questions ACCURATELY to the domain and difficulty level!
- {hr_instruction}

STRICT FORMAT RULES:
1. Generate EXACTLY {count} questions total.
2. EXACTLY {mcq_count} questions MUST BE MULTIPLE CHOICE ('mcq' or 'true_false') with 4 distinct options ("A. ...", "B. ...", "C. ...", "D. ...").
3. EXACTLY {typing_count} question(s) MUST BE FREE-TEXT TYPING QUESTIONS ('text' or 'scenario').
4. RANDOMIZE MCQ CORRECT ANSWERS: Vary the correct answer position randomly across "A", "B", "C", and "D". DO NOT always make Option A the correct answer!

Return ONLY a valid JSON array of {count} objects matching this JSON schema:
[
  {{
    "id": "q_1",
    "question": "string",
    "type": "mcq | true_false | text | scenario",
    "difficulty": "{difficulty}",
    "technology": "specific tech from selected topics",
    "options": ["A...", "B...", "C...", "D..."] (REQUIRED if type is mcq or true_false),
    "correctAnswer": "string",
    "explanation": "string",
    "keywords": ["string", "string"]
  }}
]
Output raw JSON array only."""

    if api_key:
        try:
            req_data = json.dumps({
                "model": "meta/llama-3.3-70b-instruct",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.6,
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

            with urllib.request.urlopen(req, timeout=25) as response:
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
                                "explanation": q.get("explanation", f"Core concepts behind {tech_name}."),
                                "keywords": q.get("keywords", [tech_name, "fundamentals"])
                            })

                            if len(formatted_questions) >= count:
                                break
                        
                        if len(formatted_questions) == count:
                            return {"questions": formatted_questions, "source": "Python NVIDIA AI Engine"}
        except Exception as e:
            print(f"[Python API Error] Exception during NVIDIA call: {e}")

    # Fallback Generator with Strict Deduplication
    seen_stems = set()
    fallback_questions = []
    typing_indices = set([count - 1])

    # Dynamic concept pool to guarantee 100% unique questions for any question count
    dynamic_topics = [
        "semantic page structure and accessibility landmarks",
        "inline CSS styling attributes and DOM element specificity",
        "hyperlink anchoring and target frame navigation",
        "image text alternative attributes and screen reader fallbacks",
        "form input validation attributes and field constraint enforcement",
        "document object model tree rendering and block level element layout",
        "table structure elements and caption bindings",
        "media container elements and source fallback tags",
        "meta viewport configurations and responsive scaling",
        "script deferment and asynchronous script load execution"
    ]

    for i in range(count):
        tech = selected_techs[i % len(selected_techs)]
        is_typing = (i in typing_indices)

        tech_bank = REALISTIC_TECH_BANK.get(tech, {}).get(difficulty) or REALISTIC_TECH_BANK.get(tech, {}).get("Easy") or []
        
        # Pick unused static question if available
        available = [item for item in tech_bank if item["q"].lower() not in seen_stems]

        if is_typing:
            q_text = f"Explain key implementation principles, optimization techniques, and best practices when working with {tech} in a web application."
            if q_text.lower() in seen_stems:
                q_text = f"Describe how to debug, structure, and optimize {tech} components in production systems."
            seen_stems.add(q_text.lower())

            fallback_questions.append({
                "id": f"py_fb_{i+1}_{int(time.time())}",
                "question": q_text,
                "type": "text",
                "difficulty": difficulty,
                "technology": tech,
                "correctAnswer": f"Clear technical response covering {tech} core syntax, usage patterns, and practical execution.",
                "explanation": f"Understanding {tech} requires clear articulation of foundational concepts and implementation details.",
                "keywords": [tech, "best practice", "technical"]
            })
        elif available:
            random.shuffle(available)
            q_template = available.pop(0)
            seen_stems.add(q_template["q"].lower())
            opts, correct_ans = shuffle_options_with_correct_pos(q_template["rawOpts"])

            fallback_questions.append({
                "id": f"py_fb_{i+1}_{int(time.time())}",
                "question": q_template["q"],
                "type": "mcq",
                "difficulty": difficulty,
                "technology": tech,
                "options": opts,
                "correctAnswer": correct_ans,
                "explanation": q_template["exp"],
                "keywords": [tech, "fundamentals"]
            })
        else:
            # Dynamic distinct question generator
            concept = dynamic_topics[i % len(dynamic_topics)]
            q_text = f"What is the primary function or best practice concerning {concept} in {tech}?"
            
            # Ensure unique stem
            counter = 1
            while q_text.lower() in seen_stems:
                q_text = f"Which statement best describes the role of {concept} (aspect #{counter}) in {tech}?"
                counter += 1

            seen_stems.add(q_text.lower())

            raw_opts = [
                f"It enforces structured standard execution for {concept} in {tech}.",
                f"It is a deprecated pattern that breaks modern layout rendering.",
                f"It creates global scope pollution without validation bounds.",
                f"None of the above"
            ]
            opts, correct_ans = shuffle_options_with_correct_pos(raw_opts)

            fallback_questions.append({
                "id": f"py_fb_{i+1}_{int(time.time())}",
                "question": q_text,
                "type": "mcq",
                "difficulty": difficulty,
                "technology": tech,
                "options": opts,
                "correctAnswer": correct_ans,
                "explanation": f"Foundational understanding of {concept} in {tech}.",
                "keywords": [tech, "fundamentals"]
            })

    return {"questions": fallback_questions, "source": "Python Realistic Engine"}

@app.post("/evaluate")
def evaluate_answer(payload: EvaluateRequest):
    q = payload.question
    user_ans = payload.userAnswer
    api_key = get_active_api_key(payload.apiKey)

    if api_key:
        try:
            prompt = f"""Evaluate candidate answer semantically.
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
  "explanation": "string detailed explanation",
  "commonMistakes": "string common candidate pitfalls",
  "keywordsMatched": ["string"],
  "feedbackSummary": "string short verdict"
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
                            "commonMistakes": eval_data.get("commonMistakes") or "Vague explanation without concrete STAR steps.",
                            "keywordsMatched": eval_data.get("keywordsMatched") or q.get("keywords", []),
                            "feedbackSummary": eval_data.get("feedbackSummary") or "Response processed"
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
