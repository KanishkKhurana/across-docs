import { ExternalLink } from 'lucide-react';
import { CopyButtonClient } from './copy-button-client';

const DEPLOYED_ADDRESSES_URL =
  'https://raw.githubusercontent.com/across-protocol/contracts/c02b587cbfd00c338149de375ee939493a00c545/broadcast/deployed-addresses.json';
const CHAINS_API_URL = 'https://app.across.to/api/swap/chains';

interface ChainInfo {
  chainId: number;
  name: string;
  publicRpcUrl: string;
  explorerUrl: string;
  logoUrl: string;
}

interface ContractEntry {
  address: string;
  block_number: number;
}

interface DeployedChain {
  chain_name: string;
  contracts: Record<string, ContractEntry>;
}

interface DeployedAddresses {
  chains: Record<string, DeployedChain>;
}

interface ChainWithContracts {
  chainId: number;
  name: string;
  logoUrl: string;
  explorerUrl: string;
  spokePool: string | null;
  spokePoolPeriphery: string | null;
  multicallHandler: string | null;
}

function truncateAddress(address: string): string {
  if (address.length <= 14) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function AddressCell({
  address,
  explorerUrl,
}: {
  address: string | null;
  explorerUrl: string;
}) {
  if (!address) {
    return (
      <span className="text-[var(--color-fd-muted-foreground)] text-xs">
        &mdash;
      </span>
    );
  }

  const href = `${explorerUrl}/address/${address}`;

  return (
    <span className="inline-flex items-center gap-1.5 group/addr">
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="font-mono text-xs text-[var(--color-fd-foreground)] hover:text-[var(--color-fd-primary)] transition-colors"
        title={address}
      >
        {truncateAddress(address)}
      </a>
      <CopyButtonClient text={address} />
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-[var(--color-fd-muted-foreground)] hover:text-[var(--color-fd-primary)] transition-colors"
      >
        <ExternalLink className="size-3" />
      </a>
    </span>
  );
}


async function fetchData(): Promise<ChainWithContracts[]> {
  const [chainsRes, deployedRes] = await Promise.all([
    fetch(CHAINS_API_URL, { next: { revalidate: 3600 } }),
    fetch(DEPLOYED_ADDRESSES_URL, { next: { revalidate: 3600 } }),
  ]);

  if (!chainsRes.ok || !deployedRes.ok) {
    throw new Error('Failed to fetch chain or contract data');
  }

  const chains: ChainInfo[] = await chainsRes.json();
  const deployed: DeployedAddresses = await deployedRes.json();

  const result: ChainWithContracts[] = [];

  for (const chain of chains) {
    const chainIdStr = String(chain.chainId);
    const deployedChain = deployed.chains[chainIdStr];
    if (!deployedChain) continue;

    const contracts = deployedChain.contracts;

    result.push({
      chainId: chain.chainId,
      name: chain.name,
      logoUrl: chain.logoUrl,
      explorerUrl: chain.explorerUrl,
      spokePool:
        contracts.SpokePool?.address ??
        contracts.SvmSpoke?.address ??
        null,
      spokePoolPeriphery: contracts.SpokePoolPeriphery?.address ?? null,
      multicallHandler: contracts.MulticallHandler?.address ?? null,
    });
  }

  // Sort: Ethereum first, then alphabetically
  result.sort((a, b) => {
    if (a.chainId === 1) return -1;
    if (b.chainId === 1) return 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

export async function ChainsAndContracts() {
  const chains = await fetchData();

  return (
    <div className="not-prose space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] p-5">
        <p className="text-sm text-[var(--color-fd-muted-foreground)]">
          Across is deployed on{' '}
          <span className="font-semibold text-[var(--color-fd-primary)]">
            {chains.length} chains
          </span>
          . Contract addresses are sourced from the{' '}
          <a
            href="https://github.com/across-protocol/contracts/blob/master/broadcast/deployed-addresses.json"
            target="_blank"
            rel="noreferrer noopener"
            className="text-[var(--color-fd-primary)] hover:underline"
          >
            official contracts repository
          </a>
          .
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-xl border border-[var(--color-fd-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-fd-border)] bg-[var(--color-fd-card)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-fd-muted-foreground)] uppercase tracking-wider">
                Chain
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-fd-muted-foreground)] uppercase tracking-wider">
                Chain ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-fd-muted-foreground)] uppercase tracking-wider">
                SpokePool
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-fd-muted-foreground)] uppercase tracking-wider">
                SpokePoolPeriphery
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--color-fd-muted-foreground)] uppercase tracking-wider">
                MulticallHandler
              </th>
            </tr>
          </thead>
          <tbody>
            {chains.map((chain) => (
              <tr
                key={chain.chainId}
                className="border-b border-[var(--color-fd-border)] last:border-b-0 hover:bg-[var(--color-fd-accent)] transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={chain.logoUrl}
                      alt={chain.name}
                      width={24}
                      height={24}
                      className="rounded-full shrink-0"
                    />
                    <span className="font-medium text-[var(--color-fd-foreground)]">
                      {chain.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--color-fd-muted-foreground)]">
                  {chain.chainId}
                </td>
                <td className="px-4 py-3">
                  <AddressCell
                    address={chain.spokePool}
                    explorerUrl={chain.explorerUrl}
                  />
                </td>
                <td className="px-4 py-3">
                  <AddressCell
                    address={chain.spokePoolPeriphery}
                    explorerUrl={chain.explorerUrl}
                  />
                </td>
                <td className="px-4 py-3">
                  <AddressCell
                    address={chain.multicallHandler}
                    explorerUrl={chain.explorerUrl}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {chains.map((chain) => (
          <div
            key={chain.chainId}
            className="rounded-xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] p-4 space-y-3"
          >
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chain.logoUrl}
                alt={chain.name}
                width={28}
                height={28}
                className="rounded-full shrink-0"
              />
              <div>
                <span className="font-medium text-[var(--color-fd-foreground)]">
                  {chain.name}
                </span>
                <span className="ml-2 font-mono text-xs text-[var(--color-fd-muted-foreground)]">
                  #{chain.chainId}
                </span>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-[var(--color-fd-muted-foreground)]">
                  SpokePool
                </dt>
                <dd>
                  <AddressCell
                    address={chain.spokePool}
                    explorerUrl={chain.explorerUrl}
                  />
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-[var(--color-fd-muted-foreground)]">
                  Periphery
                </dt>
                <dd>
                  <AddressCell
                    address={chain.spokePoolPeriphery}
                    explorerUrl={chain.explorerUrl}
                  />
                </dd>
              </div>
              <div className="flex justify-between items-center">
                <dt className="text-[var(--color-fd-muted-foreground)]">
                  MulticallHandler
                </dt>
                <dd>
                  <AddressCell
                    address={chain.multicallHandler}
                    explorerUrl={chain.explorerUrl}
                  />
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
