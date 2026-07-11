import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users, resumes } from './schema';

export const interviewSessions = sqliteTable('interview_sessions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  resumeId: text('resume_id').references(() => resumes.id),
  jobDescription: text('job_description').notNull(),
  jobTitle: text('job_title').notNull().default(''),
  selectedInterviewers: text('selected_interviewers', { mode: 'json' }).notNull().default('[]'),
  currentRound: integer('current_round').notNull().default(0),
  status: text('status', { enum: ['preparing', 'in_progress', 'paused', 'completed'] }).notNull().default('preparing'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const interviewRounds = sqliteTable('interview_rounds', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }),
  interviewerType: text('interviewer_type').notNull(),
  interviewerConfig: text('interviewer_config', { mode: 'json' }).notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  status: text('status', { enum: ['pending', 'in_progress', 'completed', 'skipped'] }).notNull().default('pending'),
  questionCount: integer('question_count').notNull().default(0),
  maxQuestions: integer('max_questions').notNull().default(10),
  summary: text('summary', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const interviewMessages = sqliteTable('interview_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roundId: text('round_id').notNull().references(() => interviewRounds.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['interviewer', 'candidate', 'system'] }).notNull(),
  content: text('content').notNull(),
  metadata: text('metadata', { mode: 'json' }).default('{}'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});

export const interviewReports = sqliteTable('interview_reports', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull().references(() => interviewSessions.id, { onDelete: 'cascade' }).unique(),
  overallScore: integer('overall_score').notNull(),
  dimensionScores: text('dimension_scores', { mode: 'json' }).notNull(),
  roundEvaluations: text('round_evaluations', { mode: 'json' }).notNull(),
  overallFeedback: text('overall_feedback').notNull(),
  improvementPlan: text('improvement_plan', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
});
