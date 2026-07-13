import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('landing messages', () => {
  it('uses the approved Chinese hero copy', () => {
    const messages = JSON.parse(readFileSync('messages/zh.json', 'utf8'));

    expect(messages.landing.hero.title).toBe('从一段经历\n到一份完美简历');
    expect(messages.landing.hero.subtitle).toBe('支持多种模板与 ATS 优化，几分钟完成\n一份更适合你期望岗位的简历');
  });
});
