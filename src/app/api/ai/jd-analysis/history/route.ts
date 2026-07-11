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
      const analysis = await analysisRepository.findJdAnalysisById(id);
      if (!analysis || analysis.resumeId !== resumeId) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(analysis);
    }

    // List all
    const analyses = await analysisRepository.findJdAnalysesByResumeId(resumeId);

    const list = analyses.map((a: any) => ({
      id: a.id,
      overallScore: a.overallScore,
      atsScore: a.atsScore,
      jobDescription: a.jobDescription.slice(0, 100),
      createdAt: a.createdAt,
    }));

    return NextResponse.json(list);
  } catch (error) {
    console.error('GET /api/ai/jd-analysis/history error:', error);
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

    // Verify ownership via the analysis record
    const analysis = await analysisRepository.findJdAnalysisById(id);
    if (!analysis) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const resume = await resumeRepository.findById(analysis.resumeId);
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await analysisRepository.deleteJdAnalysis(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/ai/jd-analysis/history error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
