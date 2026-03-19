import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import Image from 'next/image';

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <>
          <Image
            src="/across-logo.svg"
            alt="Across"
            width={24}
            height={24}
            className="shrink-0"
          />
          <span className="sm:hidden">Across Docs</span>
          <span className="hidden sm:inline">Across Developer Documentation</span>
        </>
      ),
    },
    themeSwitch: { enabled: false },
  };
}
