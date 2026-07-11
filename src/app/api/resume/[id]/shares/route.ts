import { NextRequest, NextResponse } from 'next/server';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { shareRepository } from '@/lib/db/repositories/share.repository';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { generateShareToken, getShareUrl, hashPassword } from '@/lib/utils/share';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await resumeRepository.findById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (resume.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const shares = await shareRepository.findByResumeId(id);
    const sharesWithUrl = shares.map((s: any) => ({
      ...s,
      shareUrl: getShareUrl(s.token, request),
      hasPassword: !!s.password,
      password: undefined,
    }));

    return NextResponse.json(sharesWithUrl);
  } catch (error) {
    console.error('GET /api/resume/[id]/shares error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fingerprint = getUserIdFromRequest(request);
    const user = await resolveUser(fingerprint);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await resumeRepository.findById(id);
    if (!resume) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (resume.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { label, password } = body as { label?: string; password?: string };

    const token = generateShareToken();
    const hashedPassword = password ? await hashPassword(password) : null;

    const share = await shareRepository.create({
      resumeId: id,
      token,
      label: label || '',
      password: hashedPassword,
    });

    return NextResponse.json({
      ...share,
      shareUrl: getShareUrl(token, request),
      hasPassword: !!hashedPassword,
      password: undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/resume/[id]/shares error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
