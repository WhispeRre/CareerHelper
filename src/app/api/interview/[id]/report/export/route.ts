import { NextRequest, NextResponse } from 'next/server';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { interviewRepository } from '@/lib/db/repositories/interview.repository';
import { generatePdf } from '@/lib/pdf/generate-pdf';
import { generateInterviewReportHtml } from './html';
import { dbReady } from '@/lib/db';

export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const report = await interviewRepository.findReportBySessionId(sessionId);
    if (!report) {
      return NextResponse.json({ error: 'No report found' }, { status: 404 });
    }

    const html = generateInterviewReportHtml(report, session);
    const pdfBuffer = await generatePdf(html);

    const title = session.jobTitle || 'interview-report';
    const date = new Date(session.createdAt as any).toISOString().slice(0, 10);
    const filename = `${title}-${date}`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}.pdf"`,
      },
    });
  } catch (error) {
    console.error('GET /api/interview/[id]/report/export error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
