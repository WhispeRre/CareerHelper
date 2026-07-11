'use client';

import { getStoredFingerprint } from '@/lib/fingerprint-storage';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Share2,
  Loader2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Link2,
  Plus,
  Trash2,
  Lock,
  Pencil,
} from 'lucide-react';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

interface ShareItem {
  id: string;
  token: string;
  label: string;
  shareUrl: string;
  hasPassword: boolean;
  viewCount: number;
  isActive: boolean;
  createdAt: string;
}

// Deterministic color from label string
const LABEL_COLORS = [
  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
];

function getLabelColor(label: string) {
  if (!label) return 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return LABEL_COLORS[Math.abs(hash) % LABEL_COLORS.length];
}

export function ShareDialog({ open, onOpenChange, resumeId }: ShareDialogProps) {
  const t = useTranslations('share');

  const [loading, setLoading] = useState(true);
  const [shares, setShares] = useState<ShareItem[]>([]);
  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [editLabelValue, setEditLabelValue] = useState('');

  const getHeaders = () => {
    const fingerprint = getStoredFingerprint();
    return {
      'Content-Type': 'application/json',
      ...(fingerprint ? { 'x-fingerprint': fingerprint } : {}),
    };
  };

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/resume/${resumeId}/shares`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setShares(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [resumeId]);

  useEffect(() => {
    if (!open) return;
    setNewLabel('');
    setNewPassword('');
    setCopiedId(null);
    fetchShares();
  }, [open, fetchShares]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/resume/${resumeId}/shares`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          label: newLabel || undefined,
          password: newPassword || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShares((prev) => [data, ...prev]);
        setNewLabel('');
        setNewPassword('');
      }
    } catch {
      // silent
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (share: ShareItem) => {
    const newActive = !share.isActive;
    setShares((prev) =>
      prev.map((s) => (s.id === share.id ? { ...s, isActive: newActive } : s))
    );
    try {
      const res = await fetch(`/api/resume/${resumeId}/shares/${share.id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ isActive: newActive }),
      });
      if (!res.ok) throw new Error('Failed');
    } catch {
      // Revert optimistic update
      setShares((prev) =>
        prev.map((s) => (s.id === share.id ? { ...s, isActive: share.isActive } : s))
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`/api/resume/${resumeId}/shares/${deleteTarget}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      setShares((prev) => prev.filter((s) => s.id !== deleteTarget));
    } catch {
      // silent
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleCopy = async (share: ShareItem) => {
    try {
      await navigator.clipboard.writeText(share.shareUrl);
    } catch {
      const input = document.createElement('input');
      input.value = share.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveLabel = async (shareId: string) => {
    setShares((prev) =>
      prev.map((s) => (s.id === shareId ? { ...s, label: editLabelValue } : s))
    );
    setEditingLabel(null);
    try {
      await fetch(`/api/resume/${resumeId}/shares/${shareId}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ label: editLabelValue }),
      });
    } catch {
      // silent
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="flex items-center gap-2.5 text-base">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-brand-muted dark:bg-brand-muted">
                <Share2 className="h-4 w-4 text-brand" />
              </div>
              {t('title')}
            </DialogTitle>
            <DialogDescription className="text-sm">{t('description')}</DialogDescription>
          </DialogHeader>

          <div className="px-6 pb-6 space-y-5">
            {/* ── Create new share ── */}
            <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="flex items-end gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {t('label')}
                  </label>
                  <Input
                    placeholder={t('labelPlaceholder')}
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-9 text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !creating) handleCreate();
                    }}
                  />
                </div>
                <div className="w-36 space-y-1.5">
                  <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                    {t('password')}
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="..."
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="h-9 pr-8 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !creating) handleCreate();
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="cursor-pointer absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="cursor-pointer bg-brand hover:bg-brand-hover text-white shrink-0 h-9 px-4 text-sm font-medium transition-colors"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {t('create')}
                </Button>
              </div>
            </div>

            {/* ── Loading ── */}
            {loading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-zinc-300 dark:text-zinc-600" />
              </div>
            )}

            {/* ── Empty state ── */}
            {!loading && shares.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                  <Link2 className="h-4.5 w-4.5 text-zinc-400" />
                </div>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">{t('noShares')}</p>
              </div>
            )}

            {/* ── Share list ── */}
            {!loading && shares.length > 0 && (
              <div className="space-y-3 max-h-[21rem] overflow-y-auto pr-0.5 -mr-0.5">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className={`group/card rounded-xl border p-4 transition-all duration-200 ${
                      share.isActive
                        ? 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                        : 'border-zinc-200/50 bg-zinc-50/80 dark:border-zinc-800/50 dark:bg-zinc-950/50'
                    }`}
                  >
                    {/* Row 1: Label + metadata + actions */}
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {editingLabel === share.id ? (
                          <Input
                            autoFocus
                            value={editLabelValue}
                            onChange={(e) => setEditLabelValue(e.target.value)}
                            onBlur={() => handleSaveLabel(share.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveLabel(share.id);
                              if (e.key === 'Escape') setEditingLabel(null);
                            }}
                            className="h-7 text-xs w-28 px-2 rounded-md"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingLabel(share.id);
                              setEditLabelValue(share.label);
                            }}
                            className="cursor-pointer flex items-center gap-1.5 group/label"
                          >
                            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getLabelColor(share.label)}`}>
                              {share.label || t('noLabel')}
                            </span>
                            <Pencil className="h-3 w-3 text-zinc-300 dark:text-zinc-600 opacity-0 group-hover/label:opacity-100 transition-opacity duration-150" />
                          </button>
                        )}
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums">
                          {formatDate(share.createdAt)}
                        </span>
                        {share.hasPassword && (
                          <Lock className="h-3 w-3 text-zinc-300 dark:text-zinc-600" />
                        )}
                        {!share.isActive && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-600 font-medium uppercase tracking-wide">
                            {t('inactive')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 tabular-nums mr-1">
                          <Eye className="h-3 w-3 inline -mt-px mr-0.5" />
                          {share.viewCount}
                        </span>
                        <Switch
                          checked={share.isActive}
                          onCheckedChange={() => handleToggleActive(share)}
                          className="cursor-pointer scale-90 origin-center"
                        />
                        <button
                          type="button"
                          className="cursor-pointer inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:text-zinc-600 dark:hover:text-red-400 dark:hover:bg-red-950/30 transition-colors duration-150"
                          onClick={() => setDeleteTarget(share.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: URL + Copy */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`min-w-0 flex-1 flex items-center gap-2 rounded-lg px-3 py-2 ${
                          share.isActive
                            ? 'bg-zinc-50 dark:bg-zinc-800/60'
                            : 'bg-zinc-100/60 dark:bg-zinc-800/30'
                        }`}
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <span className="truncate text-[13px] font-mono text-zinc-500 dark:text-zinc-400">
                          {share.shareUrl}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(share)}
                        className={`cursor-pointer shrink-0 h-8 px-3 text-xs font-medium transition-all duration-200 ${
                          copiedId === share.id
                            ? 'border-green-200 bg-green-50 text-green-600 dark:border-green-800 dark:bg-green-950/30 dark:text-green-400'
                            : ''
                        }`}
                      >
                        {copiedId === share.id ? (
                          <><Check className="h-3.5 w-3.5 mr-1" />{t('copied')}</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5 mr-1" />{t('copyLink')}</>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-zinc-100 px-6 py-3.5 dark:border-zinc-800 flex justify-between items-center">
            {!loading && shares.length > 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums">
                {shares.length} {shares.length === 1 ? 'link' : 'links'}
              </p>
            )}
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="cursor-pointer text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {t('close')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteShare')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              {t('deleteShare')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
