'use client';

import { SessionProvider } from 'next-auth/react';
import LayoutContent from './LayoutContent';

export function Providers({ children }) {
  return (
    <SessionProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </SessionProvider>
  );
}
