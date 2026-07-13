import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('CTASection copy', () => {
  it('uses the updated Chinese CTA title and subtitle', () => {
    const zhMessages = readFileSync('messages/zh.json', 'utf8');

    expect(zhMessages).toContain('"title": "准备好展现更好的自己了吗？"');
    expect(zhMessages).toContain('"subtitle": "无需注册，即刻开始。"');
  });
});
