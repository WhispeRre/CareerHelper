'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { RadarChart } from './radar-chart';
import type { HistoryStats, DimensionScore, InterviewReport } from '@/types/interview';

interface HistoryComparisonProps {
  currentReport: InterviewReport;
}

export function HistoryComparison({ currentReport }: HistoryComparisonProps) {
  const t = useTranslations('interview.report');
  const [stats, setStats] = useState<HistoryStats | null>(null);

  useEffect(() => {
    const fp = getStoredFingerprint();
    fetch('/api/interview/history/stats', {
      headers: fp ? { 'x-fingerprint': fp } : {},
    })
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats || stats.sessions.length < 2) return null;

  const trendData = stats.sessions.map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    score: s.overallScore,
    jobTitle: s.jobTitle,
  }));

  const lastSession = stats.sessions.find((s) => s.id !== currentReport.sessionId);
  const lastDimensions = lastSession?.dimensionScores as DimensionScore[] | undefined;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
        <h3 className="mb-4 text-lg font-semibold">{t('trend')}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#ec4899" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {lastDimensions && (
        <RadarChart
          dimensions={currentReport.dimensionScores as DimensionScore[]}
          comparisonDimensions={lastDimensions}
          comparisonLabel={t('comparedToLast')}
        />
      )}
    </div>
  );
}
