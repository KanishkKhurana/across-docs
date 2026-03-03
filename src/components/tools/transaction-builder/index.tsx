'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Blocks,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Dropdown } from './dropdown';
import { PROTOCOLS } from './protocols';
import { buildRequest } from './action-builder';
import type {
  ChainInfo,
  TokenInfo,
  DropdownOption,
  BuildResult,
} from './types';

const API_BASE = 'https://app.across.to/api';

export function TransactionBuilder() {
  // Input state
  const [inputChainId, setInputChainId] = useState('');
  const [inputTokenAddress, setInputTokenAddress] = useState('');
  const [amount, setAmount] = useState('');

  // Protocol state
  const [protocolId, setProtocolId] = useState('');

  // Output state
  const [outputChainId, setOutputChainId] = useState('');
  const [outputTokenSymbol, setOutputTokenSymbol] = useState('');

  // Address state
  const [depositor, setDepositor] = useState('');
  const [recipientSameAsDepositor, setRecipientSameAsDepositor] =
    useState(true);
  const [recipient, setRecipient] = useState('');

  // Data state
  const [chains, setChains] = useState<ChainInfo[]>([]);
  const [inputTokens, setInputTokens] = useState<TokenInfo[]>([]);
  const [outputTokens, setOutputTokens] = useState<TokenInfo[]>([]);
  const [chainsLoading, setChainsLoading] = useState(false);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [outputTokensLoading, setOutputTokensLoading] = useState(false);

  // Result state
  const [loading, setLoading] = useState(false);
  const [buildResult, setBuildResult] = useState<BuildResult | null>(null);
  const [apiResponse, setApiResponse] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(true);
  const [showResponse, setShowResponse] = useState(true);
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Caches
  const tokensCacheRef = useRef<Record<number, TokenInfo[]>>({});

  // Fetch chains on mount
  useEffect(() => {
    let cancelled = false;
    setChainsLoading(true);
    fetch(`${API_BASE}/swap/chains`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch chains');
        return res.json();
      })
      .then((data: ChainInfo[]) => {
        if (!cancelled) setChains(data);
      })
      .catch(() => {
        // Silently fail — chains dropdown will just be empty
      })
      .finally(() => {
        if (!cancelled) setChainsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch input tokens when chain changes
  useEffect(() => {
    if (!inputChainId) {
      setInputTokens([]);
      return;
    }

    const chainId = Number(inputChainId);
    if (tokensCacheRef.current[chainId]) {
      setInputTokens(tokensCacheRef.current[chainId]);
      return;
    }

    let cancelled = false;
    setTokensLoading(true);
    fetch(`${API_BASE}/swap/tokens?chainId=${chainId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch tokens');
        return res.json();
      })
      .then((data: TokenInfo[]) => {
        if (!cancelled) {
          tokensCacheRef.current[chainId] = data;
          setInputTokens(data);
        }
      })
      .catch(() => {
        if (!cancelled) setInputTokens([]);
      })
      .finally(() => {
        if (!cancelled) setTokensLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [inputChainId]);

  // Fetch output tokens when output chain changes (for logos)
  useEffect(() => {
    if (!outputChainId) {
      setOutputTokens([]);
      return;
    }

    const chainId = Number(outputChainId);
    if (tokensCacheRef.current[chainId]) {
      setOutputTokens(tokensCacheRef.current[chainId]);
      return;
    }

    let cancelled = false;
    setOutputTokensLoading(true);
    fetch(`${API_BASE}/swap/tokens?chainId=${chainId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch tokens');
        return res.json();
      })
      .then((data: TokenInfo[]) => {
        if (!cancelled) {
          tokensCacheRef.current[chainId] = data;
          setOutputTokens(data);
        }
      })
      .catch(() => {
        if (!cancelled) setOutputTokens([]);
      })
      .finally(() => {
        if (!cancelled) setOutputTokensLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outputChainId]);

  // Cascade clears
  const handleInputChainChange = useCallback((val: string) => {
    setInputChainId(val);
    setInputTokenAddress('');
    setAmount('');
    setOutputChainId('');
    setOutputTokenSymbol('');
    setBuildResult(null);
    setApiResponse(null);
    setError(null);
  }, []);

  const handleInputTokenChange = useCallback((val: string) => {
    setInputTokenAddress(val);
    setBuildResult(null);
    setApiResponse(null);
    setError(null);
  }, []);

  const handleProtocolChange = useCallback((val: string) => {
    setProtocolId(val);
    setOutputChainId('');
    setOutputTokenSymbol('');
    setBuildResult(null);
    setApiResponse(null);
    setError(null);
  }, []);

  const handleOutputChainChange = useCallback((val: string) => {
    setOutputChainId(val);
    setOutputTokenSymbol('');
    setBuildResult(null);
    setApiResponse(null);
    setError(null);
  }, []);

  const handleOutputTokenChange = useCallback((val: string) => {
    setOutputTokenSymbol(val);
    setBuildResult(null);
    setApiResponse(null);
    setError(null);
  }, []);

  // Derived data
  const selectedProtocol = PROTOCOLS.find((p) => p.id === protocolId);
  const selectedOutputChainConfig = selectedProtocol?.chains.find(
    (c) => String(c.chainId) === outputChainId,
  );
  const selectedInputToken = inputTokens.find(
    (t) => t.address === inputTokenAddress,
  );
  const selectedOutputToken = selectedOutputChainConfig?.tokens.find(
    (t) => t.symbol === outputTokenSymbol,
  );

  // Dropdown options
  const chainOptions: DropdownOption[] = chains.map((c) => ({
    value: String(c.chainId),
    label: c.name,
    sublabel: `Chain ID: ${c.chainId}`,
    logoUrl: c.logoUrl,
  }));

  const inputTokenOptions: DropdownOption[] = inputTokens.map((t) => ({
    value: t.address,
    label: t.symbol,
    sublabel: t.name,
    logoUrl: t.logoUrl,
  }));

  const protocolOptions: DropdownOption[] = PROTOCOLS.map((p) => ({
    value: p.id,
    label: p.name,
    sublabel: p.description,
  }));

  const outputChainOptions: DropdownOption[] = (
    selectedProtocol?.chains || []
  ).map((c) => {
    const chainInfo = chains.find((ch) => ch.chainId === c.chainId);
    return {
      value: String(c.chainId),
      label: c.chainName,
      sublabel: `Chain ID: ${c.chainId}`,
      logoUrl: chainInfo?.logoUrl,
    };
  });

  const outputTokenOptions: DropdownOption[] = (
    selectedOutputChainConfig?.tokens || []
  ).map((t) => {
    // Look up logo from API tokens fetched for the output chain
    const apiToken = outputTokens.find(
      (at) =>
        at.symbol.toUpperCase() === t.symbol.toUpperCase() ||
        (t.address && at.address.toLowerCase() === t.address.toLowerCase()),
    );
    return {
      value: t.symbol,
      label: t.symbol,
      sublabel:
        t.actionType === 'ethDeposit' ? 'ETH Deposit' : 'ERC-20 Supply',
      logoUrl: apiToken?.logoUrl,
    };
  });

  // Validation
  const finalRecipient = recipientSameAsDepositor
    ? depositor.trim()
    : recipient.trim();
  const canBuild =
    inputChainId &&
    inputTokenAddress &&
    amount &&
    Number(amount) > 0 &&
    protocolId &&
    outputChainId &&
    outputTokenSymbol &&
    depositor.trim().length > 0 &&
    finalRecipient.length > 0;

  const handleBuild = useCallback(async () => {
    if (
      !selectedInputToken ||
      !selectedProtocol ||
      !selectedOutputChainConfig ||
      !selectedOutputToken
    )
      return;

    setLoading(true);
    setError(null);
    setBuildResult(null);
    setApiResponse(null);

    try {
      const result = buildRequest({
        inputChainId: Number(inputChainId),
        inputToken: selectedInputToken,
        amount,
        protocol: selectedProtocol,
        outputChainConfig: selectedOutputChainConfig,
        outputToken: selectedOutputToken,
        depositor: depositor.trim(),
        recipient: finalRecipient,
      });

      setBuildResult(result);
      setShowRequest(true);

      // Call the API
      const res = await fetch(result.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || data.error || `Request failed (${res.status})`,
        );
      }

      setApiResponse(data);
      setShowResponse(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [
    inputChainId,
    selectedInputToken,
    amount,
    selectedProtocol,
    selectedOutputChainConfig,
    selectedOutputToken,
    depositor,
    finalRecipient,
  ]);

  const copyRequest = () => {
    if (!buildResult) return;
    navigator.clipboard.writeText(buildResult.curlCommand);
    setCopiedRequest(true);
    setTimeout(() => setCopiedRequest(false), 2000);
  };

  const copyResponse = () => {
    if (!apiResponse) return;
    navigator.clipboard.writeText(JSON.stringify(apiResponse, null, 2));
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  const expectedFillTime = apiResponse?.expectedFillTime as
    | number
    | undefined;
  const simulationSuccess = apiResponse?.simulationSuccess as
    | boolean
    | undefined;

  return (
    <div className="not-prose rounded-2xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] overflow-hidden">
      {/* Card Header */}
      <div className="border-b border-[var(--color-fd-border)] px-6 py-5">
        <div className="flex items-center gap-3 mb-1.5">
          <Blocks className="size-5 text-[var(--color-fd-primary)]" />
          <h3 className="text-lg font-semibold text-[var(--color-fd-foreground)]">
            Transaction Builder
          </h3>
        </div>
        <p className="text-sm text-[var(--color-fd-muted-foreground)]">
          Build crosschain swap + action requests for the Across API.
        </p>
      </div>

      {/* Card Body */}
      <div className="px-6 py-5 space-y-5">
        {/* INPUT Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-fd-muted-foreground)]">
            Input
          </div>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 min-w-0">
              <Dropdown
                options={chainOptions}
                value={inputChainId}
                onChange={handleInputChainChange}
                placeholder={
                  chainsLoading ? 'Loading chains...' : 'Select chain'
                }
                disabled={chainsLoading}
              />
            </div>
            <div className="flex-1 min-w-0">
              <Dropdown
                options={inputTokenOptions}
                value={inputTokenAddress}
                onChange={handleInputTokenChange}
                placeholder={
                  tokensLoading
                    ? 'Loading tokens...'
                    : !inputChainId
                      ? 'Select chain first'
                      : 'Select token'
                }
                disabled={!inputChainId || tokensLoading}
              />
            </div>
            <div className="flex-1 min-w-0">
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                    setAmount(val);
                    setBuildResult(null);
                    setApiResponse(null);
                    setError(null);
                  }
                }}
                placeholder="Amount"
                disabled={!inputTokenAddress}
                className={cn(
                  'w-full rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
                  'py-2.5 px-3 text-sm text-[var(--color-fd-foreground)]',
                  'placeholder:text-[var(--color-fd-muted-foreground)]',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
                  'transition-shadow',
                  (!inputTokenAddress) && 'opacity-50 cursor-not-allowed',
                )}
              />
            </div>
          </div>
        </div>

        {/* ACTION PROTOCOL Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-fd-muted-foreground)]">
            Action Protocol
          </div>
          <Dropdown
            options={protocolOptions}
            value={protocolId}
            onChange={handleProtocolChange}
            placeholder="Select protocol"
          />
        </div>

        {/* OUTPUT Section (progressive disclosure) */}
        {protocolId && (
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-fd-muted-foreground)]">
              Output
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 min-w-0">
                <Dropdown
                  options={outputChainOptions}
                  value={outputChainId}
                  onChange={handleOutputChainChange}
                  placeholder="Select destination chain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Dropdown
                  options={outputTokenOptions}
                  value={outputTokenSymbol}
                  onChange={handleOutputTokenChange}
                  placeholder={
                    !outputChainId
                      ? 'Select chain first'
                      : outputTokensLoading
                        ? 'Loading tokens...'
                        : 'Select token'
                  }
                  disabled={!outputChainId || outputTokensLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* ADDRESSES Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-wider text-[var(--color-fd-muted-foreground)]">
            Addresses
          </div>
          <input
            type="text"
            value={depositor}
            onChange={(e) => setDepositor(e.target.value)}
            placeholder="Depositor address (0x...)"
            className={cn(
              'w-full rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
              'py-2.5 px-3 text-sm text-[var(--color-fd-foreground)]',
              'placeholder:text-[var(--color-fd-muted-foreground)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
              'transition-shadow font-mono',
            )}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recipientSameAsDepositor}
              onChange={(e) => setRecipientSameAsDepositor(e.target.checked)}
              className="rounded border-[var(--color-fd-border)] accent-[var(--color-fd-primary)]"
            />
            <span className="text-sm text-[var(--color-fd-muted-foreground)]">
              Recipient same as depositor
            </span>
          </label>
          {!recipientSameAsDepositor && (
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Recipient address (0x...)"
              className={cn(
                'w-full rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
                'py-2.5 px-3 text-sm text-[var(--color-fd-foreground)]',
                'placeholder:text-[var(--color-fd-muted-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
                'transition-shadow font-mono',
              )}
            />
          )}
        </div>

        {/* Build Button */}
        <button
          onClick={handleBuild}
          disabled={loading || !canBuild}
          className={cn(
            'w-full rounded-lg py-3 text-sm font-medium',
            'bg-[var(--color-fd-primary)] text-[var(--color-fd-primary-foreground)]',
            'hover:opacity-90 transition-opacity',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'flex items-center justify-center gap-2',
          )}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Building...
            </>
          ) : (
            'Build Transaction'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Generated Request */}
        {buildResult && (
          <div className="rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)] overflow-hidden">
            <button
              onClick={() => setShowRequest(!showRequest)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)] transition-colors"
            >
              <span className="font-medium">Generated Request</span>
              {showRequest ? (
                <ChevronUp className="size-4" />
              ) : (
                <ChevronDown className="size-4" />
              )}
            </button>
            {showRequest && (
              <div className="relative border-t border-[var(--color-fd-border)]">
                <button
                  onClick={copyRequest}
                  className="absolute right-3 top-3 rounded-md p-1.5 text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)] hover:bg-[var(--color-fd-secondary)] transition-colors"
                  title="Copy curl command"
                >
                  {copiedRequest ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
                <pre className="p-4 text-xs font-mono text-[var(--color-fd-foreground)] overflow-x-auto whitespace-pre-wrap break-all">
                  <span className="text-[var(--color-fd-primary)] font-semibold">
                    POST
                  </span>{' '}
                  {buildResult.url}
                  {'\n\n'}
                  {JSON.stringify(buildResult.body, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* API Response */}
        {apiResponse && (
          <div className="space-y-3">
            {/* Highlights */}
            {(expectedFillTime !== undefined ||
              simulationSuccess !== undefined) && (
              <div className="flex flex-wrap gap-3">
                {expectedFillTime !== undefined && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-fd-primary)]/30 bg-[var(--color-fd-primary)]/10 px-3 py-1.5 text-sm">
                    <Clock className="size-3.5 text-[var(--color-fd-primary)]" />
                    <span className="text-[var(--color-fd-foreground)]">
                      ~{expectedFillTime}s expected fill
                    </span>
                  </div>
                )}
                {simulationSuccess !== undefined && (
                  <div
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm',
                      simulationSuccess
                        ? 'border-[var(--color-fd-primary)]/30 bg-[var(--color-fd-primary)]/10'
                        : 'border-red-400/30 bg-red-400/10',
                    )}
                  >
                    <CheckCircle
                      className={cn(
                        'size-3.5',
                        simulationSuccess
                          ? 'text-[var(--color-fd-primary)]'
                          : 'text-red-400',
                      )}
                    />
                    <span className="text-[var(--color-fd-foreground)]">
                      Simulation{' '}
                      {simulationSuccess ? 'succeeded' : 'failed'}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)] overflow-hidden">
              <button
                onClick={() => setShowResponse(!showResponse)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)] transition-colors"
              >
                <span className="font-medium">API Response</span>
                {showResponse ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
              {showResponse && (
                <div className="relative border-t border-[var(--color-fd-border)]">
                  <button
                    onClick={copyResponse}
                    className="absolute right-3 top-3 rounded-md p-1.5 text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-foreground)] hover:bg-[var(--color-fd-secondary)] transition-colors"
                    title="Copy JSON"
                  >
                    {copiedResponse ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </button>
                  <pre className="p-4 text-xs font-mono text-[var(--color-fd-foreground)] overflow-x-auto">
                    {JSON.stringify(apiResponse, null, 2)}
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
