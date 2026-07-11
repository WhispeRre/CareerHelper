'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/routing';
import { ResumePreview } from '@/components/preview/resume-preview';
import { PreviewErrorBoundary } from '@/components/preview/preview-error-boundary';
import { usePdfExport } from '@/hooks/use-pdf-export';
import { normalizeSections } from '@/lib/resume/normalize-content';
import type { Resume } from '@/types/resume';

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const t = useTranslations();
  const { exportPdf, isExporting } = usePdfExport();
  const [resume, setResume] = useState<Resume | null>(null);

  useEffect(() => {
    const fingerprint = getStoredFingerprint();
    fetch(`/api/resume/${id}`, {
      headers: fingerprint ? { 'x-fingerprint': fingerprint } : {},
    })
      .then((res) => res.json())
      // Heal AI-corrupted content so a bad shape can't crash the preview (issue #87).
      .then((data: Resume) => setResume({ ...data, sections: normalizeSections(data.sections || []) }))
      .catch(console.error);
  }, [id]);

  if (!resume) {
    return <div className="flex h-screen items-center justify-center text-zinc-400">{t('common.loading')}</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-2">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/editor/${id}`)} className="cursor-pointer gap-1">
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </Button>
        <Button
          size="sm"
          disabled={isExporting}
          onClick={() => exportPdf(id, resume.title)}
          className="cursor-pointer gap-1 bg-brand hover:bg-brand-hover"
        >
          <Download className="h-4 w-4" />
          {isExporting ? t('pdf.exporting') : t('editor.toolbar.export')}
        </Button>
      </div>
      <div className="p-8 pb-20 sm:pb-8">
        <PreviewErrorBoundary
          resetKey={resume.sections}
          fallback={
            <div className="p-8 text-center text-sm text-zinc-500">{t('editor.toolbar.previewError')}</div>
          }
        >
          <ResumePreview resume={resume} />
        </PreviewErrorBoundary>
      </div>
      {/* Mobile bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t bg-white p-3 dark:bg-background sm:hidden">
        <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => router.push(`/editor/${id}`)}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t('common.back')}
        </Button>
        <Button
          className="flex-1 cursor-pointer bg-brand hover:bg-brand-hover"
          onClick={() => exportPdf(id, resume.title)}
          disabled={isExporting}
        >
          <Download className="mr-1.5 h-4 w-4" />
          {isExporting ? t('pdf.exporting') : t('editor.toolbar.export')}
        </Button>
      </div>
    </div>
  );
}
