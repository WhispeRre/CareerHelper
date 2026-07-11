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
