'use client';

import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

export function CopyButtonClient({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-primary)] transition-colors"
      title="Copy address"
    >
      {copied ? (
        <Check className="size-3 text-[var(--color-fd-primary)]" />
      ) : (
        <Copy className="size-3" />
      )}
    </button>
  );
}
