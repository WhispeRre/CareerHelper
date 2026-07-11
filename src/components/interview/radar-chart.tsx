'use client';

import { useTranslations } from 'next-intl';
import {
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { DimensionScore } from '@/types/interview';

interface RadarChartProps {
  dimensions: DimensionScore[];
  comparisonDimensions?: DimensionScore[];
  comparisonLabel?: string;
}

export function RadarChart({ dimensions, comparisonDimensions, comparisonLabel }: RadarChartProps) {
  const t = useTranslations('interview.report');

  const data = dimensions.map((d) => {
    const item: Record<string, string | number> = {
      dimension: d.dimension,
      score: d.score,
    };
    if (comparisonDimensions) {
      const match = comparisonDimensions.find((c) => c.dimension === d.dimension);
      item.comparison = match?.score ?? 0;
    }
    return item;
  });

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
      <h3 className="mb-4 text-lg font-semibold">{t('dimensions')}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <RechartsRadar data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="dimension" className="text-xs" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar name={t('overallScore')} dataKey="score" stroke="#ec4899" fill="#ec4899" fillOpacity={0.3} />
          {comparisonDimensions && (
            <Radar
              name={comparisonLabel || 'Comparison'}
              dataKey="comparison"
              stroke="#6b7280"
              fill="#6b7280"
              fillOpacity={0.1}
              strokeDasharray="5 5"
            />
          )}
          {comparisonDimensions && <Legend />}
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
}
