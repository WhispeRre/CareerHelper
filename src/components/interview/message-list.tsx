'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { InterviewerMessage } from './interviewer-message';
import { CandidateMessage } from './candidate-message';
import { HIDDEN_MESSAGES } from '@/lib/interview/constants';
import type { InterviewerConfig } from '@/types/interview';

interface MessageListProps {
  messages: UIMessage[];
  interviewerConfig: InterviewerConfig;
}

export function MessageList({ messages, interviewerConfig }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((msg) => {
        const textPart = msg.parts?.find((p: any) => p.type === 'text');
        const content = (textPart as any)?.text || '';
        if (!content) return null;

        // Hide system trigger messages
        if (msg.role === 'user' && HIDDEN_MESSAGES.has(content.trim())) {
          return null;
        }

        if (msg.role === 'assistant') {
          return <InterviewerMessage key={msg.id} content={content} config={interviewerConfig} />;
        }
        if (msg.role === 'user') {
          return <CandidateMessage key={msg.id} content={content} messageId={msg.id} />;
        }
        return null;
      })}
      <div ref={endRef} />
    </div>
  );
}
