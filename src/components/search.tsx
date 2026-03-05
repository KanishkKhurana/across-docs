'use client';

import type { SharedProps } from 'fumadocs-ui/components/dialog/search';
import {
  InkeepModalSearchAndChat,
  type InkeepModalSearchAndChatProps,
} from '@inkeep/cxkit-react';
import { useEffect, useState } from 'react';

export default function CustomSearchDialog(props: SharedProps) {
  const [syncTarget, setSyncTarget] = useState<HTMLElement | null>(null);
  const { open, onOpenChange } = props;

  useEffect(() => {
    setSyncTarget(document.documentElement);
  }, []);

  const config: InkeepModalSearchAndChatProps = {
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
    modalSettings: {
      isOpen: open,
      onOpenChange,
    },
    searchSettings: {},
    aiChatSettings: {
      exampleQuestions: [
        'How do I integrate the Swap API?',
        'What chains does Across support?',
        'How do embedded crosschain actions work?',
      ],
    },
  };

  return <InkeepModalSearchAndChat {...config} />;
}
