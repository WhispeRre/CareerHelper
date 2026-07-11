'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewerMessageProps {
  content: string;
  config: InterviewerConfig;
}

export function InterviewerMessage({ content, config }: InterviewerMessageProps) {
  const displayContent = content.replace(/\[ROUND_COMPLETE\]/g, '').trim();

  return (
    <div className="max-w-[85%]">
      <div className="rounded-r-2xl border-l-[3px] border-brand bg-zinc-50 px-4 py-3 dark:bg-zinc-800/50">
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
