'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Link,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface ChainInfo {
  chainId: number;
  name: string;
  publicRpcUrl?: string;
  explorerUrl?: string;
  logoUrl?: string;
}

export function ChainChecker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChainInfo | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);

    try {
      const res = await fetch('https://app.across.to/api/swap/chains');
      if (!res.ok) throw new Error('Failed to fetch chains');
      const chains: ChainInfo[] = await res.json();

      const chainId = Number(trimmed);
      const match = chains.find((c) =>
        !isNaN(chainId)
          ? c.chainId === chainId
          : c.name.toLowerCase() === trimmed.toLowerCase(),
      );

      if (match) {
        setResult(match);
      } else {
        setNotFound(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCheck();
  };

  return (
    <div className="not-prose rounded-2xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] overflow-hidden">
      {/* Card Header */}
      <div className="border-b border-[var(--color-fd-border)] px-6 py-5">
        <div className="flex items-center gap-3 mb-1.5">
          <Link className="size-5 text-[var(--color-fd-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-fd-foreground)]">
            Chain Checker
          </h3>
        </div>
        <p className="text-sm text-[var(--color-fd-muted-foreground)]">
          Check if Across supports your chain by ID or name.
        </p>
      </div>

      {/* Card Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Input */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fd-muted-foreground)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Chain ID or name (e.g. 42161, Arbitrum)"
              className={cn(
                'w-full rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
                'py-2.5 pl-10 pr-4 text-sm text-[var(--color-fd-foreground)]',
                'placeholder:text-[var(--color-fd-muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
                'transition-shadow',
              )}
            />
          </div>
          <button
            onClick={handleCheck}
            disabled={loading || !query.trim()}
            className={cn(
              'rounded-lg px-5 py-2.5 text-sm font-medium',
              'bg-[var(--color-fd-primary)] text-[var(--color-fd-primary-foreground)]',
              'hover:opacity-90 transition-opacity',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
            )}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Check'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-3 pt-1">
            <div className="rounded-lg border border-[var(--color-fd-primary)]/30 bg-[var(--color-fd-primary)]/10 p-5">
              <div className="flex items-center gap-2.5 mb-5">
                <CheckCircle className="size-6 text-[var(--color-fd-primary)]" />
                <span className="text-xl font-semibold text-[var(--color-fd-primary)]">
                  {result.name}
                </span>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-[var(--color-fd-muted-foreground)]">
                  Chain ID
                </dt>
                <dd className="font-mono text-[var(--color-fd-foreground)]">
                  {result.chainId}
                </dd>

                {result.publicRpcUrl && (
                  <>
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      Public RPC
                    </dt>
                    <dd className="font-mono text-xs text-[var(--color-fd-foreground)] break-all">
                      {result.publicRpcUrl}
                    </dd>
                  </>
                )}

                {result.explorerUrl && (
                  <>
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      Explorer
                    </dt>
                    <dd>
                      <a
                        href={result.explorerUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-fd-primary)] hover:underline break-all"
                      >
                        {result.explorerUrl}
                        <ExternalLink className="size-3 shrink-0" />
                      </a>
                    </dd>
                  </>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <XCircle className="size-6 text-red-400" />
              <span className="text-xl font-semibold text-red-400">
                Chain Not Found
              </span>
            </div>
            <p className="text-sm text-[var(--color-fd-muted-foreground)] mb-4">
              &quot;{query.trim()}&quot; is not currently supported by Across. If
              you&apos;d like to request support for this chain, reach out to the
              team.
            </p>
            <a
              href="https://t.me/acrosstg"
              target="_blank"
              rel="noreferrer noopener"
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
                'bg-[var(--color-fd-secondary)] text-[var(--color-fd-foreground)]',
                'hover:opacity-90 transition-opacity',
              )}
            >
              Reach Out for Support
              <ExternalLink className="size-3.5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
