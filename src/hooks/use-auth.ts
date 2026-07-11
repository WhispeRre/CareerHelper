'use client';

import { useContext } from 'react';
import { SessionContext, signIn, signOut } from 'next-auth/react';
import { useRuntimeConfig } from '@/components/providers/runtime-config-provider';
import { useFingerprint } from './use-fingerprint';

export function useAuth() {
  const session = useContext(SessionContext);
  const { fingerprint, isLoading: fpLoading } = useFingerprint();
  const { authEnabled } = useRuntimeConfig();

  if (authEnabled) {
    return {
      user: session?.data?.user
        ? {
            id: session.data.user.id || '',
            name: session.data.user.name,
            email: session.data.user.email,
            avatarUrl: session.data.user.image,
            authType: 'oauth' as const,
          }
        : null,
      isLoading: session?.status === 'loading',
      isAuthenticated: session?.status === 'authenticated',
      signIn: () => signIn('google'),
      signOut: () => signOut(),
    };
  }

  return {
    user: fingerprint
      ? {
          id: `fp_${fingerprint}`,
          name: 'Anonymous User',
          email: null,
          avatarUrl: null,
          authType: 'fingerprint' as const,
        }
      : null,
    isLoading: fpLoading,
    isAuthenticated: !!fingerprint,
    signIn: () => {},
    signOut: () => {},
  };
}
