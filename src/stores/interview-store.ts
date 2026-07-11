import { create } from 'zustand';
import type {
  InterviewSession,
  InterviewRound,
  InterviewReport,
} from '@/types/interview';

interface InterviewStore {
  currentSession: InterviewSession | null;
  rounds: InterviewRound[];
  currentRoundIndex: number;
  status: 'idle' | 'preparing' | 'in_progress' | 'paused' | 'completed';
  questionCount: number;
  markedMessages: Set<string>;
  hintedQuestions: Set<string>;
  skippedQuestions: Set<string>;
  report: InterviewReport | null;
  isGeneratingReport: boolean;

  setSession: (session: InterviewSession, rounds: InterviewRound[]) => void;
  setStatus: (status: InterviewStore['status']) => void;
  setCurrentRoundIndex: (index: number) => void;
  advanceToNextRound: () => void;
  updateRound: (roundId: string, updates: Partial<InterviewRound>) => void;
  incrementQuestionCount: () => void;
  toggleMark: (messageId: string) => void;
  addHinted: (messageId: string) => void;
  addSkipped: (messageId: string) => void;
  setReport: (report: InterviewReport) => void;
  setIsGeneratingReport: (v: boolean) => void;
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
    set({
      currentSession: session,
      rounds,
      currentRoundIndex: session.currentRound ?? 0,
      questionCount: 0,
      status: session.status as InterviewStore['status'],
      markedMessages: new Set(),
      hintedQuestions: new Set(),
      skippedQuestions: new Set(),
      report: null,
      isGeneratingReport: false,
    }),

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
