'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const SearchDialog = dynamic(() => import('@/components/search'));
const ChatButton = dynamic(
  () => import('@/components/chat-button').then((mod) => mod.ChatButton),
  { ssr: false },
);

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider theme={{ enabled: false }} search={{ SearchDialog }}>
      {children}
      <ChatButton />
    </RootProvider>
  );
}
