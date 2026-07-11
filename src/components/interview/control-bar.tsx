'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useTranslations, useLocale } from 'next-intl';
import { SkipForward, Lightbulb, Bookmark, BookmarkCheck, StopCircle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterviewStore } from '@/stores/interview-store';
import { getAIHeaders } from '@/stores/settings-store';

interface ControlBarProps {
  sessionId: string;
  roundId: string;
  lastAssistantMessageId?: string;
  isLoading: boolean;
  onTriggerAI: (text: string) => void;
  onEndRound: () => void;
}

export function useInterviewControls({ sessionId, roundId, lastAssistantMessageId, isLoading, onTriggerAI, onEndRound }: ControlBarProps) {
  const t = useTranslations('interview.room');
  const locale = useLocale();
  const { markedMessages, toggleMark, addHinted, addSkipped } = useInterviewStore();
  const isMarked = lastAssistantMessageId ? markedMessages.has(lastAssistantMessageId) : false;

  const sendControl = async (action: string) => {
    const fp = getStoredFingerprint();
    await fetch(`/api/interview/${sessionId}/control`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(fp ? { 'x-fingerprint': fp } : {}),
        ...getAIHeaders(),
      },
      body: JSON.stringify({ action, roundId, locale }),
    });
  };

  const handleSkip = async () => {
    if (lastAssistantMessageId) addSkipped(lastAssistantMessageId);
    await sendControl('skip');
    onTriggerAI('这个问题我暂时没有太好的思路，能换一个问题吗？');
  };

  const handleHint = async () => {
    if (lastAssistantMessageId) addHinted(lastAssistantMessageId);
    await sendControl('hint');
    onTriggerAI('这个问题我不太确定方向，能给我一些思路上的引导吗？');
  };

  const handleEndRound = async () => {
    await sendControl('end_round');
    onEndRound();
  };

  const handlePause = async () => {
    await sendControl('pause');
  };

  const handleMark = () => {
    if (!lastAssistantMessageId) return;
    toggleMark(lastAssistantMessageId);
    const fp = getStoredFingerprint();
    fetch(`/api/interview/${sessionId}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(fp ? { 'x-fingerprint': fp } : {}),
      },
      body: JSON.stringify({ messageId: lastAssistantMessageId, marked: !isMarked }),
    });
  };

  const controls = (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={handleSkip} disabled={isLoading}>
        <SkipForward className="h-3 w-3" />
        <span className="hidden sm:inline">{t('skip')}</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={handleHint} disabled={isLoading}>
        <Lightbulb className="h-3 w-3" />
        <span className="hidden sm:inline">{t('hint')}</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={handleMark} disabled={!lastAssistantMessageId}>
        {isMarked ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
        <span className="hidden sm:inline">{isMarked ? t('unmark') : t('mark')}</span>
      </Button>
      <div className="mx-1 h-4 w-px bg-zinc-200 dark:bg-zinc-700" />
      <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg px-2 text-xs text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950" onClick={handleEndRound} disabled={isLoading}>
        <StopCircle className="h-3 w-3" />
        <span className="hidden sm:inline">{t('endRound')}</span>
      </Button>
      <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-lg px-2 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100" onClick={handlePause}>
        <Pause className="h-3 w-3" />
        <span className="hidden sm:inline">{t('pause')}</span>
      </Button>
    </div>
  );

  return controls;
}
