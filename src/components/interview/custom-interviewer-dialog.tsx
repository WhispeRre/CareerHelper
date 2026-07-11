'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { InterviewerConfig } from '@/types/interview';

interface CustomInterviewerDialogProps {
  onAdd: (config: InterviewerConfig) => void;
  trigger: React.ReactNode;
}

export function CustomInterviewerDialog({ onAdd, trigger }: CustomInterviewerDialogProps) {
  const t = useTranslations('interview.setup.custom');
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [bio, setBio] = useState('');
  const [style, setStyle] = useState('');
  const [focusAreas, setFocusAreas] = useState('');
  const [personality, setPersonality] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !focusAreas.trim()) return;

    const config: InterviewerConfig = {
      type: `custom_${Date.now()}`,
      name: name.trim(),
      title: jobTitle.trim() || name.trim(),
      avatar: 'custom',
      bio: bio.trim(),
      style: style.trim() || '根据考察维度灵活提问',
      focusAreas: focusAreas.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
      personality: personality.trim() || '专业、客观',
      systemPrompt: '',
    };

    onAdd(config);
    setOpen(false);
    setName('');
    setJobTitle('');
    setBio('');
    setStyle('');
    setFocusAreas('');
    setPersonality('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1">
            <Label>{t('name')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('namePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('jobTitle')}</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder={t('jobTitlePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('bio')}</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t('bioPlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('style')}</Label>
            <Input value={style} onChange={(e) => setStyle(e.target.value)} placeholder={t('stylePlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('focusAreas')}</Label>
            <Input value={focusAreas} onChange={(e) => setFocusAreas(e.target.value)} placeholder={t('focusAreasPlaceholder')} />
          </div>
          <div className="space-y-1">
            <Label>{t('personality')}</Label>
            <Input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder={t('personalityPlaceholder')} />
          </div>
          <Button onClick={handleAdd} disabled={!name.trim() || !focusAreas.trim()} className="w-full bg-brand hover:bg-brand-hover">
            {t('add')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
