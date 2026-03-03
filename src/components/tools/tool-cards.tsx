'use client';

import Link from 'next/link';
import { Activity, Coins, Link as LinkIcon, Blocks } from 'lucide-react';

const tools = [
  {
    title: 'Status Tracker',
    description:
      'Track the lifecycle of any Across deposit by transaction hash or deposit ID.',
    href: '/docs/tools/status-tracker',
    icon: Activity,
  },
  {
    title: 'Token Checker',
    description:
      'Check if Across supports your token across all chains.',
    href: '/docs/tools/token-checker',
    icon: Coins,
  },
  {
    title: 'Chain Checker',
    description:
      'Check if Across supports your chain by ID or name.',
    href: '/docs/tools/chain-checker',
    icon: LinkIcon,
  },
  {
    title: 'Transaction Builder',
    description:
      'Build crosschain swap + action requests for the Across API.',
    href: '/docs/tools/transaction-builder',
    icon: Blocks,
  },
];

export function ToolCards() {
  return (
    <div className="not-prose grid grid-cols-1 sm:grid-cols-3 gap-6">
      {tools.map((tool) => (
        <Link
          key={tool.href}
          href={tool.href}
          className="group rounded-xl border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] p-6 transition-colors hover:border-[var(--color-fd-primary)]/40"
        >
          <tool.icon className="h-8 w-8 text-[var(--color-fd-primary)] mb-4" />
          <h2 className="text-lg font-semibold text-[var(--color-fd-foreground)] mb-2">
            {tool.title}
          </h2>
          <p className="text-sm text-[var(--color-fd-muted-foreground)] leading-relaxed">
            {tool.description}
          </p>
        </Link>
      ))}
    </div>
  );
}
