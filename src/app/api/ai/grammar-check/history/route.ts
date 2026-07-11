import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { analysisRepository } from '@/lib/db/repositories/analysis.repository';

export async function GET(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resumeId = request.nextUrl.searchParams.get('resumeId');
    const id = request.nextUrl.searchParams.get('id');

    if (!resumeId) {
      return NextResponse.json({ error: 'resumeId is required' }, { status: 400 });
    }

    // Verify ownership
    const resume = await resumeRepository.findById(resumeId);
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Single record detail
    if (id) {
      const check = await analysisRepository.findGrammarCheckById(id);
      if (!check || check.resumeId !== resumeId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(check);
    }

    // List all
    const checks = await analysisRepository.findGrammarChecksByResumeId(resumeId);

    const list = checks.map((c: any) => ({
      id: c.id,
      score: c.score,
      issueCount: c.issueCount,
      createdAt: c.createdAt,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('GET /api/ai/grammar-check/history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const check = await analysisRepository.findGrammarCheckById(id);
    if (!check) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const resume = await resumeRepository.findById(check.resumeId);
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await analysisRepository.deleteGrammarCheck(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/ai/grammar-check/history error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
