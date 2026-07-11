'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInterviewStore } from '@/stores/interview-store';
import { getAIHeaders } from '@/stores/settings-store';
import { useLocale } from 'next-intl';

interface UseInterviewChatOptions {
  sessionId: string;
  roundId: string;
  selectedModel?: string;
}

export function useInterviewChat({ sessionId, roundId, selectedModel }: UseInterviewChatOptions) {
  const [input, setInput] = useState('');
  const locale = useLocale();
  const modelRef = useRef(selectedModel);
  modelRef.current = selectedModel;

  const roundIdRef = useRef(roundId);
  roundIdRef.current = roundId;

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/interview/${sessionId}/chat`,
        body: () => ({
          roundId: roundIdRef.current,
          model: modelRef.current,
          locale,
        }),
        headers: () => {
          const fp = typeof window !== 'undefined' ? getStoredFingerprint() : null;
          return { ...(fp ? { 'x-fingerprint': fp } : {}), ...getAIHeaders() };
        },
      }),
    [sessionId, locale]
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: `interview-${sessionId}-${roundId}`,
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
    if (!lastAssistant) return;

    const textPart = lastAssistant.parts?.find((p: any) => p.type === 'text');
    const text = (textPart as any)?.text || '';
    if (text.includes('[ROUND_COMPLETE]') && !isLoading) {
      const store = useInterviewStore.getState();
      store.updateRound(roundIdRef.current, { status: 'completed' });
    }
  }, [messages, isLoading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage({ text: input });
      setInput('');
    },
    [input, sendMessage, isLoading]
  );

  const resetMessages = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    error,
    resetMessages,
    sendMessage,
    setMessages,
  };
}
