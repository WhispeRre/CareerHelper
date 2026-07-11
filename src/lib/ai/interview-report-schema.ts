import { z } from 'zod/v4';

// Lenient inner schemas — fields default so partial AI output still validates
const lenientQuestionEvaluationSchema = z.object({
  question: z.string().default(''),
  answerSummary: z.string().default(''),
  score: z.number().min(1).max(5).default(3),
  highlights: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  referenceTips: z.string().default(''),
  marked: z.boolean().default(false),
  hinted: z.boolean().default(false),
  skipped: z.boolean().default(false),
});

const lenientRoundEvaluationSchema = z.object({
  roundId: z.string().default(''),
  interviewerType: z.string().default(''),
  interviewerName: z.string().default(''),
  score: z.number().min(0).max(100).default(0),
  feedback: z.string().default(''),
  questions: z.array(lenientQuestionEvaluationSchema).default([]),
});

const lenientDimensionScoreSchema = z.object({
  dimension: z.string().default(''),
  score: z.number().min(0).max(100).default(0),
  maxScore: z.number().default(100),
});

const lenientImprovementItemSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).default('medium'),
  area: z.string().default(''),
  description: z.string().default(''),
  resources: z.array(z.string()).default([]),
});

export const interviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100).default(0),
  dimensionScores: z.array(lenientDimensionScoreSchema).default([]),
  roundEvaluations: z.array(lenientRoundEvaluationSchema).default([]),
  overallFeedback: z.string().default(''),
  improvementPlan: z.array(lenientImprovementItemSchema).default([]),
});

export type InterviewReportOutput = z.infer<typeof interviewReportSchema>;
