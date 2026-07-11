'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { use, useEffect, useState } from 'react';
import { InterviewReportView } from '@/components/interview/interview-report';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsStore, getAIHeaders } from '@/stores/settings-store';
import type { InterviewReport, InterviewSession } from '@/types/interview';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const hydrated = useSettingsStore((s) => s._hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const fp = getStoredFingerprint();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fp ? { 'x-fingerprint': fp } : {}),
      ...getAIHeaders(),
    };

    fetch(`/api/interview/${id}`, { headers })
      .then((r) => r.json())
      .then(({ session: s, report: r }) => {
        setSession(s);
        if (r) {
          setReport(r);
          setLoading(false);
        } else {
          fetch(`/api/interview/${id}/report`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ locale: document.documentElement.lang || 'zh' }),
          })
            .then((res) => res.json())
            .then((data) => setReport(data))
            .catch(console.error)
            .finally(() => setLoading(false));
        }
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id, hydrated]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!report || !session) {
    return <div className="py-20 text-center text-zinc-500">Failed to load report</div>;
  }

  return <InterviewReportView report={report} session={session} />;
}
