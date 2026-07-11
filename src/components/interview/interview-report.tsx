'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { ReportOverview } from './report-overview';
import { RadarChart } from './radar-chart';
import { RoundEvaluation } from './round-evaluation';
import { ImprovementPlan } from './improvement-plan';
import { HistoryComparison } from './history-comparison';
import { ExportButtons } from './export-buttons';
import type { InterviewReport, InterviewSession, DimensionScore, RoundEvaluation as RoundEvalType, ImprovementItem } from '@/types/interview';

interface InterviewReportViewProps {
  report: InterviewReport;
  session: InterviewSession;
}

export function InterviewReportView({ report, session }: InterviewReportViewProps) {
  const t = useTranslations('interview.report');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/interview">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('backToLobby')}
          </Button>
        </Link>
        <div className="hidden sm:flex">
          <ExportButtons report={report} session={session} />
        </div>
      </div>

      <ReportOverview report={report} session={session} />
      <RadarChart dimensions={report.dimensionScores as DimensionScore[]} />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t('roundEvaluation')}</h3>
        {(report.roundEvaluations as RoundEvalType[]).map((evaluation, i) => (
          <RoundEvaluation key={i} evaluation={evaluation} />
        ))}
      </div>

      <ImprovementPlan items={report.improvementPlan as ImprovementItem[]} />
      <HistoryComparison currentReport={report} />
    </div>
  );
}
