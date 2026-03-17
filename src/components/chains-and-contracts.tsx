import { ExternalLink } from 'lucide-react';
import { CopyButtonClient } from './copy-button-client';

const DEPLOYED_ADDRESSES_URL =
  'https://raw.githubusercontent.com/across-protocol/contracts/c02b587cbfd00c338149de375ee939493a00c545/broadcast/deployed-addresses.json';
const CHAINS_API_URL = 'https://app.across.to/api/swap/chains';

// ── Coming Soon ─────────────────────────────────────────────────────
// Add chain IDs here to show them in the "Chains Coming Soon" table.
// Contracts are pulled from deployed-addresses.json, names from chain_name.
const COMING_SOON_CHAIN_IDS: string[] = [
  // '480',    // Example: World Chain
  // '57073',  // Example: Ink
  '4217',
];

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

interface ComingSoonChain {
  chainId: number;
  name: string;
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
  explorerUrl?: string;
}) {
  if (!address) {
    return (
      <span className="text-[var(--color-fd-muted-foreground)] text-xs">
        &mdash;
      </span>
    );
  }

  if (!explorerUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 group/addr">
        <span
          className="font-mono text-xs text-[var(--color-fd-foreground)]"
          title={address}
        >
          {truncateAddress(address)}
        </span>
        <CopyButtonClient text={address} />
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

function extractContracts(contracts: Record<string, ContractEntry>) {
  return {
    spokePool:
      contracts.SpokePool?.address ??
      contracts.SvmSpoke?.address ??
      null,
    spokePoolPeriphery: contracts.SpokePoolPeriphery?.address ?? null,
    multicallHandler: contracts.MulticallHandler?.address ?? null,
  };
}

async function fetchData(): Promise<{
  live: ChainWithContracts[];
  comingSoon: ComingSoonChain[];
}> {
  const [chainsRes, deployedRes] = await Promise.all([
    fetch(CHAINS_API_URL, { next: { revalidate: 3600 } }),
    fetch(DEPLOYED_ADDRESSES_URL, { next: { revalidate: 3600 } }),
  ]);

  if (!chainsRes.ok || !deployedRes.ok) {
    throw new Error('Failed to fetch chain or contract data');
  }

  const chains: ChainInfo[] = await chainsRes.json();
  const deployed: DeployedAddresses = await deployedRes.json();

  const liveChainIds = new Set(chains.map((c) => String(c.chainId)));

  // Live chains: present in /swap/chains AND deployed-addresses
  const live: ChainWithContracts[] = [];
  for (const chain of chains) {
    const chainIdStr = String(chain.chainId);
    const deployedChain = deployed.chains[chainIdStr];
    if (!deployedChain) continue;

    live.push({
      chainId: chain.chainId,
      name: chain.name,
      logoUrl: chain.logoUrl,
      explorerUrl: chain.explorerUrl,
      ...extractContracts(deployedChain.contracts),
    });
  }

  // Coming soon: only chain IDs explicitly listed in COMING_SOON_CHAIN_IDS
  // and not already live on the swap API
  const comingSoon: ComingSoonChain[] = [];
  for (const chainIdStr of COMING_SOON_CHAIN_IDS) {
    if (liveChainIds.has(chainIdStr)) continue;
    const deployedChain = deployed.chains[chainIdStr];
    if (!deployedChain) continue;

    comingSoon.push({
      chainId: Number(chainIdStr),
      name: deployedChain.chain_name,
      ...extractContracts(deployedChain.contracts),
    });
  }

  live.sort((a, b) => {
    if (a.chainId === 1) return -1;
    if (b.chainId === 1) return 1;
    return a.name.localeCompare(b.name);
  });

  comingSoon.sort((a, b) => a.name.localeCompare(b.name));

  return { live, comingSoon };
}

export async function ChainsAndContracts() {
  const { live, comingSoon } = await fetchData();

  return (
    <div className="not-prose space-y-6">
      {/* Summary */}
      <div className="rounded-xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] p-5">
        <p className="text-sm text-[var(--color-fd-muted-foreground)]">
          Across is deployed on{' '}
          <span className="font-semibold text-[var(--color-fd-primary)]">
            {live.length} chains
          </span>
          {comingSoon.length > 0 && (
            <>
              {' '}with{' '}
              <span className="font-semibold text-[var(--color-fd-primary)]">
                {comingSoon.length} more coming soon
              </span>
            </>
          )}
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

      {/* Coming Soon Chains */}
      {comingSoon.length > 0 && (
        <>
          <h3 className="text-lg font-semibold text-[var(--color-fd-foreground)] pt-4">
            Chains Coming Soon
          </h3>
          <p className="text-sm text-[var(--color-fd-muted-foreground)] -mt-4">
            Contracts are deployed but these chains are not yet live on the Swap API.
          </p>

          {/* Coming Soon — Desktop Table */}
          <div className="hidden md:block rounded-xl border border-[var(--color-fd-border)] overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
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
                {comingSoon.map((chain) => (
                  <tr
                    key={chain.chainId}
                    className="border-b border-[var(--color-fd-border)] last:border-b-0 hover:bg-[var(--color-fd-accent)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--color-fd-foreground)]">
                        {chain.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[var(--color-fd-muted-foreground)]">
                      {chain.chainId}
                    </td>
                    <td className="px-4 py-3">
                      <AddressCell address={chain.spokePool} />
                    </td>
                    <td className="px-4 py-3">
                      <AddressCell address={chain.spokePoolPeriphery} />
                    </td>
                    <td className="px-4 py-3">
                      <AddressCell address={chain.multicallHandler} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Coming Soon — Mobile Cards */}
          <div className="md:hidden space-y-3">
            {comingSoon.map((chain) => (
              <div
                key={chain.chainId}
                className="rounded-xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] p-4 space-y-3"
              >
                <div>
                  <span className="font-medium text-[var(--color-fd-foreground)]">
                    {chain.name}
                  </span>
                  <span className="ml-2 font-mono text-xs text-[var(--color-fd-muted-foreground)]">
                    #{chain.chainId}
                  </span>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      SpokePool
                    </dt>
                    <dd>
                      <AddressCell address={chain.spokePool} />
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      Periphery
                    </dt>
                    <dd>
                      <AddressCell address={chain.spokePoolPeriphery} />
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-[var(--color-fd-muted-foreground)]">
                      MulticallHandler
                    </dt>
                    <dd>
                      <AddressCell address={chain.multicallHandler} />
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </>
      )}

      <h3 className="text-lg font-semibold text-[var(--color-fd-foreground)] pt-4">
        Chains Live on the Swap API
      </h3>
      <p className="text-sm text-[var(--color-fd-muted-foreground)] -mt-4">
        These chains are fully supported and available for bridging via the Swap API.
      </p>

      {/* Live Chains — Desktop Table */}
      <div className="hidden md:block rounded-xl border border-[var(--color-fd-border)] overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
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
            {live.map((chain) => (
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

      {/* Live Chains — Mobile Cards */}
      <div className="md:hidden space-y-3">
        {live.map((chain) => (
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
