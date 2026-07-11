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

  // Include messages for each round (needed for resume/history)
  const roundsWithMessages = await Promise.all(
    rounds.map(async (round: any) => {
      const messages = await interviewRepository.findMessagesByRoundId(round.id);
      return { ...round, messages };
    })
  );

  return NextResponse.json({ session, rounds: roundsWithMessages, report });
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
