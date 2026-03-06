'use client';

import { InkeepChatButton, type InkeepChatButtonProps } from '@inkeep/cxkit-react';
import { useEffect, useState } from 'react';

export function ChatButton() {
  const [syncTarget, setSyncTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSyncTarget(document.documentElement);
  }, []);

  const config: InkeepChatButtonProps = {
    baseSettings: {
      apiKey: process.env.NEXT_PUBLIC_INKEEP_API_KEY || '',
      primaryBrandColor: '#6CF9D8',
      organizationDisplayName: 'Across Protocol',
      colorMode: {
        sync: {
          target: syncTarget,
          attributes: ['class'],
          isDarkMode: (attributes) =>
            !!attributes.class?.includes('dark'),
        },
      },
    },
    searchSettings: {},
    aiChatSettings: {
      exampleQuestions: [
        'How do I integrate the Swap API?',
        'What chains does Across support?',
        'How do embedded crosschain actions work?',
      ],
    },
    label: 'Ask AI',
  };

  return <InkeepChatButton {...config} />;
}
