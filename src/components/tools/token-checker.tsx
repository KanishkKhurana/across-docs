'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  ExternalLink,
  Loader2,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/cn';

interface Chain {
  chainId: number;
  name: string;
}

interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

interface TokenResult {
  token: Token;
  chains: { chain: Chain; address: string }[];
}

export function TokenChecker() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TokenResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chainsCache = useRef<Chain[] | null>(null);

  const handleCheck = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);
    setNotFound(false);
    setError(null);

    try {
      if (!chainsCache.current) {
        const chainsRes = await fetch('https://app.across.to/api/swap/chains');
        if (!chainsRes.ok) throw new Error('Failed to fetch chains');
        chainsCache.current = await chainsRes.json();
      }
      const chains = chainsCache.current!;

      const isAddress = trimmed.startsWith('0x');
      const searchLower = trimmed.toLowerCase();

      const matches: { chain: Chain; token: Token }[] = [];

      const results = await Promise.allSettled(
        chains.map(async (chain) => {
          const res = await fetch(
            `https://app.across.to/api/swap/tokens?chainId=${chain.chainId}`,
          );
          if (!res.ok) return { chain, tokens: [] as Token[] };
          const tokens: Token[] = await res.json();
          return { chain, tokens };
        }),
      );

      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const { chain, tokens } = r.value;
        for (const token of tokens) {
          const symbolMatch = token.symbol.toLowerCase() === searchLower;
          const addressMatch =
            isAddress && token.address.toLowerCase() === searchLower;
          if (symbolMatch || addressMatch) {
            matches.push({ chain, token });
          }
        }
      }

      if (matches.length === 0) {
        setNotFound(true);
      } else {
        const representative = matches[0].token;
        setResult({
          token: representative,
          chains: matches.map((m) => ({
            chain: m.chain,
            address: m.token.address,
          })),
        });
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
          <Coins className="size-5 text-[var(--color-fd-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-fd-foreground)]">
            Token Checker
          </h3>
        </div>
        <p className="text-sm text-[var(--color-fd-muted-foreground)]">
          Check if Across supports your token across all chains.
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
              placeholder="Token symbol or address (e.g. USDC, 0xaf88...)"
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
              <div className="flex items-center gap-2.5 mb-4">
                <CheckCircle className="size-6 text-[var(--color-fd-primary)]" />
                <span className="text-xl font-semibold text-[var(--color-fd-primary)]">
                  {result.token.name} ({result.token.symbol})
                </span>
              </div>
              <p className="text-sm text-[var(--color-fd-muted-foreground)] mb-1">
                {result.token.decimals} decimals
              </p>
              <p className="text-sm text-[var(--color-fd-muted-foreground)] mb-4">
                Supported on {result.chains.length} chain
                {result.chains.length !== 1 ? 's' : ''}
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-fd-border)]">
                      <th className="text-left py-2 pr-4 font-medium text-[var(--color-fd-muted-foreground)]">
                        Chain
                      </th>
                      <th className="text-left py-2 pr-4 font-medium text-[var(--color-fd-muted-foreground)]">
                        Chain ID
                      </th>
                      <th className="text-left py-2 font-medium text-[var(--color-fd-muted-foreground)]">
                        Token Address
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.chains.map(({ chain, address }) => (
                      <tr
                        key={chain.chainId}
                        className="border-b border-[var(--color-fd-border)] last:border-b-0"
                      >
                        <td className="py-2 pr-4 text-[var(--color-fd-foreground)]">
                          {chain.name}
                        </td>
                        <td className="py-2 pr-4 font-mono text-[var(--color-fd-muted-foreground)]">
                          {chain.chainId}
                        </td>
                        <td className="py-2 font-mono text-xs text-[var(--color-fd-muted-foreground)] break-all">
                          {address}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Not Found */}
        {notFound && (
          <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <XCircle className="size-6 text-red-400" />
              <span className="text-xl font-semibold text-red-400">
                Token Not Found
              </span>
            </div>
            <p className="text-sm text-[var(--color-fd-muted-foreground)] mb-4">
              &quot;{query.trim()}&quot; is not currently supported by Across. If
              you&apos;d like to request support for this token, reach out to the
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
