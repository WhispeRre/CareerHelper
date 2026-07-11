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
