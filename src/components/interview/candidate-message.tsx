'use client';

import { Bookmark, Lightbulb, SkipForward } from 'lucide-react';
import { useInterviewStore } from '@/stores/interview-store';
import { HINT_MESSAGE, SKIP_MESSAGE } from '@/lib/interview/constants';

interface CandidateMessageProps {
  content: string;
  messageId: string;
}

export function CandidateMessage({ content, messageId }: CandidateMessageProps) {
  const { markedMessages, hintedQuestions, skippedQuestions } = useInterviewStore();
  const isMarked = markedMessages.has(messageId);
  const isHinted = hintedQuestions.has(messageId);
  const isSkipped = skippedQuestions.has(messageId);

  const isHintTrigger = content.trim() === HINT_MESSAGE;
  const isSkipTrigger = content.trim() === SKIP_MESSAGE;
  const isSystemAction = isHintTrigger || isSkipTrigger;

  // System action messages get a distinct style
  if (isSystemAction) {
    return (
      <div className="flex justify-end">
        <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
          {isHintTrigger && <Lightbulb className="h-3 w-3 text-amber-500" />}
          {isSkipTrigger && <SkipForward className="h-3 w-3 text-zinc-400" />}
          <span>{isHintTrigger ? '请求了提示' : '跳过了此题'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <div className="max-w-[75%] rounded-2xl rounded-tr-none bg-gradient-to-br from-zinc-900 to-zinc-800 px-4 py-3 text-sm text-white dark:from-zinc-700 dark:to-zinc-800">
        <div className="whitespace-pre-wrap">{content}</div>
        {(isMarked || isHinted || isSkipped) && (
          <div className="mt-2 flex gap-2">
            {isMarked && <Bookmark className="h-3 w-3 text-yellow-300" />}
            {isHinted && <Lightbulb className="h-3 w-3 text-amber-300" />}
            {isSkipped && <SkipForward className="h-3 w-3 text-zinc-400" />}
          </div>
        )}
      </div>
    </div>
  );
}
