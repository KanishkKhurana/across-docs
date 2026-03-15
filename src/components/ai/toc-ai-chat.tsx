'use client';

import { useEffect } from 'react';
import { MessageCircleIcon } from 'lucide-react';
import { cn } from '../../lib/cn';
import { buttonVariants } from '../ui/button';
import {
  useAISearchContext,
  useHotKey,
  AISearchPanelHeader,
  AISearchPanelList,
  AISearchInput,
  AISearchInputActions,
} from './search';

const TOC_WIDTH_DEFAULT = '268px';
const TOC_WIDTH_CHAT = '340px';

export function TocAIChat() {
  const { open, setOpen } = useAISearchContext();
  useHotKey();

  // Widen the TOC grid column when chat is open so main content squeezes
  useEffect(() => {
    const layout = document.getElementById('nd-notebook-layout');
    if (!layout) return;

    if (open) {
      layout.style.setProperty('--fd-toc-width', TOC_WIDTH_CHAT);
    } else {
      layout.style.removeProperty('--fd-toc-width');
    }

    return () => {
      layout.style.removeProperty('--fd-toc-width');
    };
  }, [open]);

  return (
    <>
      {/* Ask AI button — visible when chat is closed */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            buttonVariants({ color: 'secondary', size: 'sm' }),
            'w-full rounded-xl gap-2 mt-4',
          )}
        >
          <MessageCircleIcon className="size-4" />
          Ask AI
        </button>
      )}

      {/* Chat panel — fills the TOC area when open */}
      {open && (
        <div
          className="absolute inset-0 z-10 flex flex-col overflow-hidden p-3"
          style={{
            backgroundColor: '#1b1b1e',
            border: '1px solid rgba(224, 243, 255, 0.08)',
          }}
        >
          <AISearchPanelHeader />
          <AISearchPanelList className="flex-1" />
          <div className="rounded-xl border bg-fd-secondary text-fd-secondary-foreground shadow-sm has-focus-visible:shadow-md">
            <AISearchInput />
            <div className="flex items-center gap-1.5 p-1 empty:hidden">
              <AISearchInputActions />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
