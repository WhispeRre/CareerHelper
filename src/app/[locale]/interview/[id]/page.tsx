'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { use, useEffect, useState } from 'react';
import { InterviewRoom } from '@/components/interview/interview-room';
import { useInterviewStore } from '@/stores/interview-store';
import { Skeleton } from '@/components/ui/skeleton';
import type { UIMessage } from 'ai';

/** Convert DB interview messages to UIMessage format for useChat */
function dbMessagesToUIMessages(dbMessages: any[]): UIMessage[] {
  return dbMessages
    .filter((m: any) => m.role !== 'system') // system messages are for AI context only
    .map((m: any) => ({
      id: m.id,
      role: m.role === 'interviewer' ? 'assistant' as const : 'user' as const,
      parts: [{ type: 'text' as const, text: m.content }],
    }));
}

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const { setSession, setStatus } = useInterviewStore();

  useEffect(() => {
    const fp = getStoredFingerprint();
    fetch(`/api/interview/${id}`, {
      headers: fp ? { 'x-fingerprint': fp } : {},
    })
      .then((r) => r.json())
      .then(({ session, rounds }) => {
        setSession(session, rounds);
        if (session.status === 'paused') {
          setStatus('in_progress');
        }

        // Load messages for the current round
        const currentRound = rounds[session.currentRound];
        if (currentRound?.messages?.length > 0) {
          setInitialMessages(dbMessagesToUIMessages(currentRound.messages));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, setSession, setStatus]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 py-8">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[60vh] w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return <InterviewRoom sessionId={id} initialMessages={initialMessages} />;
}
