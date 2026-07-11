# Interview Simulation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a JD-based mock interview feature where AI plays different interviewer roles in sequence, then generates a detailed feedback report with scoring, per-question review, radar chart, and historical comparison.

**Architecture:** Independent module (`/interview` routes, dedicated API endpoints, new DB tables, dedicated Zustand store) sharing the existing AI provider layer (`src/lib/ai/provider.ts`), auth system, i18n infrastructure, and shadcn/ui components. Streaming chat uses the same `streamText()` + `toUIMessageStreamResponse()` pattern as the existing resume chat.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui, Drizzle ORM (SQLite), Zustand 5, Vercel AI SDK v6 (`streamText`, `generateObject`, `useChat`), Zod v4, recharts (new dependency for radar/line charts), next-intl, @dnd-kit

---

## File Structure

### New files

```
src/lib/db/schema-interview.ts                    — 4 new Drizzle tables
src/lib/db/repositories/interview.repository.ts   — CRUD for interview sessions/rounds/messages/reports
src/types/interview.ts                             — TypeScript types & interfaces
src/lib/ai/interview-prompts.ts                    — System prompt builders per interviewer type
src/lib/ai/interview-report-schema.ts              — Zod schema for report generation
src/lib/interview/interviewers.ts                  — Preset interviewer configs (6 types, zh/en)
src/stores/interview-store.ts                      — Zustand store for interview state
src/hooks/use-interview-chat.ts                    — useChat wrapper for interview streaming
src/app/api/interview/route.ts                     — POST (create) + GET (list) sessions
src/app/api/interview/[id]/route.ts                — GET (detail) + PUT (update) + DELETE
src/app/api/interview/[id]/chat/route.ts           — POST streaming interview chat
src/app/api/interview/[id]/control/route.ts        — POST control commands (skip/hint/end-round)
src/app/api/interview/[id]/mark/route.ts           — POST toggle message mark
src/app/api/interview/[id]/report/route.ts         — POST (generate) + GET (fetch) report
src/app/api/interview/[id]/report/export/route.ts  — GET export (PDF/Markdown)
src/app/api/interview/history/stats/route.ts       — GET historical stats
src/app/[locale]/interview/layout.tsx               — Interview section layout
src/app/[locale]/interview/page.tsx                 — Interview lobby (list + new)
src/app/[locale]/interview/new/page.tsx             — New interview setup page
src/app/[locale]/interview/[id]/page.tsx            — Interview room (chat)
src/app/[locale]/interview/[id]/report/page.tsx     — Report view page
src/components/interview/interview-lobby.tsx         — Lobby list with cards
src/components/interview/interview-card.tsx          — Single interview record card
src/components/interview/interview-setup.tsx         — Setup form (JD + resume + interviewers)
src/components/interview/jd-input.tsx                — JD textarea with char count
src/components/interview/resume-selector.tsx         — Resume dropdown selector
src/components/interview/interviewer-picker.tsx      — Interviewer grid + drag sort
src/components/interview/interviewer-card.tsx        — Single interviewer role card
src/components/interview/custom-interviewer-dialog.tsx — Custom interviewer form
src/components/interview/interview-room.tsx          — Main chat room container
src/components/interview/progress-bar.tsx            — Top progress with interviewer avatars
src/components/interview/interviewer-banner.tsx      — Current interviewer info bar
src/components/interview/message-list.tsx            — Chat message list
src/components/interview/interviewer-message.tsx     — Interviewer bubble (left, with avatar)
src/components/interview/candidate-message.tsx       — User bubble (right)
src/components/interview/message-input.tsx           — Input box
src/components/interview/control-bar.tsx             — Action buttons (skip/hint/mark/end)
src/components/interview/round-transition.tsx        — Round transition animation
src/components/interview/interview-report.tsx        — Report container
src/components/interview/report-overview.tsx         — Score + grade + summary
src/components/interview/radar-chart.tsx             — Recharts radar chart wrapper
src/components/interview/round-evaluation.tsx        — Per-round collapsible panel
src/components/interview/question-review.tsx         — Per-question analysis card
src/components/interview/improvement-plan.tsx        — Improvement suggestions list
src/components/interview/history-comparison.tsx      — Trend line + radar overlay
src/components/interview/export-buttons.tsx          — PDF/Markdown export buttons
```

### Modified files

```
src/lib/db/schema.ts                — Re-export interview tables
src/lib/db/adapters/sqlite.ts       — Import interview tables for auto-migration
src/lib/db/adapters/postgresql.ts   — Import interview tables for auto-migration
src/components/layout/header.tsx     — Add "面试模拟" nav link
messages/zh.json                     — Add interview namespace
messages/en.json                     — Add interview namespace
package.json                         — Add recharts dependency
```

---

### Task 1: Install recharts dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install recharts**

Run: `pnpm add recharts`

- [ ] **Step 2: Verify installation**

Run: `pnpm ls recharts`
Expected: `recharts` version listed

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add recharts for interview report charts"
```

---

### Task 2: Database schema — 4 interview tables

**Files:**
- Create: `src/lib/db/schema-interview.ts`
- Modify: `src/lib/db/schema.ts`

- [ ] **Step 1: Create interview schema file**

Create `src/lib/db/schema-interview.ts`:

```typescript
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
```

- [ ] **Step 2: Re-export from main schema**

Add to the end of `src/lib/db/schema.ts`:

```typescript
export {
  interviewSessions,
  interviewRounds,
  interviewMessages,
  interviewReports,
} from './schema-interview';
```

- [ ] **Step 3: Verify the schema compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 4: Generate migration**

Run: `pnpm db:generate`
Expected: Migration SQL files created in `drizzle/` directory with CREATE TABLE statements for the 4 new tables

- [ ] **Step 5: Commit**

```bash
git add src/lib/db/schema-interview.ts src/lib/db/schema.ts drizzle/
git commit -m "feat: add interview simulation database schema (4 tables)"
```

---

### Task 3: TypeScript types for interview module

**Files:**
- Create: `src/types/interview.ts`

- [ ] **Step 1: Create interview types**

Create `src/types/interview.ts`:

```typescript
export interface InterviewerConfig {
  type: string;
  name: string;
  title: string;
  avatar: string;
  bio: string;
  style: string;
  focusAreas: string[];
  systemPrompt: string;
  personality: string;
}

export type InterviewSessionStatus = 'preparing' | 'in_progress' | 'paused' | 'completed';
export type InterviewRoundStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';
export type InterviewMessageRole = 'interviewer' | 'candidate' | 'system';

