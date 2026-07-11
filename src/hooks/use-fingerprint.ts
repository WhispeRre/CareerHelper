'use client';

import { getStoredFingerprint, setStoredFingerprint } from '@/lib/fingerprint-storage';

import { useEffect, useState } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { useRuntimeConfig } from '@/components/providers/runtime-config-provider';
import { generateId } from '@/lib/utils';

export function useFingerprint() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { authEnabled } = useRuntimeConfig();

  useEffect(() => {
    if (authEnabled) {
      setIsLoading(false);
      return;
    }

    async function getFingerprint() {
      try {
        // Check localStorage first
        const stored = getStoredFingerprint();
        if (stored) {
          setFingerprint(stored);
          setIsLoading(false);
          return;
        }

        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        setStoredFingerprint(visitorId);
        setFingerprint(visitorId);
      } catch {
        // Fallback: generate a random ID
        const fallbackId = generateId();
        setStoredFingerprint(fallbackId);
        setFingerprint(fallbackId);
      } finally {
        setIsLoading(false);
      }
    }

    getFingerprint();
  }, [authEnabled]);

  return { fingerprint, isLoading };
}
