'use client';

import { useTranslations } from 'next-intl';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface MessageInputProps {
  input: string;
  isLoading: boolean;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function MessageInput({ input, isLoading, onChange, onSubmit }: MessageInputProps) {
  const t = useTranslations('interview.room');

  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2">
      <div className="relative flex-1">
        <Textarea
          value={input}
          onChange={onChange}
          placeholder={t('inputPlaceholder')}
          disabled={isLoading}
          className="min-h-[44px] resize-none rounded-xl pr-12"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSubmit(e as any);
            }
          }}
        />
        <Button
          type="submit"
          disabled={!input.trim() || isLoading}
          size="icon"
          className="absolute bottom-1.5 right-1.5 h-8 w-8 rounded-lg bg-brand hover:bg-brand-hover"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
