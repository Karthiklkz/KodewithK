'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Sparkles,
  Info,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { extractTextFromFile } from '@/lib/fileParser';
import { summarizeResume } from '@/lib/nvidiaClient';

interface ResumeQAProps {
  apiKey: string;
  onStartResumeInterview?: (resumeText: string) => void;
}

export const ResumeQA: React.FC<ResumeQAProps> = ({ apiKey, onStartResumeInterview }) => {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsExtracting(true);
    setSummary('');
    
    try {
      const text = await extractTextFromFile(selectedFile);
      setResumeText(text);
      setIsExtracting(false);
      
      // Auto-summarize the resume once extracted
      setIsSummarizing(true);
      const summaryResult = await summarizeResume(text, apiKey);
      setSummary(summaryResult);
    } catch (error) {
      console.error('Error processing resume file:', error);
      setSummary(`### Analysis Failed\n\nUnable to extract readable text from your file. Please ensure it is a valid PDF, Word document, image, or text file.`);
    } finally {
      setIsExtracting(false);
      setIsSummarizing(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResumeText('');
    setSummary('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Helper function to render simple markdown inline/block styles
  const renderInlineMarkdown = (text: string) => {
    const boldParts = text.split(/\*\*([\s\S]*?)\*\*/g);
    return boldParts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="font-extrabold text-cyan-300">
            {part}
          </strong>
        );
      }
      const codeParts = part.split(/`([^`]+)`/g);
      return codeParts.map((subPart, j) => {
        if (j % 2 === 1) {
          return (
            <code key={j} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-teal-400 font-mono text-xs">
              {subPart}
            </code>
          );
        }
        return subPart;
      });
    });
  };

  const renderMarkdown = (text: string) => {
    if (!text) return null;
    const blocks = text.split(/\n\n+/);
    return (
      <div className="space-y-3">
        {blocks.map((block, idx) => {
          const trimmed = block.trim();
          if (!trimmed) return null;

          if (trimmed.startsWith('```')) {
            const lines = trimmed.split('\n');
            const code = lines.slice(1, -1).join('\n');
            return (
              <pre key={idx} className="p-3 bg-slate-950/90 border border-slate-800/80 rounded-xl text-xs font-mono text-cyan-300 overflow-x-auto my-2 shadow-inner">
                <code>{code}</code>
              </pre>
            );
          }

          if (trimmed.startsWith('#')) {
            const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
            if (match) {
              const level = match[1].length;
              const content = match[2];
              const sizeClass = 
                level === 1 ? 'text-xl font-black text-white border-b border-slate-800 pb-1 mt-4' :
                level === 2 ? 'text-lg font-bold text-white mt-3' :
                'text-sm font-semibold text-slate-200 mt-2';
              return <div key={idx} className={sizeClass}>{renderInlineMarkdown(content)}</div>;
            }
          }

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.match(/^\d+\.\s/)) {
            const lines = trimmed.split('\n');
            return (
              <ul key={idx} className="list-disc pl-5 space-y-1.5 my-2">
                {lines.map((line, lIdx) => {
                  const cleanLine = line.replace(/^[\*\-\d+\.]\s*/, '');
                  return (
                    <li key={lIdx} className="text-slate-300 text-xs sm:text-sm">
                      {renderInlineMarkdown(cleanLine)}
                    </li>
                  );
                })}
              </ul>
            );
          }

          if (trimmed.startsWith('>')) {
            const content = trimmed.replace(/^>\s*/, '');
            return (
              <blockquote key={idx} className="border-l-4 border-cyan-500 pl-4 py-1 italic text-slate-400 bg-cyan-950/10 rounded-r my-2 text-xs sm:text-sm">
                {renderInlineMarkdown(content)}
              </blockquote>
            );
          }

          return (
            <p key={idx} className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {renderInlineMarkdown(trimmed)}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 animate-fade-in">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            AI Resume Analyzer
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Upload your resume to receive an immediate AI summary, skill mapping, and launch your tailored mock interview.
          </p>
        </div>
      </div>

      {/* Main Analyzer Card Container */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <h3 className="text-sm font-bold text-slate-300 font-mono tracking-wider uppercase mb-5 flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          Resume Document Selection
        </h3>

        {!file ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="group border-2 border-dashed border-slate-800 hover:border-cyan-500/50 hover:bg-cyan-950/5 rounded-xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 group-hover:scale-110 transition-all duration-300 shadow-md">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                Upload Resume File
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Drag & drop or click to browse
              </p>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-2 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800/80">
              PDF, DOCX, TXT, PNG, JPG
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Pill */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-850 rounded-xl shadow-inner">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-cyan-950/30 border border-cyan-900/40 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-200 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
                title="Remove resume"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Extraction Loading */}
            {isExtracting && (
              <div className="flex flex-col items-center justify-center py-12 gap-3 border border-slate-850 rounded-xl bg-slate-950/40 animate-pulse">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <p className="text-xs text-slate-400 font-mono">
                  Parsing document layout and content...
                </p>
              </div>
            )}

            {/* Summary View */}
            {!isExtracting && (summary || isSummarizing) && (
              <div className="border border-slate-800/80 rounded-xl p-5 bg-slate-950/50 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    AI Analysis & Skill Mapping
                  </span>
                  {isSummarizing && (
                    <span className="text-[10px] text-teal-400 flex items-center gap-1 font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" /> Generating...
                    </span>
                  )}
                </div>

                {onStartResumeInterview && !isSummarizing && summary && !summary.includes("Analysis Failed") && (
                  <button
                    onClick={() => onStartResumeInterview(resumeText)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 active:scale-98 transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-200 animate-pulse" />
                    Start Resume-Based Interview
                  </button>
                )}
                
                <div className="max-h-[400px] overflow-y-auto pr-1 text-slate-300 scrollbar-thin">
                  {isSummarizing ? (
                    <div className="space-y-2 py-4">
                      <div className="h-4 bg-slate-800/50 rounded w-3/4 animate-pulse" />
                      <div className="h-4 bg-slate-800/50 rounded w-5/6 animate-pulse" />
                      <div className="h-4 bg-slate-800/50 rounded w-2/3 animate-pulse" />
                      <div className="h-4 bg-slate-800/50 rounded w-4/5 animate-pulse" />
                    </div>
                  ) : (
                    renderMarkdown(summary)
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Privacy & Processing Info */}
      <div className="bg-slate-900/30 border border-slate-850 rounded-xl p-4 text-xs text-slate-400 flex items-start gap-2.5 max-w-4xl mx-auto">
        <Info className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-300">Privacy & Processing Info</p>
          <p className="leading-relaxed">
            Resume parsing is performed entirely on your device. Only the extracted text is securely transmitted to the server (or processed locally if offline) to power the Q&A sessions. No files are stored permanently.
          </p>
        </div>
      </div>
    </div>
  );
};
