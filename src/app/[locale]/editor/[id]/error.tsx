'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Editor error:', error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50">
      <div className="mx-4 max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-zinc-900">页面出错了</h2>
        <p className="mb-6 text-sm text-zinc-500">
          {error.message?.includes('Server Action')
            ? '页面版本已更新，请刷新页面重试。'
            : '遇到了意外错误，请尝试刷新页面。'}
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            <RotateCcw className="h-4 w-4" />
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            刷新页面
          </button>
        </div>
      </div>
    </div>
  );
}
