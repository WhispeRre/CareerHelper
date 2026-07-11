'use client';

import { createContext, useContext } from 'react';

interface RuntimeConfig {
  authEnabled: boolean;
}

const RuntimeConfigContext = createContext<RuntimeConfig>({ authEnabled: false });

export function RuntimeConfigProvider({
  children,
  authEnabled,
}: {
  children: React.ReactNode;
  authEnabled: boolean;
}) {
  return (
    <RuntimeConfigContext.Provider value={{ authEnabled }}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

export function useRuntimeConfig() {
  return useContext(RuntimeConfigContext);
}
