import { NextRequest, NextResponse } from 'next/server';
import { resumeRepository } from '@/lib/db/repositories/resume.repository';
import { resolveUser, getUserIdFromRequest } from '@/lib/auth/helpers';

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

    return NextResponse.json(resume);
  } catch (error) {
    console.error('GET /api/resume/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    const { title, template, themeConfig, sections } = body;

    // Update resume metadata
    if (title || template || themeConfig) {
      await resumeRepository.update(id, {
        ...(title && { title }),
        ...(template && { template }),
        ...(themeConfig && { themeConfig }),
      });
    }

    // Sync sections: create new, update existing, delete removed
    if (sections && Array.isArray(sections)) {
      const existingSections = resume.sections || [];
      const existingIds = new Set(existingSections.map((s: any) => s.id));
      const incomingIds = new Set(sections.map((s: any) => s.id));

      // Delete sections that were removed by the user
      for (const existing of existingSections) {
        if (!incomingIds.has(existing.id)) {
          await resumeRepository.deleteSection(existing.id);
        }
      }

      for (const section of sections) {
        if (existingIds.has(section.id)) {
          // Update existing section
          await resumeRepository.updateSection(section.id, {
            title: section.title,
            sortOrder: section.sortOrder,
            visible: section.visible,
            content: section.content,
          });
        } else {
          // Create new section added by the user
          await resumeRepository.createSection({
            id: section.id,
            resumeId: id,
            type: section.type,
            title: section.title,
            sortOrder: section.sortOrder,
            visible: section.visible,
            content: section.content,
          });
        }
      }
    }

    const updated = await resumeRepository.findById(id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('PUT /api/resume/[id] error:', error);
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

    await resumeRepository.delete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/resume/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
