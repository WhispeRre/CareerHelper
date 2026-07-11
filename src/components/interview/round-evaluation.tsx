'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QuestionReview } from './question-review';
import { INTERVIEWER_COLORS, DEFAULT_INTERVIEWER_COLOR } from '@/lib/interview/interviewers';
import type { RoundEvaluation as RoundEvalType } from '@/types/interview';

interface RoundEvaluationProps {
  evaluation: RoundEvalType;
}

export function RoundEvaluation({ evaluation }: RoundEvaluationProps) {
  const t = useTranslations('interview');
  const [expanded, setExpanded] = useState(false);
  const colorClass = INTERVIEWER_COLORS[evaluation.interviewerType] || DEFAULT_INTERVIEWER_COLOR;

  return (
    <div className="rounded-lg border">
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex w-full items-center gap-3 rounded-t-lg p-4 text-left ${colorClass}`}
      >
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="font-medium">{evaluation.interviewerName}</span>
        <Badge variant="secondary">{t(`interviewers.${evaluation.interviewerType}`)}</Badge>
        <span className="ml-auto text-lg font-bold">{evaluation.score}</span>
      </button>
      {expanded && (
        <div className="space-y-3 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{evaluation.feedback}</p>
          <h4 className="text-sm font-medium">{t('report.questionReview')}</h4>
          {evaluation.questions.map((q, i) => (
            <QuestionReview key={i} evaluation={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
