import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { action, resumeText, messages, apiKey } = await req.json();
    const activeKey = (apiKey || process.env.GROQ_API_KEY || '').trim();
    const cleanResume = (resumeText || '').slice(0, 15000);

    if (!activeKey) {
      return NextResponse.json({ error: 'No API Key provided' }, { status: 400 });
    }

    let prompt = '';
    let payloadMessages = [];

    if (action === 'summarize') {
      prompt = `You are a professional recruiter and career coach. Analyze the following resume text and provide a concise, high-impact bulleted summary of:
1. Executive Summary (1-2 sentences)
2. Core Technical & Professional Skills
3. Notable Strengths
4. Major Areas of Improvement / Growth advice for the candidate.

Resume Content:
${cleanResume}

Format with clear headers and bullet points in clean Markdown.`;

      payloadMessages = [{ role: 'user', content: prompt }];
    } else if (action === 'chat') {
      const systemMessage = {
        role: 'system',
        content: `You are an expert AI Career Coach, Recruiter, and Technical Interviewer. You are analyzing the candidate's resume.
Here is the resume content:
---
${cleanResume}
---
Answer the candidate's or recruiter's questions objectively, professionally, and constructively based on the resume. Offer specific, actionable resume advice, skill assessments, and interview prep tips based on their profile. Keep responses formatted in clean, easy-to-read Markdown.`
      };

      payloadMessages = [
        systemMessage,
        ...messages.map((m: any) => ({ role: m.role, content: m.content }))
      ];
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: payloadMessages,
        temperature: action === 'summarize' ? 0.3 : 0.5,
        max_tokens: action === 'summarize' ? 1024 : 2048,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Groq API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';

    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error in /api/resume:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
