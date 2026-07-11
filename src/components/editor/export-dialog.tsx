'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useResumeStore } from '@/stores/resume-store';
import {
  FileDown,
  FileText,
  Globe,
  AlignLeft,
  Braces,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

type ExportFormat = 'pdf' | 'pdf-one-page' | 'docx' | 'html' | 'txt' | 'json';
type ExportState = 'idle' | 'exporting' | 'success' | 'error';

const FORMAT_OPTIONS: {
  value: ExportFormat;
  icon: typeof FileDown;
  labelKey: string;
  descKey: string;
  tooltipKey?: string;
}[] = [
  { value: 'pdf', icon: FileDown, labelKey: 'pdf', descKey: 'pdfDescription' },
  { value: 'pdf-one-page', icon: Sparkles, labelKey: 'pdfOnePage', descKey: 'pdfOnePageDescription', tooltipKey: 'pdfOnePageTooltip' },
  { value: 'docx', icon: FileText, labelKey: 'docx', descKey: 'docxDescription' },
  { value: 'html', icon: Globe, labelKey: 'html', descKey: 'htmlDescription' },
  { value: 'txt', icon: AlignLeft, labelKey: 'txt', descKey: 'txtDescription' },
  { value: 'json', icon: Braces, labelKey: 'json', descKey: 'jsonDescription' },
];

export function ExportDialog({ open, onOpenChange, resumeId }: ExportDialogProps) {
  const t = useTranslations('export');
  const { currentResume, isDirty, save } = useResumeStore();

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [state, setState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [canPrintFallback, setCanPrintFallback] = useState(false);

  useEffect(() => {
    if (open) {
      setState('idle');
      setErrorMessage('');
      setSelectedFormat('pdf');
      setCanPrintFallback(false);
    }
  }, [open]);

  // Client-side fallback: when the server can't render a PDF (no Chromium / OOM →
  // 502/500), fetch the print-ready HTML and open the browser's own print dialog,
  // where the user can "Save as PDF" (issue #85).
  const handlePrintFallback = useCallback(async () => {
    try {
      const fingerprint = getStoredFingerprint();
      const res = await fetch(`/api/resume/${resumeId}/export?format=html&forPrint=true`, {
        headers: { ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}) },
      });
      if (!res.ok) throw new Error('Failed to load resume HTML');
      const html = await res.text();

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.setAttribute('aria-hidden', 'true');
      iframe.onload = () => {
        const win = iframe.contentWindow;
        if (!win) return;
        // Give web fonts a beat to load before printing.
        setTimeout(() => {
          win.focus();
          win.print();
          // Remove after the print dialog has had time to open.
          setTimeout(() => iframe.remove(), 60_000);
        }, 400);
      };
      iframe.srcdoc = html;
      document.body.appendChild(iframe);
      onOpenChange(false);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('error'));
    }
  }, [resumeId, onOpenChange, t]);

  const handleExport = useCallback(async () => {
    setState('exporting');
    setErrorMessage('');
    setCanPrintFallback(false);

    try {
      // Save first if dirty
      if (isDirty) await save();

      const fingerprint = getStoredFingerprint();
      const queryFormat = selectedFormat === 'pdf-one-page' ? 'pdf' : selectedFormat;
      const fitParam = selectedFormat === 'pdf-one-page' ? '&fitOnePage=true' : '';
      const res = await fetch(`/api/resume/${resumeId}/export?format=${queryFormat}${fitParam}`, {
        headers: {
          ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Export failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const title = currentResume?.title || 'resume';
      const now = new Date();
      const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const extMap: Record<ExportFormat, string> = {
        'pdf': 'pdf',
        'pdf-one-page': 'pdf',
        'docx': 'docx',
        'html': 'html',
        'txt': 'txt',
        'json': 'json',
      };
      a.download = `${title}-${ts}.${extMap[selectedFormat]}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState('success');
      setTimeout(() => onOpenChange(false), 1500);
    } catch (err: any) {
      setState('error');
      setErrorMessage(err.message || t('error'));
      // Offer the browser-print fallback only for the PDF formats.
      setCanPrintFallback(selectedFormat === 'pdf' || selectedFormat === 'pdf-one-page');
    }
  }, [resumeId, selectedFormat, currentResume, isDirty, save, onOpenChange, t]);

  const isLoading = state === 'exporting';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5 text-brand" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {state === 'idle' && (
            <TooltipProvider>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FORMAT_OPTIONS.map((format) => {
                  const Icon = format.icon;
                  const isSelected = selectedFormat === format.value;
                  const card = (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`cursor-pointer flex flex-col items-center gap-2 rounded-lg border-2 p-4 text-center transition-all duration-150 hover:border-brand hover:bg-brand-muted/50 dark:hover:border-brand dark:hover:bg-brand-muted/20 ${
                        isSelected
                          ? 'border-brand bg-brand-muted dark:border-brand dark:bg-brand-muted'
                          : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-brand' : 'text-zinc-500 dark:text-zinc-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-brand dark:text-brand' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        {t(format.labelKey)}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {t(format.descKey)}
                      </span>
                    </button>
                  );
                  if (format.tooltipKey) {
                    return (
                      <Tooltip key={format.value}>
                        <TooltipTrigger asChild>{card}</TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6}>
                          {t(format.tooltipKey)}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return card;
                })}
              </div>
            </TooltipProvider>
          )}

          {state === 'exporting' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-brand mb-3" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('exporting')}
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-3" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('success')}
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mb-3" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {errorMessage || t('error')}
              </p>
              {canPrintFallback && (
                <>
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {t('pdfFailedHint')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handlePrintFallback}
                    className="mt-3 cursor-pointer gap-1.5"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    {t('printFallback')}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          {(state === 'idle' || state === 'error') && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={handleExport}
                disabled={isLoading}
                className="cursor-pointer bg-brand hover:bg-brand-hover"
              >
                {t('export')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
