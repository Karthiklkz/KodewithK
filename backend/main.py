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

# Large, non-repeating question bank per technology
REALISTIC_TECH_BANK = {
    "HTML": {
        "Easy": [
            {
                "q": "What is the effect of the <b> tag in HTML?",
                "rawOpts": [
                    "It converts the text within it to bold font.",
                    "It is used to write black-colored font.",
                    "It is used to change the font size.",
                    "None of the above."
                ],
                "exp": "The <b> tag formats text as bold without imparting extra semantic importance."
            },
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
                "q": "Which HTML tag is used to create a hyperlink?",
                "rawOpts": [
                    "<a>",
                    "<link>",
                    "<href>",
                    "<url>"
                ],
                "exp": "The <a> (anchor) tag with the href attribute creates hyperlinks."
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
            },
            {
                "q": "Which HTML tag is used to define an unordered list?",
                "rawOpts": [
                    "<ul>",
                    "<ol>",
                    "<li>",
                    "<list>"
                ],
                "exp": "The <ul> tag defines an unordered (bulleted) list."
            },
            {
                "q": "What is the correct HTML element for inserting a line break?",
                "rawOpts": [
                    "<br>",
                    "<lb>",
                    "<break>",
                    "<newline>"
                ],
                "exp": "The <br> void tag inserts a single line break."
            },
            {
                "q": "Which semantic HTML5 element is used to wrap navigation links?",
                "rawOpts": [
                    "<nav>",
                    "<header>",
                    "<section>",
                    "<aside>"
                ],
                "exp": "The <nav> tag specifies a block of major navigation links."
            },
            {
                "q": "Which attribute specifies that an input field must be filled out before submitting?",
                "rawOpts": [
                    "required",
                    "validate",
                    "mandatory",
                    "important"
                ],
                "exp": "The required boolean attribute enforces client-side form validation."
            },
            {
                "q": "Which HTML element represents the root element of a document?",
                "rawOpts": [
                    "<html>",
                    "<body>",
                    "<head>",
                    "<!DOCTYPE>"
                ],
                "exp": "The <html> tag is the top-level root container of an HTML document."
            },
            {
                "q": "What is the main difference between block and inline HTML elements?",
                "rawOpts": [
                    "Block elements start on a new line and take full width; inline elements take only necessary content width.",
                    "Inline elements cannot contain text.",
                    "Block elements can only be used inside the <head> section.",
                    "Inline elements automatically create paragraph margins."
                ],
                "exp": "Block-level elements start on a new line and span full container width by default."
            }
        ]
    },
    "CSS": {
        "Easy": [
            {
                "q": "Which CSS property is used to change the text color of an element?",
                "rawOpts": [
                    "color",
                    "text-color",
                    "font-color",
                    "foreground"
                ],
                "exp": "The color property sets foreground text color."
            },
            {
                "q": "What does box-sizing: border-box do in CSS?",
                "rawOpts": [
                    "Includes padding and border within the element's total declared width and height.",
                    "Removes all borders from the element.",
                    "Adds a 3D shadow around the element box.",
                    "Forces the element to occupy 100% of the viewport width."
                ],
                "exp": "border-box contains padding and borders inside the declared width/height."
            },
            {
                "q": "Which CSS unit is relative to the font-size of the root <html> element?",
                "rawOpts": [
                    "rem",
                    "em",
                    "px",
                    "vh"
                ],
                "exp": "rem units are relative to the root font-size."
            },
            {
                "q": "Which property is used to align flex items along the main axis in Flexbox?",
                "rawOpts": [
                    "justify-content",
                    "align-items",
                    "align-content",
                    "flex-direction"
                ],
                "exp": "justify-content aligns items along the primary axis."
            }
        ]
    },
    "JavaScript": {
        "Easy": [
            {
                "q": "Which keyword is used to declare a block-scoped variable that cannot be reassigned?",
                "rawOpts": [
                    "const",
                    "var",
                    "let",
                    "static"
                ],
                "exp": "const declares block-scoped read-only references."
            },
            {
                "q": "What is the evaluation of typeof NaN in JavaScript?",
                "rawOpts": [
                    "number",
                    "NaN",
                    "undefined",
                    "object"
                ],
                "exp": "In JS, NaN is categorized under the number data type."
            },
            {
                "q": "Which array method creates a new array populated with the results of calling a function on every element?",
                "rawOpts": [
                    "map()",
                    "forEach()",
                    "filter()",
                    "reduce()"
                ],
                "exp": "map() transforms array elements into a new array."
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
                "q": "What is the return value of type([]) in Python?",
                "rawOpts": [
                    "<class 'list'>",
                    "<class 'array'>",
                    "<class 'tuple'>",
                    "<class 'dict'>"
                ],
                "exp": "Square brackets [] instantiate Python lists."
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
            },
            {
                "q": "What does a PRIMARY KEY constraint guarantee in a database table?",
                "rawOpts": [
                    "Uniquely identifies each record with non-null values.",
                    "Encrypts table column values automatically.",
                    "Allows duplicate values for indexing purposes.",
                    "Links two tables together without unique indexing."
                ],
                "exp": "A PRIMARY KEY uniquely identifies table rows."
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
            },
            {
                "q": "When faced with conflicting priorities from multiple stakeholders, what is the best initial step?",
                "rawOpts": [
                    "Clarify business goals, assess urgency/impact, and align with management.",
                    "Accept all requests simultaneously without asking for timelines.",
                    "Ignore lower-priority stakeholders without explanation.",
                    "Halt all work until priorities resolve themselves."
                ],
                "exp": "Active communication aligns expectations constructively."
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

    prompt = f"""You are a Senior Technical Interviewer at Google, NVIDIA, and Meta.
Generate EXACTLY {count} unique interview questions based strictly on topics [{', '.join(selected_techs)}] and difficulty "{difficulty}".

CRITICAL DEDUPLICATION REQUIREMENT:
- EVERY QUESTION MUST BE COMPLETELY UNIQUE AND FREELY RANDOMIZED. Absolutely zero duplicate question stems or repeated concepts in the JSON array!
- Match the questions ACCURATELY to the domain and difficulty level!
- Dynamically generate fresh, diverse technical questions covering varied core concepts for the selected topics.
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
