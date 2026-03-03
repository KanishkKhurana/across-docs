'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  RotateCcw,
  Hourglass,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type DepositStatus =
  | 'filled'
  | 'pending'
  | 'expired'
  | 'refunded'
  | 'slowFillRequested';

interface StatusResponse {
  status: DepositStatus;
  originChainId: number;
  depositId: number | string;
  depositTxnRef: string;
  fillTxnRef?: string;
  destinationChainId: number;
  depositRefundTxnRef?: string | null;
  actionsSucceeded?: boolean | null;
  pagination?: {
    currentIndex: number;
    maxIndex: number;
  };
}

const STATUS_CONFIG: Record<
  DepositStatus,
  { label: string; color: string; bg: string; icon: typeof CheckCircle }
> = {
  filled: {
    label: 'Filled',
    color: 'text-[var(--color-fd-primary)]',
    bg: 'bg-[var(--color-fd-primary)]/10 border-[var(--color-fd-primary)]/30',
    icon: CheckCircle,
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/30',
    icon: Clock,
  },
  expired: {
    label: 'Expired',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/30',
    icon: XCircle,
  },
  refunded: {
    label: 'Refunded',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/30',
    icon: RotateCcw,
  },
  slowFillRequested: {
    label: 'Slow Fill Requested',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10 border-orange-400/30',
    icon: Hourglass,
  },
};

const EXPLORERS: Record<number, string> = {
  1: 'https://etherscan.io/tx/',
  10: 'https://optimistic.etherscan.io/tx/',
  137: 'https://polygonscan.com/tx/',
  42161: 'https://arbiscan.io/tx/',
  8453: 'https://basescan.org/tx/',
  324: 'https://explorer.zksync.io/tx/',
  59144: 'https://lineascan.build/tx/',
  534352: 'https://scrollscan.com/tx/',
  1101: 'https://zkevm.polygonscan.com/tx/',
  34443: 'https://explorer.mode.network/tx/',
  480: 'https://worldscan.org/tx/',
  81457: 'https://blastscan.io/tx/',
  7777777: 'https://explorer.zora.energy/tx/',
};

