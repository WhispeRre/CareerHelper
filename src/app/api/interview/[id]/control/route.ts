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
    case 'end_round': {
      // Mark current round as completed
      if (roundId) {
        await interviewRepository.updateRoundStatus(roundId, 'completed');
      }
      // Advance to next round or complete session
      const rounds = await interviewRepository.findRoundsBySessionId(sessionId);
      const currentIndex = rounds.findIndex((r: any) => r.id === roundId);
      const nextRound = currentIndex >= 0 ? rounds[currentIndex + 1] : undefined;
      if (nextRound) {
        await interviewRepository.updateSessionRound(sessionId, currentIndex + 1);
      } else {
        await interviewRepository.updateSessionStatus(sessionId, 'completed');
      }
      return NextResponse.json({ success: true });
    }
    case 'pause':
      await interviewRepository.updateSessionStatus(sessionId, 'paused');
      return NextResponse.json({ success: true });
    case 'resume':
      await interviewRepository.updateSessionStatus(sessionId, 'in_progress');
      return NextResponse.json({ success: true });
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }

  if (systemMessage && roundId) {
    await interviewRepository.addMessage({
      roundId,
      role: 'system',
      content: systemMessage,
    });
  }

  return NextResponse.json({ success: true, systemMessage });
}
