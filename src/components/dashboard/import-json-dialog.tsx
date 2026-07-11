'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileJson,
} from 'lucide-react';

interface ImportJsonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ImportState = 'idle' | 'importing' | 'success' | 'error';

function getHeaders() {
  const fingerprint = typeof window !== 'undefined' ? getStoredFingerprint() : null;
  return {
    'Content-Type': 'application/json',
    ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
  };
}

export function ImportJsonDialog({ open, onOpenChange }: ImportJsonDialogProps) {
  const t = useTranslations('import');
  const router = useRouter();

  const [state, setState] = useState<ImportState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setState('idle');
      setErrorMessage('');
      setSelectedFile(null);
    }
  }, [open]);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.json')) {
      setState('error');
      setErrorMessage(t('invalidFormat'));
      return;
    }
    setSelectedFile(file);
    setState('idle');
    setErrorMessage('');
  }, [t]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;

    setState('importing');
    setErrorMessage('');

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data.sections)) {
        throw new Error(t('invalidFormat'));
      }

      // Create a new resume with imported data (ids are ignored server-side)
      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          title: data.title || 'Imported Resume',
          template: data.template || 'classic',
          themeConfig: data.themeConfig,
          sections: data.sections,
        }),
      });

      if (!res.ok) throw new Error(t('error'));
      const newResume = await res.json();

      setState('success');
      setTimeout(() => {
        onOpenChange(false);
        router.push(`/editor/${newResume.id}`);
      }, 1000);
    } catch (err: any) {
      setState('error');
      if (err instanceof SyntaxError) {
        setErrorMessage(t('invalidFormat'));
      } else {
        setErrorMessage(err.message || t('error'));
      }
    }
  }, [selectedFile, onOpenChange, router, t]);

  const isLoading = state === 'importing';

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !isLoading) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-brand" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>{t('dashboardDescription')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          {(state === 'idle' || (state === 'error' && selectedFile)) && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging
                  ? 'border-brand bg-brand-muted dark:bg-brand-muted'
                  : selectedFile
                    ? 'border-green-300 bg-green-50/50 dark:border-green-700 dark:bg-green-950/20'
                    : 'border-zinc-300 hover:border-brand hover:bg-brand-muted/30 dark:border-zinc-600 dark:hover:border-brand dark:hover:bg-brand-muted/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleInputChange}
                className="hidden"
              />
              {selectedFile ? (
                <>
                  <FileJson className="mb-3 h-8 w-8 text-green-500" />
                  <p className="max-w-full truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {selectedFile.name}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{t('dragHint')}</p>
                </>
              ) : (
                <>
                  <Upload className="mb-3 h-8 w-8 text-zinc-400" />
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    {t('selectFile')}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">{t('dragHint')}</p>
                </>
              )}
            </div>
          )}

          {state === 'error' && !selectedFile && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <AlertCircle className="mb-3 h-8 w-8 text-red-500" />
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {errorMessage || t('error')}
              </p>
            </div>
          )}

          {state === 'importing' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-brand" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('importing')}
              </p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="mb-3 h-8 w-8 text-green-500" />
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('success')}
              </p>
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
                onClick={handleImport}
                disabled={!selectedFile || isLoading}
                className="cursor-pointer bg-brand hover:bg-brand-hover"
              >
                {t('importBtn')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
