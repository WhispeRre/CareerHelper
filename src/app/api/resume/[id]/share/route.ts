import { NextRequest, NextResponse } from 'next/server';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';
import { generateShareToken, getShareUrl, hashPassword } from '@/lib/utils/share';

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
    const { password } = body as { password?: string };

    // Reuse existing token or generate a new one
    const shareToken = resume.shareToken || generateShareToken();
    const hashedPassword = password ? await hashPassword(password) : resume.sharePassword;

    await resumeRepository.updateShareSettings(id, {
      isPublic: true,
      shareToken,
      sharePassword: hashedPassword,
    });

    return NextResponse.json({
      shareToken,
      shareUrl: getShareUrl(shareToken, request),
      isPublic: true,
    });
  } catch (error) {
    console.error('POST /api/resume/[id]/share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    return NextResponse.json({
      isPublic: resume.isPublic,
      shareToken: resume.shareToken,
      shareUrl: resume.shareToken ? getShareUrl(resume.shareToken, request) : null,
      viewCount: resume.viewCount,
      hasPassword: !!resume.sharePassword,
    });
  } catch (error) {
    console.error('GET /api/resume/[id]/share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    await resumeRepository.updateShareSettings(id, {
      isPublic: false,
      shareToken: null,
      sharePassword: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/resume/[id]/share error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
