import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('StatsSection model provider logo loop', () => {
  it('replaces numeric stats with supported model provider logos', () => {
    const source = readFileSync('src/components/landing/stats-section.tsx', 'utf8');

    expect(source).toContain('ModelProviderLogoLoop');
    expect(source).not.toContain('STATS.map');
    expect(source).not.toContain('ProviderWordmark');
    expect(source).not.toContain('fadeOut');
    expect(source).not.toContain('fadeOutColor');

    for (const provider of ['ChatGPT', 'Anthropic', 'Google Gemini', 'DeepSeek', 'Zhipu AI']) {
      expect(source).toContain(provider);
    }

    expect(source).toContain('ChatGptIcon');
    expect(source).toContain('viewBox="0 0 512 509.639"');
    expect(source).not.toContain('cdn.simpleicons.org/chatgpt');
    expect(source).not.toContain('cdn.simpleicons.org/openai');
    expect(source).toContain('cdn.simpleicons.org/anthropic');
    expect(source).toContain('cdn.simpleicons.org/googlegemini');
    expect(source).toContain('cdn.simpleicons.org/deepseek');
    expect(source).not.toContain('OpenAI_logo_2025_%28wordmark%29.svg');
    expect(source).not.toContain('Anthropic_logo.svg');
    expect(source).not.toContain('Google_Gemini_logo.svg');
    expect(source).not.toContain('DeepSeek_logo.svg');
    expect(source).toContain('Kimi-logo-2025.png');
  });

  it('uses a title and subtitle for the AI API compatibility section', () => {
    const source = readFileSync('src/components/landing/stats-section.tsx', 'utf8');
    const zhMessages = readFileSync('messages/zh.json', 'utf8');

    expect(source).toContain("t('title')");
    expect(source).toContain("t('subtitle')");
    expect(zhMessages).toContain('"title": "适配主流AI API接口"');
    expect(zhMessages).toContain('"subtitle": "兼容OpenAI、Anthropic、Gemini等主流模型API"');
  });
});