function TxLink({ hash, chainId }: { hash: string; chainId?: number }) {
  const base = chainId ? EXPLORERS[chainId] : undefined;

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs break-all">
      {base ? (
        <a
          href={`${base}${hash}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-[var(--color-fd-primary)] hover:underline inline-flex items-center gap-1"
        >
          {hash}
          <ExternalLink className="size-3 shrink-0" />
        </a>
      ) : (
        <span className="text-[var(--color-fd-foreground)]">{hash}</span>
      )}
    </span>
  );
}

export function StatusTracker() {
  const [mode, setMode] = useState<'txHash' | 'depositId'>('txHash');
  const [txHash, setTxHash] = useState('');
  const [depositId, setDepositId] = useState('');
  const [originChainId, setOriginChainId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCheck = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (mode === 'txHash') {
        const trimmed = txHash.trim();
        if (!trimmed) return;
        params.set('depositTxnRef', trimmed);
      } else {
        const id = depositId.trim();
        const chain = originChainId.trim();
        if (!id || !chain) return;
        params.set('depositId', id);
        params.set('originChainId', chain);
      }

      const res = await fetch(
        `https://app.across.to/api/deposit/status?${params.toString()}`,
      );

      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Request failed (${res.status})`);
      }

      const data: StatusResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [mode, txHash, depositId, originChainId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCheck();
  };

  const canSubmit =
    mode === 'txHash'
      ? txHash.trim().length > 0
      : depositId.trim().length > 0 && originChainId.trim().length > 0;

  const copyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = result ? STATUS_CONFIG[result.status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="not-prose rounded-2xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] overflow-hidden">
      {/* Card Header */}
      <div className="border-b border-[var(--color-fd-border)] px-6 py-5">
        <div className="flex items-center gap-3 mb-1.5">
          <Activity className="size-5 text-[var(--color-fd-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-fd-foreground)]">
            Deposit Status Tracker
          </h3>
        </div>
        <p className="text-sm text-[var(--color-fd-muted-foreground)]">
          Track the lifecycle of any Across deposit. Data updates every ~10
          seconds.
        </p>
      </div>

      {/* Card Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-1 rounded-lg bg-[var(--color-fd-background)] p-1 w-fit">
          <button
            onClick={() => setMode('txHash')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'txHash'
                ? 'bg-[var(--color-fd-secondary)] text-[var(--color-fd-foreground)] shadow-sm'
                : 'text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)]',
            )}
          >
            Transaction Hash
          </button>
          <button
            onClick={() => setMode('depositId')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              mode === 'depositId'
                ? 'bg-[var(--color-fd-secondary)] text-[var(--color-fd-foreground)] shadow-sm'
                : 'text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)]',
            )}
          >
            Deposit ID
          </button>
        </div>

        {/* Input */}
        {mode === 'txHash' ? (
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-fd-muted-foreground)]" />
              <input
                type="text"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="0x..."
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
              disabled={loading || !canSubmit}
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
                'Track'
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={depositId}
              onChange={(e) => setDepositId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Deposit ID (e.g. 1349975)"
              className={cn(
                'flex-1 rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
                'py-2.5 px-4 text-sm text-[var(--color-fd-foreground)]',
                'placeholder:text-[var(--color-fd-muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
                'transition-shadow',
              )}
            />
            <input
              type="text"
              value={originChainId}
              onChange={(e) => setOriginChainId(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Origin Chain ID (e.g. 137)"
              className={cn(
                'w-full md:w-48 rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
                'py-2.5 px-4 text-sm text-[var(--color-fd-foreground)]',
                'placeholder:text-[var(--color-fd-muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
                'transition-shadow',
              )}
            />
            <button
              onClick={handleCheck}
              disabled={loading || !canSubmit}
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
                'Track'
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        {result && statusConfig && StatusIcon && (
          <div className="space-y-3 pt-1">
            {/* Status Badge */}
            <div className={cn('rounded-lg border p-5', statusConfig.bg)}>
              <div className="flex items-center gap-2.5 mb-5">
                <StatusIcon className={cn('size-6', statusConfig.color)} />
                <span
                  className={cn('text-xl font-semibold', statusConfig.color)}
                >
                  {statusConfig.label}
                </span>
              </div>

              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
                <dt className="text-[var(--color-fd-muted-foreground)]">
                  Origin Chain
                </dt>
                <dd className="font-mono text-[var(--color-fd-foreground)]">
                  {result.originChainId}
                </dd>

                <dt className="text-[var(--color-fd-muted-foreground)]">
                  Destination Chain
                </dt>
                <dd className="font-mono text-[var(--color-fd-foreground)]">
                  {result.destinationChainId}
                </dd>

                <dt className="text-[var(--color-fd-muted-foreground)]">
                  Deposit ID
                </dt>
                <dd className="font-mono text-[var(--color-fd-foreground)]">
                  {result.depositId}
                </dd>

                <dt className="text-[var(--color-fd-muted-foreground)]">
                  Deposit Tx
                </dt>
                <dd>
                  <TxLink
                    hash={result.depositTxnRef}
                    chainId={result.originChainId}
                  />
                </dd>

                {result.fillTxnRef && (
                  <>
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      Fill Tx
                    </dt>
                    <dd>
                      <TxLink
                        hash={result.fillTxnRef}
                        chainId={result.destinationChainId}
                      />
                    </dd>
                  </>
                )}

                {result.depositRefundTxnRef && (
                  <>
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      Refund Tx
                    </dt>
                    <dd>
                      <TxLink
                        hash={result.depositRefundTxnRef}
                        chainId={result.originChainId}
                      />
                    </dd>
                  </>
                )}

                {result.actionsSucceeded !== null &&
                  result.actionsSucceeded !== undefined && (
                    <>
                      <dt className="text-[var(--color-fd-muted-foreground)]">
                        Actions
                      </dt>
                      <dd className="text-[var(--color-fd-foreground)]">
                        {result.actionsSucceeded ? 'Succeeded' : 'Failed'}
                      </dd>
                    </>
                  )}
              </dl>
            </div>

            {/* JSON Toggle */}
            <div className="rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)] overflow-hidden">
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)] transition-colors"
              >
                <span>Raw JSON Response</span>
                {showJson ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              {showJson && (
                <div className="relative border-t border-[var(--color-fd-border)]">
                  <button
                    onClick={copyJson}
                    className="absolute right-3 top-3 rounded-md p-1.5 text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)] hover:bg-[var(--color-fd-secondary)] transition-colors"
                    title="Copy JSON"
                  >
                    {copied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <pre className="p-4 text-xs font-mono text-[var(--color-fd-foreground)] overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