export interface InterviewSession {
  id: string;
  userId: string;
  resumeId: string | null;
  jobDescription: string;
  jobTitle: string;
  selectedInterviewers: InterviewerConfig[];
  currentRound: number;
  status: InterviewSessionStatus;
  rounds?: InterviewRound[];
  report?: InterviewReport | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface InterviewRound {
  id: string;
  sessionId: string;
  interviewerType: string;
  interviewerConfig: InterviewerConfig;
  sortOrder: number;
  status: InterviewRoundStatus;
  questionCount: number;
  maxQuestions: number;
  summary: RoundSummary | null;
  messages?: InterviewMessage[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RoundSummary {
  score: number;
  feedback: string;
}

export interface InterviewMessageMetadata {
  marked?: boolean;
  hinted?: boolean;
  skipped?: boolean;
}

export interface InterviewMessage {
  id: string;
  roundId: string;
  role: InterviewMessageRole;
  content: string;
  metadata: InterviewMessageMetadata;
  createdAt: Date | string;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
}

export interface QuestionEvaluation {
  question: string;
  answerSummary: string;
  score: number;
  highlights: string[];
  weaknesses: string[];
  referenceTips: string;
  marked: boolean;
  hinted: boolean;
  skipped: boolean;
}

export interface RoundEvaluation {
  roundId: string;
  interviewerType: string;
  interviewerName: string;
  score: number;
  feedback: string;
  questions: QuestionEvaluation[];
}

export interface ImprovementItem {
  priority: 'high' | 'medium' | 'low';
  area: string;
  description: string;
  resources: string[];
}

export interface InterviewReport {
  id: string;
  sessionId: string;
  overallScore: number;
  dimensionScores: DimensionScore[];
  roundEvaluations: RoundEvaluation[];
  overallFeedback: string;
  improvementPlan: ImprovementItem[];
  createdAt: Date | string;
}

export interface CreateInterviewInput {
  jobDescription: string;
  jobTitle: string;
  resumeId?: string;
  interviewers: InterviewerConfig[];
}

export interface HistoryStats {
  sessions: {
    id: string;
    jobTitle: string;
    overallScore: number;
    dimensionScores: DimensionScore[];
    createdAt: string;
  }[];
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/types/interview.ts
git commit -m "feat: add TypeScript types for interview module"
```

---

### Task 4: Preset interviewer configs

**Files:**
- Create: `src/lib/interview/interviewers.ts`

- [ ] **Step 1: Create preset interviewers with i18n**

Create `src/lib/interview/interviewers.ts`:

```typescript
import type { InterviewerConfig } from '@/types/interview';

interface PresetInterviewer {
  zh: InterviewerConfig;
  en: InterviewerConfig;
}

const presets: Record<string, PresetInterviewer> = {
  hr: {
    zh: {
      type: 'hr',
      name: '李雯',
      title: 'HR总监',
      avatar: 'hr',
      bio: '10年人力资源管理经验，擅长评估候选人的职业素养和文化匹配度。',
      style: '温和友善，善于通过开放式提问深入了解候选人的动机和价值观。',
      focusAreas: ['求职动机', '文化匹配', '薪资期望', '职业稳定性', '沟通表达'],
      personality: '亲切、专业、善于倾听，会适当追问细节',
      systemPrompt: '',
    },
    en: {
      type: 'hr',
      name: 'Lisa Wang',
      title: 'HR Director',
      avatar: 'hr',
      bio: '10 years of HR management experience, skilled at evaluating cultural fit and professionalism.',
      style: 'Warm and friendly, uses open-ended questions to understand motivation and values.',
      focusAreas: ['Motivation', 'Cultural Fit', 'Salary Expectations', 'Stability', 'Communication'],
      personality: 'Approachable, professional, good listener, follows up on details',
      systemPrompt: '',
    },
  },
  technical: {
    zh: {
      type: 'technical',
      name: '张明',
      title: '技术专家',
      avatar: 'technical',
      bio: '15年软件开发经验，曾主导多个大型系统架构设计，对技术细节要求严格。',
      style: '由浅入深，从基础概念到底层原理逐步追问，考察技术深度和广度。',
      focusAreas: ['技术原理', '系统设计', '代码能力', '问题排查', '技术深度'],
      personality: '严谨、直接、注重逻辑，不满意会继续追问',
      systemPrompt: '',
    },
    en: {
      type: 'technical',
      name: 'Mike Zhang',
      title: 'Tech Lead',
      avatar: 'technical',
      bio: '15 years of software development, led multiple large-scale system architecture designs.',
      style: 'Progressive depth — starts from basics and drills into implementation details.',
      focusAreas: ['Technical Principles', 'System Design', 'Coding Ability', 'Debugging', 'Technical Depth'],
      personality: 'Rigorous, direct, logic-oriented, keeps probing if unsatisfied',
      systemPrompt: '',
    },
  },
  scenario: {
    zh: {
      type: 'scenario',
      name: '王强',
      title: '架构师',
      avatar: 'scenario',
      bio: '12年架构设计经验，专注于高并发、分布式系统，善于用场景驱动考察。',
      style: '给定具体业务场景，追问方案细节、容量估算、权衡取舍。',
      focusAreas: ['系统设计', '方案权衡', '技术选型', '容量规划', '应急处理'],
      personality: '沉稳、务实、注重方案落地性，喜欢追问"为什么这样设计"',
      systemPrompt: '',
    },
    en: {
      type: 'scenario',
      name: 'Kevin Wang',
      title: 'Architect',
      avatar: 'scenario',
      bio: '12 years of architecture experience, specializes in high-concurrency distributed systems.',
      style: 'Presents real business scenarios, probes design details, capacity planning, and trade-offs.',
      focusAreas: ['System Design', 'Trade-offs', 'Tech Selection', 'Capacity Planning', 'Incident Response'],
      personality: 'Calm, practical, focuses on feasibility, asks "why this design"',
      systemPrompt: '',
    },
  },
  behavioral: {
    zh: {
      type: 'behavioral',
      name: '刘芳',
      title: 'HRBP',
      avatar: 'behavioral',
      bio: '8年HRBP经验，擅长通过行为面试法（STAR）评估候选人的软技能。',
      style: '引导候选人用STAR法则描述过往经历，关注具体行为而非假设性回答。',
      focusAreas: ['团队协作', '冲突处理', '抗压能力', '领导力', '自我认知'],
      personality: '专业干练、有引导性，会提醒使用STAR法则作答',
      systemPrompt: '',
    },
    en: {
      type: 'behavioral',
      name: 'Fang Liu',
      title: 'HRBP',
      avatar: 'behavioral',
      bio: '8 years of HRBP experience, expert in behavioral interviewing using the STAR method.',
      style: 'Guides candidates to describe past experiences using STAR, focuses on actual behaviors.',
      focusAreas: ['Teamwork', 'Conflict Resolution', 'Stress Management', 'Leadership', 'Self-awareness'],
      personality: 'Professional, guiding, reminds candidates to use STAR method',
      systemPrompt: '',
    },
  },
  project_deep_dive: {
    zh: {
      type: 'project_deep_dive',
      name: '陈刚',
      title: '技术Leader',
      avatar: 'project_deep_dive',
      bio: '10年技术管理经验，善于通过项目经历考察候选人的真实技术能力和角色贡献。',
      style: '针对简历上的项目逐层追问：你具体做了什么、为什么这样做、遇到什么困难、如何解决。',
      focusAreas: ['项目贡献度', '技术决策', '难点攻克', '复盘反思', '项目理解'],
      personality: '务实老练、追问细节，能分辨出真正做过和只是参与过的区别',
      systemPrompt: '',
    },
    en: {
      type: 'project_deep_dive',
      name: 'Gang Chen',
      title: 'Tech Leader',
      avatar: 'project_deep_dive',
      bio: '10 years of tech management, skilled at evaluating real contributions through project deep dives.',
      style: 'Probes resume projects layer by layer: what you did, why, challenges faced, how you solved them.',
      focusAreas: ['Contribution Level', 'Tech Decisions', 'Problem Solving', 'Retrospection', 'Project Understanding'],
      personality: 'Practical, experienced, detail-oriented, distinguishes doers from bystanders',
      systemPrompt: '',
    },
  },
  leader: {
    zh: {
      type: 'leader',
      name: '赵总',
      title: '技术VP',
      avatar: 'leader',
      bio: '20年技术管理经验，关注候选人的技术视野、业务理解和长期发展潜力。',
      style: '高层次提问，关注技术趋势判断、团队建设思路、业务与技术结合能力。',
      focusAreas: ['职业规划', '技术视野', '团队管理', '业务理解', '战略思维'],
      personality: '高管气质、全局视野，提问简练但考察深度大',
      systemPrompt: '',
    },
    en: {
      type: 'leader',
      name: 'David Zhao',
      title: 'VP of Engineering',
      avatar: 'leader',
      bio: '20 years of tech leadership, focuses on technical vision, business acumen, and growth potential.',
      style: 'High-level questions about tech trends, team building philosophy, and business-tech alignment.',
      focusAreas: ['Career Planning', 'Technical Vision', 'Team Management', 'Business Understanding', 'Strategic Thinking'],
      personality: 'Executive presence, big-picture thinker, concise questions with deep expectations',
      systemPrompt: '',
    },
  },
};

export const INTERVIEWER_TYPES = Object.keys(presets);

export function getPresetInterviewers(locale: 'zh' | 'en'): InterviewerConfig[] {
  return Object.values(presets).map((p) => p[locale]);
}

export function getPresetInterviewer(type: string, locale: 'zh' | 'en'): InterviewerConfig | null {
  return presets[type]?.[locale] ?? null;
}

/** Color mapping for interviewer bubble styles */
export const INTERVIEWER_COLORS: Record<string, string> = {
  hr: 'bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800',
  technical: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  scenario: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  behavioral: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
  project_deep_dive: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  leader: 'bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800',
};

/** Default color for custom interviewers */
export const DEFAULT_INTERVIEWER_COLOR = 'bg-zinc-50 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800';
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/interview/interviewers.ts
git commit -m "feat: add 6 preset interviewer configs with zh/en i18n"
```

---

### Task 5: Interview repository

**Files:**
- Create: `src/lib/db/repositories/interview.repository.ts`

- [ ] **Step 1: Create interview repository**

Create `src/lib/db/repositories/interview.repository.ts`:

```typescript
import { eq, desc, and } from 'drizzle-orm';
import { db } from '../index';
import {
  interviewSessions,
  interviewRounds,
  interviewMessages,
  interviewReports,
} from '../schema';
import type {
  InterviewerConfig,
  InterviewSessionStatus,
  InterviewRoundStatus,
  InterviewMessageMetadata,
} from '@/types/interview';

export const interviewRepository = {
  // ── Sessions ──

  async createSession(data: {
    userId: string;
    resumeId?: string;
    jobDescription: string;
    jobTitle: string;
    selectedInterviewers: InterviewerConfig[];
  }) {
    const id = crypto.randomUUID();
    await db.insert(interviewSessions).values({
      id,
      userId: data.userId,
      resumeId: data.resumeId ?? null,
      jobDescription: data.jobDescription,
      jobTitle: data.jobTitle,
      selectedInterviewers: data.selectedInterviewers as any,
      status: 'preparing',
    } as any);
    return this.findSession(id);
  },

  async findSession(id: string) {
    const rows = await db.select().from(interviewSessions).where(eq(interviewSessions.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findSessionsByUserId(userId: string) {
    return db
      .select()
      .from(interviewSessions)
      .where(eq(interviewSessions.userId, userId))
      .orderBy(desc(interviewSessions.updatedAt));
  },

  async updateSessionStatus(id: string, status: InterviewSessionStatus) {
    await db.update(interviewSessions).set({ status, updatedAt: new Date() } as any).where(eq(interviewSessions.id, id));
  },

  async updateSessionRound(id: string, currentRound: number) {
    await db.update(interviewSessions).set({ currentRound, updatedAt: new Date() } as any).where(eq(interviewSessions.id, id));
  },

  async deleteSession(id: string) {
    await db.delete(interviewSessions).where(eq(interviewSessions.id, id));
  },

  // ── Rounds ──

  async createRound(data: {
    sessionId: string;
    interviewerType: string;
    interviewerConfig: InterviewerConfig;
    sortOrder: number;
    maxQuestions?: number;
  }) {
    const id = crypto.randomUUID();
    await db.insert(interviewRounds).values({
      id,
      sessionId: data.sessionId,
      interviewerType: data.interviewerType,
      interviewerConfig: data.interviewerConfig as any,
      sortOrder: data.sortOrder,
      maxQuestions: data.maxQuestions ?? 10,
    } as any);
    return this.findRound(id);
  },

  async findRound(id: string) {
    const rows = await db.select().from(interviewRounds).where(eq(interviewRounds.id, id)).limit(1);
    return rows[0] ?? null;
  },

  async findRoundsBySessionId(sessionId: string) {
    return db
      .select()
      .from(interviewRounds)
      .where(eq(interviewRounds.sessionId, sessionId))
      .orderBy(interviewRounds.sortOrder);
  },

  async updateRoundStatus(id: string, status: InterviewRoundStatus) {
    await db.update(interviewRounds).set({ status, updatedAt: new Date() } as any).where(eq(interviewRounds.id, id));
  },

  async incrementQuestionCount(id: string) {
    const round = await this.findRound(id);
    if (!round) return;
    await db.update(interviewRounds).set({
      questionCount: round.questionCount + 1,
      updatedAt: new Date(),
    } as any).where(eq(interviewRounds.id, id));
  },

  async setRoundSummary(id: string, summary: { score: number; feedback: string }) {
    await db.update(interviewRounds).set({
      summary: summary as any,
      status: 'completed',
      updatedAt: new Date(),
    } as any).where(eq(interviewRounds.id, id));
  },

  // ── Messages ──

  async addMessage(data: {
    roundId: string;
    role: 'interviewer' | 'candidate' | 'system';
    content: string;
    metadata?: InterviewMessageMetadata;
  }) {
    const id = crypto.randomUUID();
    await db.insert(interviewMessages).values({
      id,
      roundId: data.roundId,
      role: data.role,
      content: data.content,
      metadata: (data.metadata ?? {}) as any,
    } as any);
    return db.select().from(interviewMessages).where(eq(interviewMessages.id, id)).limit(1).then((r) => r[0]);
  },

  async findMessagesByRoundId(roundId: string) {
    return db
      .select()
      .from(interviewMessages)
      .where(eq(interviewMessages.roundId, roundId))
      .orderBy(interviewMessages.createdAt);
  },

  async findAllMessagesBySessionId(sessionId: string) {
    const rounds = await this.findRoundsBySessionId(sessionId);
    const allMessages: Array<{ round: typeof rounds[0]; messages: Awaited<ReturnType<typeof this.findMessagesByRoundId>> }> = [];
    for (const round of rounds) {
      const messages = await this.findMessagesByRoundId(round.id);
      allMessages.push({ round, messages });
    }
    return allMessages;
  },

  async updateMessageMetadata(id: string, metadata: InterviewMessageMetadata) {
    await db.update(interviewMessages).set({ metadata: metadata as any }).where(eq(interviewMessages.id, id));
  },

  // ── Reports ──

  async createReport(data: {
    sessionId: string;
    overallScore: number;
    dimensionScores: unknown;
    roundEvaluations: unknown;
    overallFeedback: string;
    improvementPlan: unknown;
  }) {
    const id = crypto.randomUUID();
    await db.insert(interviewReports).values({
      id,
      sessionId: data.sessionId,
      overallScore: data.overallScore,
      dimensionScores: data.dimensionScores as any,
      roundEvaluations: data.roundEvaluations as any,
      overallFeedback: data.overallFeedback,
      improvementPlan: data.improvementPlan as any,
    } as any);
    return this.findReportBySessionId(data.sessionId);
  },

  async findReportBySessionId(sessionId: string) {
    const rows = await db
      .select()
      .from(interviewReports)
      .where(eq(interviewReports.sessionId, sessionId))
      .limit(1);
    return rows[0] ?? null;
  },

  async findReportsByUserId(userId: string) {
    const sessions = await this.findSessionsByUserId(userId);
    const completedIds = sessions.filter((s) => s.status === 'completed').map((s) => s.id);
    const reports = [];
    for (const sessionId of completedIds) {
      const report = await this.findReportBySessionId(sessionId);
      if (report) {
        const session = sessions.find((s) => s.id === sessionId)!;
        reports.push({ report, session });
      }
    }
    return reports;
  },
};
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/lib/db/repositories/interview.repository.ts
git commit -m "feat: add interview repository with CRUD for sessions/rounds/messages/reports"
```

---

### Task 6: AI prompts and report schema

**Files:**
- Create: `src/lib/ai/interview-prompts.ts`
- Create: `src/lib/ai/interview-report-schema.ts`

- [ ] **Step 1: Create interview prompt builder**

Create `src/lib/ai/interview-prompts.ts`:

```typescript
import type { InterviewerConfig } from '@/types/interview';

export function buildInterviewSystemPrompt(params: {
  interviewer: InterviewerConfig;
  jobDescription: string;
  resumeContent?: string;
  maxQuestions: number;
  locale: string;
}) {
  const { interviewer, jobDescription, resumeContent, maxQuestions, locale } = params;
  const lang = locale === 'zh' ? '中文' : 'English';

  return `你是 ${interviewer.name}，${interviewer.title}。
${interviewer.bio}

提问风格：${interviewer.style}
性格特征：${interviewer.personality}
考察维度：${interviewer.focusAreas.join('、')}

岗位 JD：
${jobDescription}

${resumeContent ? `候选人简历：\n${resumeContent}` : '（候选人未提供简历）'}

规则：
1. 每次只问一个问题，等候选人回答后再提下一个问题
2. 根据回答质量决定是否追问：回答不充分或有漏洞则追问，回答到位则切换到下一个考察点
3. 本轮最多提 ${maxQuestions} 个问题（含追问）
4. 当你认为本轮考察已经充分，或达到提问上限时，输出本轮小结，并在消息最末尾单独一行写上标记 [ROUND_COMPLETE]
5. 本轮小结应包含：对候选人本轮表现的简短评价（2-3句话）
6. 保持角色一致性，语气和提问方式要符合你的性格特征
7. 请用${lang}进行面试
8. 第一条消息请做简短自我介绍，说明本轮面试的重点方向，然后提出第一个问题`;
}

export function buildHintPrompt(locale: string): string {
  if (locale === 'zh') {
    return '[系统指令] 候选人请求了提示。请给出思路引导，帮助候选人理清回答方向，但不要直接给出答案。引导后请重新提出你的问题。';
  }
  return '[System] The candidate requested a hint. Provide guidance to help them structure their answer, but do not give the answer directly. Then re-ask your question.';
}

export function buildSkipPrompt(locale: string): string {
  if (locale === 'zh') {
    return '[系统指令] 候选人选择跳过此问题。请记录此题被跳过，然后继续提出下一个问题。';
  }
  return '[System] The candidate chose to skip this question. Note it as skipped and proceed to the next question.';
}

export function buildEndRoundPrompt(locale: string): string {
  if (locale === 'zh') {
    return '[系统指令] 候选人选择提前结束本轮面试。请立即输出本轮小结，并在消息最末尾单独一行写上 [ROUND_COMPLETE]。';
  }
  return '[System] The candidate chose to end this round early. Output your round summary immediately and end with [ROUND_COMPLETE] on its own line.';
}
```

- [ ] **Step 2: Create report Zod schema**

Create `src/lib/ai/interview-report-schema.ts`:

```typescript
import { z } from 'zod/v4';

const questionEvaluationSchema = z.object({
  question: z.string().describe('The interview question asked'),
  answerSummary: z.string().describe('Brief summary of the candidate answer'),
  score: z.number().min(1).max(5).describe('Score from 1 to 5'),
  highlights: z.array(z.string()).describe('Strengths in the answer'),
  weaknesses: z.array(z.string()).describe('Areas for improvement'),
  referenceTips: z.string().describe('Reference answer direction or tips'),
  marked: z.boolean().describe('Whether the candidate marked this for review'),
  hinted: z.boolean().describe('Whether the candidate used a hint'),
  skipped: z.boolean().describe('Whether the candidate skipped this question'),
});

const roundEvaluationSchema = z.object({
  roundId: z.string().describe('The round ID'),
  interviewerType: z.string().describe('Type of interviewer'),
  interviewerName: z.string().describe('Name of the interviewer'),
  score: z.number().min(0).max(100).describe('Round score 0-100'),
  feedback: z.string().describe('Overall feedback for this round'),
  questions: z.array(questionEvaluationSchema).describe('Per-question evaluations'),
});

const dimensionScoreSchema = z.object({
  dimension: z.string().describe('Dimension name (e.g., Communication, Technical Depth)'),
  score: z.number().min(0).max(100).describe('Score for this dimension'),
  maxScore: z.literal(100).describe('Max score is always 100'),
});

const improvementItemSchema = z.object({
  priority: z.enum(['high', 'medium', 'low']).describe('Priority level'),
  area: z.string().describe('Area to improve'),
  description: z.string().describe('What to improve and why'),
  resources: z.array(z.string()).describe('Recommended learning resources (articles, books, courses)'),
});

export const interviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('Overall interview score 0-100'),
  dimensionScores: z.array(dimensionScoreSchema).describe('Radar chart dimension scores (6-8 dimensions)'),
  roundEvaluations: z.array(roundEvaluationSchema).describe('Per-round detailed evaluations'),
  overallFeedback: z.string().describe('Comprehensive feedback summary (3-5 paragraphs)'),
  improvementPlan: z.array(improvementItemSchema).describe('Prioritized improvement suggestions'),
});

export type InterviewReportOutput = z.infer<typeof interviewReportSchema>;
```

- [ ] **Step 3: Verify both compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/ai/interview-prompts.ts src/lib/ai/interview-report-schema.ts
git commit -m "feat: add interview AI prompt builders and report Zod schema"
```

---

### Task 7: i18n messages — interview namespace

**Files:**
- Modify: `messages/zh.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add interview namespace to zh.json**

Add the following `"interview"` key at the top level of `messages/zh.json` (after the last existing key, before the closing `}`):

```json
"interview": {
  "nav": "面试模拟",
  "title": "面试模拟",
  "lobby": {
    "title": "我的面试",
    "newInterview": "新建面试",
    "noInterviews": "还没有面试记录，开始一场模拟面试吧",
    "status": {
      "preparing": "准备中",
      "in_progress": "进行中",
      "paused": "已暂停",
      "completed": "已完成"
    },
    "score": "综合评分",
    "rounds": "{count} 轮面试",
    "continue": "继续面试",
    "viewReport": "查看报告",
    "deleteConfirm": "确定要删除这场面试记录吗？此操作不可恢复。"
  },
  "setup": {
    "title": "新建面试",
    "jdLabel": "岗位描述 (JD)",
    "jdPlaceholder": "请粘贴岗位描述...",
    "jdCharCount": "{count}/5000",
    "resumeLabel": "关联简历（可选）",
    "resumePlaceholder": "选择一份简历",
    "resumeNone": "不关联简历",
    "resumeHint": "关联简历后，面试官可以针对你的项目经历进行深入提问",
    "interviewerLabel": "选择面试官",
    "interviewerHint": "拖拽调整面试顺序，至少选择一位面试官",
    "customInterviewer": "自定义面试官",
    "startInterview": "开始面试",
    "custom": {
      "title": "自定义面试官",
      "name": "面试官名称",
      "namePlaceholder": "如：产品总监",
      "jobTitle": "职位头衔",
      "jobTitlePlaceholder": "如：产品副总裁",
      "bio": "简介",
      "bioPlaceholder": "描述面试官的背景...",
      "style": "提问风格",
      "stylePlaceholder": "描述提问方式...",
      "focusAreas": "考察维度（逗号分隔）",
      "focusAreasPlaceholder": "如：产品思维, 数据分析, 用户洞察",
      "personality": "性格特征",
      "personalityPlaceholder": "如：严谨、注重细节",
      "add": "添加"
    }
  },
  "room": {
    "round": "第 {current} 轮 / 共 {total} 轮",
    "questionProgress": "问题 {current}/{max}",
    "skip": "跳过",
    "hint": "请求提示",
    "mark": "标记复习",
    "unmark": "取消标记",
    "endRound": "结束本轮",
    "pause": "暂停面试",
    "inputPlaceholder": "输入你的回答...",
    "send": "发送",
    "nextRound": "进入下一轮",
    "generating": "面试官正在思考...",
    "roundComplete": "本轮面试结束",
    "allComplete": "所有面试轮次已完成",
    "generateReport": "生成面试报告",
    "generatingReport": "正在生成报告..."
  },
  "report": {
    "title": "面试报告",
    "overallScore": "综合评分",
    "grade": {
      "excellent": "优秀",
      "good": "良好",
      "pass": "合格",
      "needsImprovement": "需提升"
    },
    "overview": "总体评价",
    "dimensions": "能力维度",
    "roundEvaluation": "分轮评估",
    "questionReview": "逐题分析",
    "question": "问题",
    "answer": "回答摘要",
    "highlights": "亮点",
    "weaknesses": "不足",
    "reference": "参考思路",
    "improvement": "改进建议",
    "priority": {
      "high": "高",
      "medium": "中",
      "low": "低"
    },
    "resources": "推荐资源",
    "history": "历史对比",
    "trend": "评分趋势",
    "comparedToLast": "对比上次",
    "comparedToBest": "对比最佳",
    "improved": "提升",
    "declined": "下降",
    "stable": "持平",
    "exportPdf": "导出 PDF",
    "exportMarkdown": "导出 Markdown",
    "backToLobby": "返回面试大厅",
    "markedForReview": "标记复习",
    "usedHint": "使用了提示",
    "skippedQuestion": "已跳过"
  },
  "interviewers": {
    "hr": "HR面",
    "technical": "技术面",
    "scenario": "场景面",
    "behavioral": "行为面",
    "project_deep_dive": "项目深挖",
    "leader": "Leader面",
    "custom": "自定义"
  }
}
```

- [ ] **Step 2: Add interview namespace to en.json**

Add the corresponding English translations to `messages/en.json` with the same key structure. Key translations:

```json
"interview": {
  "nav": "Mock Interview",
  "title": "Mock Interview",
  "lobby": {
    "title": "My Interviews",
    "newInterview": "New Interview",
    "noInterviews": "No interview records yet. Start a mock interview!",
    "status": {
      "preparing": "Preparing",
      "in_progress": "In Progress",
      "paused": "Paused",
      "completed": "Completed"
    },
    "score": "Overall Score",
    "rounds": "{count} rounds",
    "continue": "Continue",
    "viewReport": "View Report",
    "deleteConfirm": "Are you sure you want to delete this interview? This action cannot be undone."
  },
  "setup": {
    "title": "New Interview",
    "jdLabel": "Job Description (JD)",
    "jdPlaceholder": "Paste the job description...",
    "jdCharCount": "{count}/5000",
    "resumeLabel": "Link Resume (optional)",
    "resumePlaceholder": "Select a resume",
    "resumeNone": "No resume",
    "resumeHint": "Linking a resume allows interviewers to ask about your project experience",
    "interviewerLabel": "Select Interviewers",
    "interviewerHint": "Drag to reorder. Select at least one interviewer.",
    "customInterviewer": "Custom Interviewer",
    "startInterview": "Start Interview",
    "custom": {
      "title": "Custom Interviewer",
      "name": "Name",
      "namePlaceholder": "e.g., Product Director",
      "jobTitle": "Job Title",
      "jobTitlePlaceholder": "e.g., VP of Product",
      "bio": "Bio",
      "bioPlaceholder": "Describe the interviewer's background...",
      "style": "Interview Style",
      "stylePlaceholder": "Describe the questioning style...",
      "focusAreas": "Focus Areas (comma separated)",
      "focusAreasPlaceholder": "e.g., Product Thinking, Data Analysis, User Insights",
      "personality": "Personality",
      "personalityPlaceholder": "e.g., Rigorous, detail-oriented",
      "add": "Add"
    }
  },
  "room": {
    "round": "Round {current} / {total}",
    "questionProgress": "Q {current}/{max}",
    "skip": "Skip",
    "hint": "Request Hint",
    "mark": "Mark for Review",
    "unmark": "Unmark",
    "endRound": "End Round",
    "pause": "Pause",
    "inputPlaceholder": "Type your answer...",
    "send": "Send",
    "nextRound": "Next Round",
    "generating": "Interviewer is thinking...",
    "roundComplete": "This round is complete",
    "allComplete": "All interview rounds completed",
    "generateReport": "Generate Report",
    "generatingReport": "Generating report..."
  },
  "report": {
    "title": "Interview Report",
    "overallScore": "Overall Score",
    "grade": {
      "excellent": "Excellent",
      "good": "Good",
      "pass": "Pass",
      "needsImprovement": "Needs Improvement"
    },
    "overview": "Overall Feedback",
    "dimensions": "Competency Dimensions",
    "roundEvaluation": "Round Evaluation",
    "questionReview": "Question Review",
    "question": "Question",
    "answer": "Answer Summary",
    "highlights": "Highlights",
    "weaknesses": "Weaknesses",
    "reference": "Reference",
    "improvement": "Improvement Plan",
    "priority": {
      "high": "High",
      "medium": "Medium",
      "low": "Low"
    },
    "resources": "Resources",
    "history": "History Comparison",
    "trend": "Score Trend",
    "comparedToLast": "vs Last",
    "comparedToBest": "vs Best",
    "improved": "Improved",
    "declined": "Declined",
    "stable": "Stable",
    "exportPdf": "Export PDF",
    "exportMarkdown": "Export Markdown",
    "backToLobby": "Back to Lobby",
    "markedForReview": "Marked for Review",
    "usedHint": "Used Hint",
    "skippedQuestion": "Skipped"
  },
  "interviewers": {
    "hr": "HR",
    "technical": "Technical",
    "scenario": "Scenario",
    "behavioral": "Behavioral",
    "project_deep_dive": "Project Deep Dive",
    "leader": "Leader",
    "custom": "Custom"
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/zh.json messages/en.json
git commit -m "feat: add interview i18n messages (zh + en)"
```

---

### Task 8: Interview Zustand store

**Files:**
- Create: `src/stores/interview-store.ts`

- [ ] **Step 1: Create the store**

Create `src/stores/interview-store.ts`:

```typescript
import { create } from 'zustand';
import type {
  InterviewSession,
  InterviewRound,
  InterviewReport,
  CreateInterviewInput,
} from '@/types/interview';

interface InterviewStore {
  // Session state
  currentSession: InterviewSession | null;
  rounds: InterviewRound[];
  currentRoundIndex: number;

  // Interview progress
  status: 'idle' | 'preparing' | 'in_progress' | 'paused' | 'completed';
  questionCount: number;

  // Message marks
  markedMessages: Set<string>;
  hintedQuestions: Set<string>;
  skippedQuestions: Set<string>;

  // Report
  report: InterviewReport | null;
  isGeneratingReport: boolean;

  // Actions — sessions
  setSession: (session: InterviewSession, rounds: InterviewRound[]) => void;
  setStatus: (status: InterviewStore['status']) => void;

  // Actions — rounds
  setCurrentRoundIndex: (index: number) => void;
  advanceToNextRound: () => void;
  updateRound: (roundId: string, updates: Partial<InterviewRound>) => void;
  incrementQuestionCount: () => void;

  // Actions — marks
  toggleMark: (messageId: string) => void;
  addHinted: (messageId: string) => void;
  addSkipped: (messageId: string) => void;

  // Actions — report
  setReport: (report: InterviewReport) => void;
  setIsGeneratingReport: (v: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentSession: null,
  rounds: [],
  currentRoundIndex: 0,
  status: 'idle' as const,
  questionCount: 0,
  markedMessages: new Set<string>(),
  hintedQuestions: new Set<string>(),
  skippedQuestions: new Set<string>(),
  report: null,
  isGeneratingReport: false,
};

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  ...initialState,

  setSession: (session, rounds) =>
    set({ currentSession: session, rounds, status: session.status as InterviewStore['status'] }),

  setStatus: (status) => set({ status }),

  setCurrentRoundIndex: (index) => set({ currentRoundIndex: index, questionCount: 0 }),

  advanceToNextRound: () => {
    const { currentRoundIndex, rounds } = get();
    const nextIndex = currentRoundIndex + 1;
    if (nextIndex < rounds.length) {
      set({ currentRoundIndex: nextIndex, questionCount: 0 });
    }
  },

  updateRound: (roundId, updates) =>
    set((state) => ({
      rounds: state.rounds.map((r) => (r.id === roundId ? { ...r, ...updates } : r)),
    })),

  incrementQuestionCount: () => set((s) => ({ questionCount: s.questionCount + 1 })),

  toggleMark: (messageId) =>
    set((state) => {
      const next = new Set(state.markedMessages);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return { markedMessages: next };
    }),

  addHinted: (messageId) =>
    set((state) => {
      const next = new Set(state.hintedQuestions);
      next.add(messageId);
      return { hintedQuestions: next };
    }),

  addSkipped: (messageId) =>
    set((state) => {
      const next = new Set(state.skippedQuestions);
      next.add(messageId);
      return { skippedQuestions: next };
    }),

  setReport: (report) => set({ report }),
  setIsGeneratingReport: (v) => set({ isGeneratingReport: v }),

  reset: () => set({ ...initialState, markedMessages: new Set(), hintedQuestions: new Set(), skippedQuestions: new Set() }),
}));
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/stores/interview-store.ts
git commit -m "feat: add interview Zustand store"
```

---

### Task 9: API routes — session CRUD

**Files:**
- Create: `src/app/api/interview/route.ts`
- Create: `src/app/api/interview/[id]/route.ts`

- [ ] **Step 1: Create list + create endpoint**

Create `src/app/api/interview/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { dbReady } from '@/lib/db';

export async function GET(request: NextRequest) {
  await dbReady;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const sessions = await interviewRepository.findSessionsByUserId(user.id);
  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  await dbReady;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = await request.json();
  const { jobDescription, jobTitle, resumeId, interviewers } = body;

  if (!jobDescription || !jobTitle || !interviewers?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const session = await interviewRepository.createSession({
    userId: user.id,
    resumeId: resumeId || undefined,
    jobDescription,
    jobTitle,
    selectedInterviewers: interviewers,
  });

  // Create rounds for each selected interviewer
  for (let i = 0; i < interviewers.length; i++) {
    await interviewRepository.createRound({
      sessionId: session!.id,
      interviewerType: interviewers[i].type,
      interviewerConfig: interviewers[i],
      sortOrder: i,
    });
  }

  const rounds = await interviewRepository.findRoundsBySessionId(session!.id);
  return NextResponse.json({ session, rounds }, { status: 201 });
}
```

- [ ] **Step 2: Create detail + update + delete endpoint**

Create `src/app/api/interview/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { dbReady } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const session = await interviewRepository.findSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const rounds = await interviewRepository.findRoundsBySessionId(id);
  const report = await interviewRepository.findReportBySessionId(id);

  return NextResponse.json({ session, rounds, report });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const session = await interviewRepository.findSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { status } = await request.json();
  if (status) {
    await interviewRepository.updateSessionStatus(id, status);
  }

  const updated = await interviewRepository.findSession(id);
  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const session = await interviewRepository.findSession(id);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await interviewRepository.deleteSession(id);
  return new Response(null, { status: 204 });
}
```

- [ ] **Step 3: Verify routes compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/interview/route.ts src/app/api/interview/\[id\]/route.ts
git commit -m "feat: add interview session CRUD API routes"
```

---

### Task 10: API routes — streaming chat

**Files:**
- Create: `src/app/api/interview/[id]/chat/route.ts`

- [ ] **Step 1: Create streaming chat endpoint**

Create `src/app/api/interview/[id]/chat/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { streamText, convertToModelMessages } from 'ai';
import { getModel, extractAIConfig, AIConfigError } from '@/lib/ai/provider';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { buildInterviewSystemPrompt } from '@/lib/ai/interview-prompts';
import { dbReady } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbReady;
    const { id: sessionId } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) return new Response('Unauthorized', { status: 401 });

    const session = await interviewRepository.findSession(sessionId);
    if (!session || session.userId !== user.id) {
      return new Response('Not found', { status: 404 });
    }

    const { messages, roundId, model: modelId, locale = 'zh' } = await request.json();

    const round = await interviewRepository.findRound(roundId);
    if (!round || round.sessionId !== sessionId) {
      return new Response('Round not found', { status: 404 });
    }

    // Get resume content if linked
    let resumeContent: string | undefined;
    if (session.resumeId) {
      const resume = await resumeRepository.findById(session.resumeId as string);
      if (resume) {
        resumeContent = JSON.stringify(resume.sections);
      }
    }

    const interviewerConfig = round.interviewerConfig as any;

    // Save candidate message to DB
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const textPart = lastMessage.parts?.find((p: { type: string }) => p.type === 'text');
        const content = textPart?.text || lastMessage.content || '';
        if (content) {
          await interviewRepository.addMessage({
            roundId,
            role: 'candidate',
            content,
          });
        }
      }
    }

    const aiConfig = extractAIConfig(request);
    const model = getModel(aiConfig, modelId);
    const modelMessages = await convertToModelMessages(messages);

    // Start round if pending
    if (round.status === 'pending') {
      await interviewRepository.updateRoundStatus(roundId, 'in_progress');
      await interviewRepository.updateSessionStatus(sessionId, 'in_progress');
    }

    const systemPrompt = buildInterviewSystemPrompt({
      interviewer: interviewerConfig,
      jobDescription: session.jobDescription,
      resumeContent,
      maxQuestions: round.maxQuestions,
      locale,
    });

    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      onFinish: async ({ text }) => {
        if (!text) return;

        await interviewRepository.addMessage({
          roundId,
          role: 'interviewer',
          content: text,
        });

        // Count interviewer questions (messages with role=interviewer)
        await interviewRepository.incrementQuestionCount(roundId);

        // Check if round is complete
        if (text.includes('[ROUND_COMPLETE]')) {
          await interviewRepository.setRoundSummary(roundId, {
            score: 0, // Will be set by report generation
            feedback: text.replace('[ROUND_COMPLETE]', '').trim(),
          });

          // Check if all rounds are done
          const rounds = await interviewRepository.findRoundsBySessionId(sessionId);
          const currentIndex = rounds.findIndex((r) => r.id === roundId);
          const nextRound = rounds[currentIndex + 1];

          if (nextRound) {
            await interviewRepository.updateSessionRound(sessionId, currentIndex + 1);
          } else {
            await interviewRepository.updateSessionStatus(sessionId, 'completed');
          }
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    if (error instanceof AIConfigError) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }
    console.error('POST /api/interview/[id]/chat error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/api/interview/\[id\]/chat/route.ts
git commit -m "feat: add streaming interview chat API route"
```

---

### Task 11: API routes — control, mark, report, stats

**Files:**
- Create: `src/app/api/interview/[id]/control/route.ts`
- Create: `src/app/api/interview/[id]/mark/route.ts`
- Create: `src/app/api/interview/[id]/report/route.ts`
- Create: `src/app/api/interview/history/stats/route.ts`

- [ ] **Step 1: Create control endpoint**

Create `src/app/api/interview/[id]/control/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { buildHintPrompt, buildSkipPrompt, buildEndRoundPrompt } from '@/lib/ai/interview-prompts';
import { dbReady } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id: sessionId } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const session = await interviewRepository.findSession(sessionId);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { action, roundId, locale = 'zh' } = await request.json();

  let systemMessage = '';
  switch (action) {
    case 'skip':
      systemMessage = buildSkipPrompt(locale);
      break;
    case 'hint':
      systemMessage = buildHintPrompt(locale);
      break;
    case 'end_round':
      systemMessage = buildEndRoundPrompt(locale);
      break;
    case 'pause':
      await interviewRepository.updateSessionStatus(sessionId, 'paused');
      return NextResponse.json({ success: true });
    case 'resume':
      await interviewRepository.updateSessionStatus(sessionId, 'in_progress');
      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  // Insert system message into round for the AI to process on next chat call
  if (systemMessage && roundId) {
    await interviewRepository.addMessage({
      roundId,
      role: 'system',
      content: systemMessage,
    });
  }

  return NextResponse.json({ success: true, systemMessage });
}
```

- [ ] **Step 2: Create mark endpoint**

Create `src/app/api/interview/[id]/mark/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { dbReady } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id: sessionId } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const session = await interviewRepository.findSession(sessionId);
  if (!session || session.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { messageId, marked } = await request.json();
  await interviewRepository.updateMessageMetadata(messageId, { marked });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 3: Create report endpoint**

Create `src/app/api/interview/[id]/report/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { generateObject } from 'ai';
import { getModel, extractAIConfig, AIConfigError } from '@/lib/ai/provider';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { interviewReportSchema } from '@/lib/ai/interview-report-schema';
import { dbReady } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await dbReady;
  const { id: sessionId } = await params;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const report = await interviewRepository.findReportBySessionId(sessionId);
  if (!report) return NextResponse.json({ error: 'No report found' }, { status: 404 });

  return NextResponse.json(report);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbReady;
    const { id: sessionId } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) return new Response('Unauthorized', { status: 401 });

    const session = await interviewRepository.findSession(sessionId);
    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Check if report already exists
    const existing = await interviewRepository.findReportBySessionId(sessionId);
    if (existing) return NextResponse.json(existing);

    const { model: modelId, locale = 'zh' } = await request.json();
    const aiConfig = extractAIConfig(request);
    const model = getModel(aiConfig, modelId);

    // Collect all conversation data
    const roundsWithMessages = await interviewRepository.findAllMessagesBySessionId(sessionId);

    const conversationLog = roundsWithMessages.map(({ round, messages }) => {
      const config = round.interviewerConfig as any;
      return {
        interviewerType: round.interviewerType,
        interviewerName: config.name,
        roundId: round.id,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content,
          metadata: m.metadata,
        })),
      };
    });

    const lang = locale === 'zh' ? '中文' : 'English';

    const { object: report } = await generateObject({
      model,
      schema: interviewReportSchema,
      prompt: `你是一位资深面试评估专家。请根据以下面试对话记录，生成详细的面试评估报告。请用${lang}回答。

岗位 JD：
${session.jobDescription}

面试对话记录：
${JSON.stringify(conversationLog, null, 2)}

请生成包含以下内容的完整报告：
1. 综合评分 (0-100)
2. 能力维度评分（6-8 个维度的雷达图数据，每个维度 0-100 分）
3. 每轮面试的逐题评估（每个问题的评分 1-5、亮点、不足、参考思路）
4. 总体反馈（3-5 段详细建议）
5. 改进计划（按优先级排列，附学习资源推荐）

注意：标记了 "marked": true 的消息请在报告中重点标注，使用了 "hinted": true 的问题请标注，"skipped": true 的问题请标注为已跳过。`,
    });

    // Persist report
    const saved = await interviewRepository.createReport({
      sessionId,
      overallScore: report.overallScore,
      dimensionScores: report.dimensionScores,
      roundEvaluations: report.roundEvaluations,
      overallFeedback: report.overallFeedback,
      improvementPlan: report.improvementPlan,
    });

    return NextResponse.json(saved);
  } catch (error) {
    if (error instanceof AIConfigError) {
      return new Response(JSON.stringify({ error: error.message }), { status: 401 });
    }
    console.error('POST /api/interview/[id]/report error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
```

- [ ] **Step 4: Create history stats endpoint**

Create `src/app/api/interview/history/stats/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { dbReady } from '@/lib/db';

export async function GET(request: NextRequest) {
  await dbReady;
  const fingerprint = getUserIdFromRequest(request);
  const user = await resolveUser(fingerprint);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const reportsWithSessions = await interviewRepository.findReportsByUserId(user.id);

  const sessions = reportsWithSessions.map(({ report, session }) => ({
    id: session.id,
    jobTitle: session.jobTitle,
    overallScore: report.overallScore,
    dimensionScores: report.dimensionScores,
    createdAt: session.createdAt,
  }));

  return NextResponse.json({ sessions });
}
```

- [ ] **Step 5: Verify all routes compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/app/api/interview/\[id\]/control/route.ts src/app/api/interview/\[id\]/mark/route.ts src/app/api/interview/\[id\]/report/route.ts src/app/api/interview/history/stats/route.ts
git commit -m "feat: add interview control, mark, report, and stats API routes"
```

---

### Task 12: useInterviewChat hook

**Files:**
- Create: `src/hooks/use-interview-chat.ts`

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-interview-chat.ts`:

```typescript
'use client';

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
          const fp = typeof window !== 'undefined' ? localStorage.getItem('careerhelper_fingerprint') : null;
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

  // Detect [ROUND_COMPLETE] in streaming messages
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
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-interview-chat.ts
git commit -m "feat: add useInterviewChat hook with round-complete detection"
```

---

### Task 13: Interview pages — layout and lobby

**Files:**
- Create: `src/app/[locale]/interview/layout.tsx`
- Create: `src/app/[locale]/interview/page.tsx`
- Create: `src/components/interview/interview-lobby.tsx`
- Create: `src/components/interview/interview-card.tsx`

- [ ] **Step 1: Create interview layout**

Create `src/app/[locale]/interview/layout.tsx`:

```typescript
import { Header } from '@/components/layout/header';

export default function InterviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 2: Create lobby page**

Create `src/app/[locale]/interview/page.tsx`:

```typescript
'use client';

import { InterviewLobby } from '@/components/interview/interview-lobby';

export default function InterviewPage() {
  return <InterviewLobby />;
}
```

- [ ] **Step 3: Create InterviewLobby component**

Create `src/components/interview/interview-lobby.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { InterviewCard } from './interview-card';
import { Link } from '@/i18n/routing';
import type { InterviewSession } from '@/types/interview';

export function InterviewLobby() {
  const t = useTranslations('interview.lobby');
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fp = localStorage.getItem('careerhelper_fingerprint');
    fetch('/api/interview', {
      headers: fp ? { 'x-fingerprint': fp } : {},
    })
      .then((r) => r.json())
      .then((data) => setSessions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteConfirm'))) return;
    const fp = localStorage.getItem('careerhelper_fingerprint');
    await fetch(`/api/interview/${id}`, {
      method: 'DELETE',
      headers: fp ? { 'x-fingerprint': fp } : {},
    });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/interview/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('newInterview')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <p>{t('noInterviews')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <InterviewCard key={session.id} session={session} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create InterviewCard component**

Create `src/components/interview/interview-card.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Trash2, Play, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@/i18n/routing';
import type { InterviewSession } from '@/types/interview';

const STATUS_COLORS: Record<string, string> = {
  preparing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paused: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface InterviewCardProps {
  session: InterviewSession;
  onDelete: (id: string) => void;
}

export function InterviewCard({ session, onDelete }: InterviewCardProps) {
  const t = useTranslations('interview');
  const interviewers = session.selectedInterviewers as any[];

  return (
    <Card className="group relative">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 text-base">{session.jobTitle || 'Untitled'}</CardTitle>
          <Badge variant="secondary" className={STATUS_COLORS[session.status] || ''}>
            {t(`lobby.status.${session.status}`)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-3 line-clamp-2 text-sm text-zinc-500">{session.jobDescription.slice(0, 100)}...</p>
        <p className="mb-4 text-xs text-zinc-400">
          {t('lobby.rounds', { count: interviewers.length })}
          {' · '}
          {new Date(session.createdAt).toLocaleDateString()}
        </p>
        <div className="flex items-center gap-2">
          {session.status === 'completed' ? (
            <Link href={`/interview/${session.id}/report`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <FileText className="mr-1 h-3 w-3" />
                {t('lobby.viewReport')}
              </Button>
            </Link>
          ) : session.status === 'in_progress' || session.status === 'paused' ? (
            <Link href={`/interview/${session.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Play className="mr-1 h-3 w-3" />
                {t('lobby.continue')}
              </Button>
            </Link>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.preventDefault();
              onDelete(session.id);
            }}
            className="text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Verify pages compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/app/\[locale\]/interview/ src/components/interview/interview-lobby.tsx src/components/interview/interview-card.tsx
git commit -m "feat: add interview lobby page with session list and cards"
```

---

### Task 14: Interview setup page (new interview)

**Files:**
- Create: `src/app/[locale]/interview/new/page.tsx`
- Create: `src/components/interview/interview-setup.tsx`
- Create: `src/components/interview/jd-input.tsx`
- Create: `src/components/interview/resume-selector.tsx`
- Create: `src/components/interview/interviewer-picker.tsx`
- Create: `src/components/interview/interviewer-card.tsx`
- Create: `src/components/interview/custom-interviewer-dialog.tsx`

- [ ] **Step 1: Create the new interview page**

Create `src/app/[locale]/interview/new/page.tsx`:

```typescript
'use client';

import { InterviewSetup } from '@/components/interview/interview-setup';

export default function NewInterviewPage() {
  return <InterviewSetup />;
}
```

- [ ] **Step 2: Create JDInput component**

Create `src/components/interview/jd-input.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const MAX_JD_LENGTH = 5000;

interface JDInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function JDInput({ value, onChange }: JDInputProps) {
  const t = useTranslations('interview.setup');

  return (
    <div className="space-y-2">
      <Label>{t('jdLabel')}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_JD_LENGTH))}
        placeholder={t('jdPlaceholder')}
        className="min-h-[200px] resize-y"
      />
      <p className="text-right text-xs text-zinc-400">
        {t('jdCharCount', { count: value.length })}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create ResumeSelector component**

Create `src/components/interview/resume-selector.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Resume } from '@/types/resume';

interface ResumeSelectorProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
}

export function ResumeSelector({ value, onChange }: ResumeSelectorProps) {
  const t = useTranslations('interview.setup');
  const [resumes, setResumes] = useState<Resume[]>([]);

  useEffect(() => {
    const fp = localStorage.getItem('careerhelper_fingerprint');
    fetch('/api/resume', {
      headers: fp ? { 'x-fingerprint': fp } : {},
    })
      .then((r) => r.json())
      .then((data) => setResumes(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-2">
      <Label>{t('resumeLabel')}</Label>
      <Select value={value || '_none'} onValueChange={(v) => onChange(v === '_none' ? undefined : v)}>
        <SelectTrigger>
          <SelectValue placeholder={t('resumePlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_none">{t('resumeNone')}</SelectItem>
          {resumes.map((r) => (
            <SelectItem key={r.id} value={r.id}>
              {r.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-zinc-400">{t('resumeHint')}</p>
    </div>
  );
}
```

- [ ] **Step 4: Create InterviewerCard component**

Create `src/components/interview/interviewer-card.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { InterviewerConfig } from '@/types/interview';
import { INTERVIEWER_COLORS, DEFAULT_INTERVIEWER_COLOR } from '@/lib/interview/interviewers';

interface InterviewerCardProps {
  interviewer: InterviewerConfig;
  selected: boolean;
  onToggle: () => void;
  index?: number;
}

export function InterviewerCard({ interviewer, selected, onToggle, index }: InterviewerCardProps) {
  const t = useTranslations('interview.interviewers');
  const colorClass = INTERVIEWER_COLORS[interviewer.type] || DEFAULT_INTERVIEWER_COLOR;

  return (
    <Card
      className={cn(
        'relative cursor-pointer border-2 p-4 transition-all hover:shadow-md',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent',
        colorClass
      )}
      onClick={onToggle}
    >
      {selected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
          {index !== undefined ? <span className="text-xs font-bold">{index + 1}</span> : <Check className="h-3 w-3" />}
        </div>
      )}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg font-semibold">{interviewer.name}</span>
        <Badge variant="secondary" className="text-xs">{t(interviewer.type as any)}</Badge>
      </div>
      <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">{interviewer.title}</p>
      <p className="mb-2 text-xs text-zinc-500">{interviewer.bio}</p>
      <div className="flex flex-wrap gap-1">
        {interviewer.focusAreas.slice(0, 3).map((area) => (
          <Badge key={area} variant="outline" className="text-xs">
            {area}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
```

- [ ] **Step 5: Create CustomInterviewerDialog component**

Create `src/components/interview/custom-interviewer-dialog.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { InterviewerConfig } from '@/types/interview';

interface CustomInterviewerDialogProps {
  onAdd: (config: InterviewerConfig) => void;
  trigger: React.ReactNode;
}

export function CustomInterviewerDialog({ onAdd, trigger }: CustomInterviewerDialogProps) {
  const t = useTranslations('interview.setup.custom');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [style, setStyle] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [personality, setPersonality] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !focusAreas.trim()) return;

    const config: InterviewerConfig = {
      type: `custom_${Date.now()}`,
      name: name.trim(),
      title: jobTitle.trim() || name.trim(),
      avatar: 'custom',
      bio: bio.trim(),
      style: style.trim() || '根据考察维度灵活提问',
      focusAreas: focusAreas.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      personality: personality.trim() || '专业、客观',
      systemPrompt: '',
    };

    onAdd(config);
    setOpen(false);
    setName('');
    setJobTitle('');
    setBio('');
    setStyle('');
    setFocusAreas('');
    setPersonality('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('jobTitle')}</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t('jobTitlePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('bio')}</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('bioPlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('style')}</Label>
            <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder={t('stylePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('focusAreas')}</Label>
            <Input value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} placeholder={t('focusAreasPlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('personality')}</Label>
            <Input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={t('personalityPlaceholder')} />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || !focusAreas.trim()} className="w-full">
            {t('add')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 6: Create InterviewerPicker component**

Create `src/components/interview/interviewer-picker.tsx`:

```typescript
'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InterviewerCard } from './interviewer-card';
import { CustomInterviewerDialog } from './custom-interviewer-dialog';
import { getPresetInterviewers } from '@/lib/interview/interviewers';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewerPickerProps {
  selected: InterviewerConfig[];
  onChange: (selected: InterviewerConfig[]) => void;
}

export function InterviewerPicker({ selected, onChange }: InterviewerPickerProps) {
  const t = useTranslations('interview.setup');
  const locale = useLocale() as 'zh' | 'en';
  const presets = getPresetInterviewers(locale);

  const allInterviewers = [
    ...presets,
    ...selected.filter((s) => s.type.startsWith('custom_')),
  ];

  const toggleInterviewer = (interviewer: InterviewerConfig) => {
    const exists = selected.find((s) => s.type === interviewer.type);
    if (exists) {
      onChange(selected.filter((s) => s.type !== interviewer.type));
    } else {
      onChange([...selected, interviewer]);
    }
  };

  const handleAddCustom = (config: InterviewerConfig) => {
    onChange([...selected, config]);
  };

  return (
    <div className="space-y-2">
      <Label>{t('interviewerLabel')}</Label>
      <p className="text-xs text-zinc-400">{t('interviewerHint')}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allInterviewers.map((interviewer) => {
          const selectedIndex = selected.findIndex((s) => s.type === interviewer.type);
          return (
            <InterviewerCard
              key={interviewer.type}
              interviewer={interviewer}
              selected={selectedIndex >= 0}
              onToggle={() => toggleInterviewer(interviewer)}
              index={selectedIndex >= 0 ? selectedIndex : undefined}
            />
          );
        })}
      </div>
      <CustomInterviewerDialog
        onAdd={handleAddCustom}
        trigger={
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-3 w-3" />
            {t('customInterviewer')}
          </Button>
        }
      />
    </div>
  );
}
```

- [ ] **Step 7: Create InterviewSetup container**

Create `src/components/interview/interview-setup.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { JDInput } from './jd-input';
import { ResumeSelector } from './resume-selector';
import { InterviewerPicker } from './interviewer-picker';
import { useRouter } from '@/i18n/routing';
import { getAIHeaders } from '@/stores/settings-store';
import type { InterviewerConfig } from '@/types/interview';

export function InterviewSetup() {
  const t = useTranslations('interview.setup');
  const router = useRouter();
  const [jd, setJd] = useState('');
  const [resumeId, setResumeId] = useState<string | undefined>();
  const [selectedInterviewers, setSelectedInterviewers] = useState<InterviewerConfig[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const canStart = jd.trim().length > 0 && selectedInterviewers.length > 0;

  const handleStart = async () => {
    if (!canStart) return;
    setIsCreating(true);

    try {
      const fp = localStorage.getItem('careerhelper_fingerprint');
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fp ? { 'x-fingerprint': fp } : {}),
          ...getAIHeaders(),
        },
        body: JSON.stringify({
          jobDescription: jd,
          jobTitle: jd.split('\n')[0].slice(0, 100) || 'Interview',
          resumeId,
          interviewers: selectedInterviewers,
        }),
      });

      if (!res.ok) throw new Error('Failed to create interview');
      const { session } = await res.json();
      router.push(`/interview/${session.id}`);
    } catch (err) {
      console.error('Failed to create interview:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <JDInput value={jd} onChange={setJd} />
      <ResumeSelector value={resumeId} onChange={setResumeId} />
      <InterviewerPicker selected={selectedInterviewers} onChange={setSelectedInterviewers} />
      <Button onClick={handleStart} disabled={!canStart || isCreating} className="w-full" size="lg">
        {isCreating ? '...' : t('startInterview')}
      </Button>
    </div>
  );
}
```

- [ ] **Step 8: Verify all compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add src/app/\[locale\]/interview/new/ src/components/interview/interview-setup.tsx src/components/interview/jd-input.tsx src/components/interview/resume-selector.tsx src/components/interview/interviewer-picker.tsx src/components/interview/interviewer-card.tsx src/components/interview/custom-interviewer-dialog.tsx
git commit -m "feat: add interview setup page with JD input, resume selector, and interviewer picker"
```

---

### Task 15: Interview room — chat interface

**Files:**
- Create: `src/app/[locale]/interview/[id]/page.tsx`
- Create: `src/components/interview/interview-room.tsx`
- Create: `src/components/interview/progress-bar.tsx`
- Create: `src/components/interview/interviewer-banner.tsx`
- Create: `src/components/interview/message-list.tsx`
- Create: `src/components/interview/interviewer-message.tsx`
- Create: `src/components/interview/candidate-message.tsx`
- Create: `src/components/interview/message-input.tsx`
- Create: `src/components/interview/control-bar.tsx`
- Create: `src/components/interview/round-transition.tsx`

- [ ] **Step 1: Create interview room page**

Create `src/app/[locale]/interview/[id]/page.tsx`:

```typescript
'use client';

import { use, useEffect, useState } from 'react';
import { InterviewRoom } from '@/components/interview/interview-room';
import { useInterviewStore } from '@/stores/interview-store';
import { Skeleton } from '@/components/ui/skeleton';

export default function InterviewRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const { setSession, setStatus } = useInterviewStore();

  useEffect(() => {
    const fp = localStorage.getItem('careerhelper_fingerprint');
    fetch(`/api/interview/${id}`, {
      headers: fp ? { 'x-fingerprint': fp } : {},
    })
      .then((r) => r.json())
      .then(({ session, rounds }) => {
        setSession(session, rounds);
        if (session.status === 'paused') {
          setStatus('in_progress');
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

  return <InterviewRoom sessionId={id} />;
}
```

- [ ] **Step 2: Create ProgressBar component**

Create `src/components/interview/progress-bar.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useInterviewStore } from '@/stores/interview-store';
import { INTERVIEWER_COLORS, DEFAULT_INTERVIEWER_COLOR } from '@/lib/interview/interviewers';
import type { InterviewerConfig } from '@/types/interview';

export function ProgressBar() {
  const t = useTranslations('interview.room');
  const { rounds, currentRoundIndex } = useInterviewStore();

  return (
    <div className="flex items-center gap-2 overflow-x-auto rounded-lg border bg-white p-3 dark:bg-zinc-900">
      {rounds.map((round, i) => {
        const config = round.interviewerConfig as InterviewerConfig;
        const isCurrent = i === currentRoundIndex;
        const isDone = round.status === 'completed' || round.status === 'skipped';
        const colorClass = INTERVIEWER_COLORS[round.interviewerType] || DEFAULT_INTERVIEWER_COLOR;

        return (
          <div
            key={round.id}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm transition-all',
              isCurrent && 'ring-2 ring-primary',
              isDone && 'opacity-60',
              colorClass
            )}
          >
            <span className="font-medium">{config.name}</span>
            {isDone && <span className="text-green-600">✓</span>}
            {isCurrent && (
              <Badge variant="secondary" className="text-xs">
                {t('questionProgress', { current: round.questionCount, max: round.maxQuestions })}
              </Badge>
            )}
          </div>
        );
      })}
      <div className="ml-auto shrink-0 text-sm text-zinc-500">
        {t('round', { current: currentRoundIndex + 1, total: rounds.length })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create InterviewerBanner component**

Create `src/components/interview/interviewer-banner.tsx`:

```typescript
'use client';

import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { INTERVIEWER_COLORS, DEFAULT_INTERVIEWER_COLOR } from '@/lib/interview/interviewers';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewerBannerProps {
  config: InterviewerConfig;
}

export function InterviewerBanner({ config }: InterviewerBannerProps) {
  const t = useTranslations('interview.interviewers');
  const colorClass = INTERVIEWER_COLORS[config.type] || DEFAULT_INTERVIEWER_COLOR;

  return (
    <div className={`rounded-lg border p-4 ${colorClass}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-bold dark:bg-zinc-800">
          {config.name[0]}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{config.name}</span>
            <Badge variant="secondary">{t(config.type.startsWith('custom_') ? 'custom' : config.type as any)}</Badge>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{config.title} · {config.style}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create message components**

Create `src/components/interview/interviewer-message.tsx`:

```typescript
'use client';

import { cn } from '@/lib/utils';
import { INTERVIEWER_COLORS, DEFAULT_INTERVIEWER_COLOR } from '@/lib/interview/interviewers';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewerMessageProps {
  content: string;
  config: InterviewerConfig;
}

export function InterviewerMessage({ content, config }: InterviewerMessageProps) {
  const colorClass = INTERVIEWER_COLORS[config.type] || DEFAULT_INTERVIEWER_COLOR;
  // Strip [ROUND_COMPLETE] from display
  const displayContent = content.replace(/\[ROUND_COMPLETE\]/g, '').trim();

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold dark:bg-zinc-800">
        {config.name[0]}
      </div>
      <div className={cn('max-w-[80%] rounded-lg border px-4 py-3 text-sm', colorClass)}>
        <p className="mb-1 text-xs font-medium text-zinc-500">{config.name}</p>
        <div className="whitespace-pre-wrap">{displayContent}</div>
      </div>
    </div>
  );
}
```

Create `src/components/interview/candidate-message.tsx`:

```typescript
'use client';

import { Bookmark, Lightbulb, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInterviewStore } from '@/stores/interview-store';

interface CandidateMessageProps {
  content: string;
  messageId: string;
}

export function CandidateMessage({ content, messageId }: CandidateMessageProps) {
  const { markedMessages, hintedQuestions, skippedQuestions } = useInterviewStore();
  const isMarked = markedMessages.has(messageId);
  const isHinted = hintedQuestions.has(messageId);
  const isSkipped = skippedQuestions.has(messageId);

  return (
    <div className="flex justify-end gap-3">
      <div className="max-w-[80%] rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground">
        <div className="whitespace-pre-wrap">{content}</div>
        {(isMarked || isHinted || isSkipped) && (
          <div className="mt-2 flex gap-2">
            {isMarked && <Bookmark className="h-3 w-3 text-yellow-300" />}
            {isHinted && <Lightbulb className="h-3 w-3 text-amber-300" />}
            {isSkipped && <SkipForward className="h-3 w-3 text-zinc-300" />}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create MessageList component**

Create `src/components/interview/message-list.tsx`:

```typescript
'use client';

import { useEffect, useRef } from 'react';
import type { UIMessage } from 'ai';
import { InterviewerMessage } from './interviewer-message';
import { CandidateMessage } from './candidate-message';
import type { InterviewerConfig } from '@/types/interview';

interface MessageListProps {
  messages: UIMessage[];
  interviewerConfig: InterviewerConfig;
}

export function MessageList({ messages, interviewerConfig }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((msg) => {
        const textPart = msg.parts?.find((p: any) => p.type === 'text');
        const content = (textPart as any)?.text || '';
        if (!content) return null;

        if (msg.role === 'assistant') {
          return <InterviewerMessage key={msg.id} content={content} config={interviewerConfig} />;
        }
        if (msg.role === 'user') {
          return <CandidateMessage key={msg.id} content={content} messageId={msg.id} />;
        }
        return null;
      })}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 6: Create MessageInput component**

Create `src/components/interview/message-input.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  input: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function MessageInput({ input, isLoading, onChange, onSubmit }: MessageInputProps) {
  const t = useTranslations('interview.room');

  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <Textarea
        value={input}
        onChange={onChange}
        placeholder={t('inputPlaceholder')}
        disabled={isLoading}
        className="min-h-[60px] flex-1 resize-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(e as any);
          }
        }}
      />
      <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="h-[60px] w-[60px]">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
```

- [ ] **Step 7: Create ControlBar component**

Create `src/components/interview/control-bar.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { SkipForward, Lightbulb, Bookmark, StopCircle, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInterviewStore } from '@/stores/interview-store';
import { getAIHeaders } from '@/stores/settings-store';
import { useLocale } from 'next-intl';

interface ControlBarProps {
  sessionId: string;
  roundId: string;
  lastAssistantMessageId?: string;
  isLoading: boolean;
}

export function ControlBar({ sessionId, roundId, lastAssistantMessageId, isLoading }: ControlBarProps) {
  const t = useTranslations('interview.room');
  const locale = useLocale();
  const { markedMessages, toggleMark, addHinted, addSkipped } = useInterviewStore();
  const isMarked = lastAssistantMessageId ? markedMessages.has(lastAssistantMessageId) : false;

  const sendControl = async (action: string) => {
    const fp = localStorage.getItem('careerhelper_fingerprint');
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
  };

  const handleHint = async () => {
    if (lastAssistantMessageId) addHinted(lastAssistantMessageId);
    await sendControl('hint');
  };

  const handleEndRound = async () => {
    await sendControl('end_round');
  };

  const handlePause = async () => {
    await sendControl('pause');
  };

  const handleMark = () => {
    if (!lastAssistantMessageId) return;
    toggleMark(lastAssistantMessageId);
    const fp = localStorage.getItem('careerhelper_fingerprint');
    fetch(`/api/interview/${sessionId}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(fp ? { 'x-fingerprint': fp } : {}),
      },
      body: JSON.stringify({ messageId: lastAssistantMessageId, marked: !isMarked }),
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleSkip} disabled={isLoading}>
        <SkipForward className="mr-1 h-3 w-3" />
        {t('skip')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleHint} disabled={isLoading}>
        <Lightbulb className="mr-1 h-3 w-3" />
        {t('hint')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleMark} disabled={!lastAssistantMessageId}>
        <Bookmark className="mr-1 h-3 w-3" />
        {isMarked ? t('unmark') : t('mark')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleEndRound} disabled={isLoading}>
        <StopCircle className="mr-1 h-3 w-3" />
        {t('endRound')}
      </Button>
      <Button variant="ghost" size="sm" onClick={handlePause}>
        <Pause className="mr-1 h-3 w-3" />
        {t('pause')}
      </Button>
    </div>
  );
}
```

- [ ] **Step 8: Create RoundTransition component**

Create `src/components/interview/round-transition.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { InterviewerBanner } from './interviewer-banner';
import type { InterviewerConfig } from '@/types/interview';

interface RoundTransitionProps {
  nextInterviewer: InterviewerConfig;
  onContinue: () => void;
  isLastRound?: boolean;
}

export function RoundTransition({ nextInterviewer, onContinue, isLastRound }: RoundTransitionProps) {
  const t = useTranslations('interview.room');

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12">
      <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">
        {isLastRound ? t('allComplete') : t('roundComplete')}
      </p>
      {!isLastRound && (
        <>
          <InterviewerBanner config={nextInterviewer} />
          <Button onClick={onContinue} size="lg">
            {t('nextRound')}
          </Button>
        </>
      )}
      {isLastRound && (
        <Button onClick={onContinue} size="lg">
          {t('generateReport')}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Create InterviewRoom container**

Create `src/components/interview/interview-room.tsx`:

```typescript
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useInterviewStore } from '@/stores/interview-store';
import { useInterviewChat } from '@/hooks/use-interview-chat';
import { useSettingsStore } from '@/stores/settings-store';
import { ProgressBar } from './progress-bar';
import { InterviewerBanner } from './interviewer-banner';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { ControlBar } from './control-bar';
import { RoundTransition } from './round-transition';
import type { InterviewerConfig } from '@/types/interview';

interface InterviewRoomProps {
  sessionId: string;
}

export function InterviewRoom({ sessionId }: InterviewRoomProps) {
  const t = useTranslations('interview.room');
  const router = useRouter();
  const { rounds, currentRoundIndex, setCurrentRoundIndex, advanceToNextRound, setIsGeneratingReport } =
    useInterviewStore();
  const [showTransition, setShowTransition] = useState(false);

  const currentRound = rounds[currentRoundIndex];
  const interviewerConfig = currentRound?.interviewerConfig as InterviewerConfig;

  const { messages, input, handleInputChange, handleSubmit, isLoading, resetMessages, sendMessage } =
    useInterviewChat({
      sessionId,
      roundId: currentRound?.id || '',
      selectedModel: useSettingsStore.getState().aiModel,
    });

  // Auto-send first message to get interviewer's opening
  useEffect(() => {
    if (currentRound && messages.length === 0 && !isLoading) {
      sendMessage({ text: '你好，我准备好了，请开始面试。' });
    }
  }, [currentRound?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detect round completion
  useEffect(() => {
    if (!messages.length || isLoading) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'assistant') return;
    const text = lastMsg.parts?.find((p: any) => p.type === 'text');
    if ((text as any)?.text?.includes('[ROUND_COMPLETE]')) {
      setShowTransition(true);
    }
  }, [messages, isLoading]);

  const handleNextRound = useCallback(() => {
    setShowTransition(false);
    advanceToNextRound();
    resetMessages();
  }, [advanceToNextRound, resetMessages]);

  const handleGenerateReport = useCallback(async () => {
    setIsGeneratingReport(true);
    router.push(`/interview/${sessionId}/report`);
  }, [sessionId, router, setIsGeneratingReport]);

  if (!currentRound) return null;

  const isLastRound = currentRoundIndex >= rounds.length - 1;
  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');

  if (showTransition) {
    const nextRound = rounds[currentRoundIndex + 1];
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <ProgressBar />
        <RoundTransition
          nextInterviewer={nextRound?.interviewerConfig as InterviewerConfig || interviewerConfig}
          onContinue={isLastRound ? handleGenerateReport : handleNextRound}
          isLastRound={isLastRound}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4" style={{ height: 'calc(100vh - 180px)' }}>
      <ProgressBar />
      <InterviewerBanner config={interviewerConfig} />
      <MessageList messages={messages} interviewerConfig={interviewerConfig} />
      {isLoading && (
        <p className="px-4 text-sm text-zinc-400">{t('generating')}</p>
      )}
      <div className="space-y-3 border-t pt-3">
        <ControlBar
          sessionId={sessionId}
          roundId={currentRound.id}
          lastAssistantMessageId={lastAssistantMsg?.id}
          isLoading={isLoading}
        />
        <MessageInput
          input={input}
          isLoading={isLoading}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 10: Verify all compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add src/app/\[locale\]/interview/\[id\]/page.tsx src/components/interview/interview-room.tsx src/components/interview/progress-bar.tsx src/components/interview/interviewer-banner.tsx src/components/interview/message-list.tsx src/components/interview/interviewer-message.tsx src/components/interview/candidate-message.tsx src/components/interview/message-input.tsx src/components/interview/control-bar.tsx src/components/interview/round-transition.tsx
git commit -m "feat: add interview room with chat, progress bar, controls, and round transitions"
```

---

### Task 16: Interview report page

**Files:**
- Create: `src/app/[locale]/interview/[id]/report/page.tsx`
- Create: `src/components/interview/interview-report.tsx`
- Create: `src/components/interview/report-overview.tsx`
- Create: `src/components/interview/radar-chart.tsx`
- Create: `src/components/interview/round-evaluation.tsx`
- Create: `src/components/interview/question-review.tsx`
- Create: `src/components/interview/improvement-plan.tsx`
- Create: `src/components/interview/history-comparison.tsx`
- Create: `src/components/interview/export-buttons.tsx`

- [ ] **Step 1: Create report page**

Create `src/app/[locale]/interview/[id]/report/page.tsx`:

```typescript
'use client';

import { use, useEffect, useState } from 'react';
import { InterviewReportView } from '@/components/interview/interview-report';
import { Skeleton } from '@/components/ui/skeleton';
import { getAIHeaders } from '@/stores/settings-store';
import type { InterviewReport, InterviewSession } from '@/types/interview';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fp = localStorage.getItem('careerhelper_fingerprint');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fp ? { 'x-fingerprint': fp } : {}),
      ...getAIHeaders(),
    };

    // Load session info
    fetch(`/api/interview/${id}`, { headers })
      .then((r) => r.json())
      .then(({ session: s, report: r }) => {
        setSession(s);
        if (r) {
          setReport(r);
          setLoading(false);
        } else {
          // Generate report
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
  }, [id]);

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
```

- [ ] **Step 2: Create ReportOverview component**

Create `src/components/interview/report-overview.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { InterviewReport, InterviewSession } from '@/types/interview';

function getGrade(score: number): { key: string; color: string } {
  if (score >= 90) return { key: 'excellent', color: 'text-green-600' };
  if (score >= 75) return { key: 'good', color: 'text-blue-600' };
  if (score >= 60) return { key: 'pass', color: 'text-yellow-600' };
  return { key: 'needsImprovement', color: 'text-red-600' };
}

interface ReportOverviewProps {
  report: InterviewReport;
  session: InterviewSession;
}

export function ReportOverview({ report, session }: ReportOverviewProps) {
  const t = useTranslations('interview.report');
  const grade = getGrade(report.overallScore);

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-6">
        <div className="text-center">
          <div className="text-5xl font-bold">{report.overallScore}</div>
          <div className={cn('text-sm font-medium', grade.color)}>
            {t(`grade.${grade.key}`)}
          </div>
        </div>
        <div className="flex-1">
          <h2 className="mb-1 text-lg font-semibold">{session.jobTitle}</h2>
          <p className="text-sm text-zinc-500">
            {new Date(session.createdAt).toLocaleDateString()}
            {' · '}
            {(session.selectedInterviewers as any[]).length} {t('overview')}
          </p>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
        {report.overallFeedback}
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Create RadarChart component**

Create `src/components/interview/radar-chart.tsx`:

```typescript
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
```

- [ ] **Step 4: Create QuestionReview component**

Create `src/components/interview/question-review.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Star, Bookmark, Lightbulb, SkipForward } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QuestionEvaluation } from '@/types/interview';

interface QuestionReviewProps {
  evaluation: QuestionEvaluation;
  index: number;
}

export function QuestionReview({ evaluation, index }: QuestionReviewProps) {
  const t = useTranslations('interview.report');

  return (
    <div className="rounded-md border p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-500">Q{index + 1}</span>
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn('h-3 w-3', i < evaluation.score ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-200')}
            />
          ))}
        </div>
        {evaluation.marked && (
          <Badge variant="outline" className="text-xs text-yellow-600">
            <Bookmark className="mr-1 h-3 w-3" />
            {t('markedForReview')}
          </Badge>
        )}
        {evaluation.hinted && (
          <Badge variant="outline" className="text-xs text-amber-600">
            <Lightbulb className="mr-1 h-3 w-3" />
            {t('usedHint')}
          </Badge>
        )}
        {evaluation.skipped && (
          <Badge variant="outline" className="text-xs text-zinc-500">
            <SkipForward className="mr-1 h-3 w-3" />
            {t('skippedQuestion')}
          </Badge>
        )}
      </div>
      <p className="mb-2 text-sm font-medium">{evaluation.question}</p>
      <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">{evaluation.answerSummary}</p>
      {evaluation.highlights.length > 0 && (
        <div className="mb-1">
          <span className="text-xs font-medium text-green-600">{t('highlights')}:</span>
          <ul className="ml-4 list-disc text-xs text-zinc-600">{evaluation.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </div>
      )}
      {evaluation.weaknesses.length > 0 && (
        <div className="mb-1">
          <span className="text-xs font-medium text-red-600">{t('weaknesses')}:</span>
          <ul className="ml-4 list-disc text-xs text-zinc-600">{evaluation.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
      <div>
        <span className="text-xs font-medium text-blue-600">{t('reference')}:</span>
        <p className="text-xs text-zinc-500">{evaluation.referenceTips}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create RoundEvaluation component**

Create `src/components/interview/round-evaluation.tsx`:

```typescript
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
  const t = useTranslations('interview.report');
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
        <Badge variant="secondary">{t(`../interviewers.${evaluation.interviewerType}` as any)}</Badge>
        <span className="ml-auto text-lg font-bold">{evaluation.score}</span>
      </button>
      {expanded && (
        <div className="space-y-3 p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{evaluation.feedback}</p>
          <h4 className="text-sm font-medium">{t('questionReview')}</h4>
          {evaluation.questions.map((q, i) => (
            <QuestionReview key={i} evaluation={q} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Create ImprovementPlan component**

Create `src/components/interview/improvement-plan.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ImprovementItem } from '@/types/interview';

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

interface ImprovementPlanProps {
  items: ImprovementItem[];
}

export function ImprovementPlan({ items }: ImprovementPlanProps) {
  const t = useTranslations('interview.report');

  return (
    <div className="rounded-lg border bg-white p-6 dark:bg-zinc-900">
      <h3 className="mb-4 text-lg font-semibold">{t('improvement')}</h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge className={cn(PRIORITY_COLORS[item.priority])}>{t(`priority.${item.priority}`)}</Badge>
              <span className="font-medium">{item.area}</span>
            </div>
            <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
            {item.resources.length > 0 && (
              <div>
                <span className="text-xs font-medium text-zinc-500">{t('resources')}:</span>
                <ul className="ml-4 list-disc text-xs text-zinc-500">
                  {item.resources.map((r, j) => (
                    <li key={j}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Create HistoryComparison component**

Create `src/components/interview/history-comparison.tsx`:

```typescript
'use client';

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
    const fp = localStorage.getItem('careerhelper_fingerprint');
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

  // Find last session for comparison
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
```

- [ ] **Step 8: Create ExportButtons component**

Create `src/components/interview/export-buttons.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';
import { FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { InterviewReport, InterviewSession } from '@/types/interview';

interface ExportButtonsProps {
  report: InterviewReport;
  session: InterviewSession;
}

export function ExportButtons({ report, session }: ExportButtonsProps) {
  const t = useTranslations('interview.report');

  const exportMarkdown = () => {
    const md = generateMarkdown(report, session);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${session.jobTitle}-${new Date(session.createdAt).toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={exportMarkdown}>
        <FileText className="mr-1 h-4 w-4" />
        {t('exportMarkdown')}
      </Button>
    </div>
  );
}

function generateMarkdown(report: InterviewReport, session: InterviewSession): string {
  const lines: string[] = [];
  lines.push(`# Interview Report: ${session.jobTitle}`);
  lines.push(`Date: ${new Date(session.createdAt).toLocaleDateString()}`);
  lines.push(`Overall Score: ${report.overallScore}/100\n`);
  lines.push(`## Overall Feedback\n${report.overallFeedback}\n`);

  lines.push(`## Dimension Scores`);
  for (const d of report.dimensionScores) {
    lines.push(`- ${d.dimension}: ${d.score}/100`);
  }
  lines.push('');

  lines.push(`## Round Evaluations`);
  for (const r of report.roundEvaluations) {
    lines.push(`### ${r.interviewerName} (${r.interviewerType}) — ${r.score}/100`);
    lines.push(r.feedback);
    for (const q of r.questions) {
      const tags = [q.marked && '[Review]', q.hinted && '[Hint]', q.skipped && '[Skipped]'].filter(Boolean).join(' ');
      lines.push(`\n**Q: ${q.question}** ${'⭐'.repeat(q.score)} ${tags}`);
      lines.push(`A: ${q.answerSummary}`);
      if (q.highlights.length) lines.push(`Highlights: ${q.highlights.join(', ')}`);
      if (q.weaknesses.length) lines.push(`Weaknesses: ${q.weaknesses.join(', ')}`);
      lines.push(`Reference: ${q.referenceTips}`);
    }
    lines.push('');
  }

  lines.push(`## Improvement Plan`);
  for (const item of report.improvementPlan) {
    lines.push(`### [${item.priority.toUpperCase()}] ${item.area}`);
    lines.push(item.description);
    if (item.resources.length) {
      lines.push(`Resources: ${item.resources.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
```

- [ ] **Step 9: Create InterviewReportView container**

Create `src/components/interview/interview-report.tsx`:

```typescript
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
      <div className="flex items-center justify-between">
        <Link href="/interview">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-1 h-4 w-4" />
            {t('backToLobby')}
          </Button>
        </Link>
        <ExportButtons report={report} session={session} />
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
```

- [ ] **Step 10: Verify all compile**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add src/app/\[locale\]/interview/\[id\]/report/ src/components/interview/interview-report.tsx src/components/interview/report-overview.tsx src/components/interview/radar-chart.tsx src/components/interview/round-evaluation.tsx src/components/interview/question-review.tsx src/components/interview/improvement-plan.tsx src/components/interview/history-comparison.tsx src/components/interview/export-buttons.tsx
git commit -m "feat: add interview report page with radar chart, round evaluations, improvement plan, and history comparison"
```

---

### Task 17: Navigation integration

**Files:**
- Modify: `src/components/layout/header.tsx`

- [ ] **Step 1: Add interview nav link to header**

In `src/components/layout/header.tsx`, add a new nav link after the templates link inside the `<nav>` element:

```typescript
<Link
  href="/interview"
  className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
>
  {t('interview.nav')}
</Link>
```

- [ ] **Step 2: Verify it compiles**

Run: `pnpm type-check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/header.tsx
git commit -m "feat: add interview nav link to header"
```

---

### Task 18: Smoke test — full flow verification

- [ ] **Step 1: Start dev server**

Run: `pnpm dev`
Expected: Server starts without errors on http://localhost:3000

- [ ] **Step 2: Verify database migration**

Navigate to `/interview` in the browser. The page should load without DB errors — the 4 new tables should be auto-created.

- [ ] **Step 3: Create a new interview**

Navigate to `/interview/new`:
- Paste a sample JD
- Optionally select a resume
- Select 2-3 interviewers
- Click "Start Interview"
Expected: Redirects to `/interview/{id}` and first interviewer's opening message appears

- [ ] **Step 4: Test chat interaction**

Answer 2-3 questions. Test:
- Skip button works (injects system message)
- Hint button works (interviewer gives guidance)
- Mark button toggles (bookmark icon appears)
Expected: AI responds in character, controls function correctly

- [ ] **Step 5: Test round transition**

Complete a round (answer enough questions or click "End Round"):
Expected: Round transition UI appears with next interviewer card

- [ ] **Step 6: Test report generation**

Complete all rounds, click "Generate Report":
Expected: Report page loads with score, radar chart, per-question reviews, and improvement plan

- [ ] **Step 7: Test export**

Click "Export Markdown":
Expected: `.md` file downloads with full report content

- [ ] **Step 8: Commit all fixes from smoke testing**

```bash
git add -A
git commit -m "fix: address issues found during smoke testing"
```

---

## Summary

**18 tasks** covering the complete feature:
- Tasks 1-6: Data layer (schema, types, interviewers, repository, AI prompts)
- Task 7: i18n
- Tasks 8-12: State management and API layer (store, CRUD, chat, control, report APIs, hook)
- Tasks 13-16: UI layer (lobby, setup, room, report)
- Task 17: Navigation integration
- Task 18: End-to-end smoke test
