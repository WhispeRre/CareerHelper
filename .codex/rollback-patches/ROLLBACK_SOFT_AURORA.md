# Roll Back SoftAurora

This restores the landing hero to the state captured before the SoftAurora background change.

```bash
git restore src/components/landing/hero-section.tsx
git apply .codex/rollback-patches/2026-07-13-before-soft-aurora.patch
rm -f src/components/landing/soft-aurora.tsx \
  src/components/landing/soft-aurora.module.css \
  src/components/landing/soft-aurora-utils.ts \
  src/components/landing/soft-aurora-utils.test.ts
```

