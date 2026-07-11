import { NextRequest, NextResponse } from 'next/server';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { shareRepository } from '@/lib/db/repositories/share.repository';
import { hashPassword } from '@/lib/utils/share';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const password = request.nextUrl.searchParams.get('password');

    // 1. Try new resume_shares table first
    const share = await shareRepository.findByToken(token);
    if (share) {
      console.log('[share/token] found in resumeShares, isActive:', share.isActive, typeof share.isActive);
      if (!share.isActive) {
        return NextResponse.json({ error: 'This share link has been disabled' }, { status: 403 });
      }

      if (share.password) {
        if (!password) {
          return NextResponse.json(
            { error: 'Password required', passwordRequired: true },
            { status: 401 }
          );
        }
        const hashedInput = await hashPassword(password);
        if (hashedInput !== share.password) {
          return NextResponse.json(
            { error: 'Invalid password', passwordRequired: true },
            { status: 401 }
          );
        }
      }

      await shareRepository.incrementViewCount(share.id);

      const resume = await resumeRepository.findById(share.resumeId);
      if (!resume) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }

      const { userId, sharePassword, ...publicResume } = resume;
      return NextResponse.json(publicResume);
    }

    // 2. Fallback to legacy resumes.shareToken
    const resume = await resumeRepository.findByShareToken(token);
    if (!resume) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!resume.isPublic) {
      return NextResponse.json({ error: 'This resume is not shared' }, { status: 403 });
    }

    if (resume.sharePassword) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password required', passwordRequired: true },
          { status: 401 }
        );
      }
      const hashedInput = await hashPassword(password);
      if (hashedInput !== resume.sharePassword) {
        return NextResponse.json(
          { error: 'Invalid password', passwordRequired: true },
          { status: 401 }
        );
      }
    }

    await resumeRepository.incrementViewCount(resume.id);

    const { userId, sharePassword, ...publicResume } = resume;
    return NextResponse.json(publicResume);
  } catch (error) {
    console.error('GET /api/share/[token] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
