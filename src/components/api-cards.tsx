'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

type Endpoint = {
  method: 'GET' | 'POST';
  path: string;
  title: string;
  href: string;
};

const sections: { heading: string; endpoints: Endpoint[] }[] = [
  {
    heading: 'Early Access',
    endpoints: [
      {
        method: 'GET',
        path: '/swap/counterfactual',
        title: 'Generate a counterfactual deposit address',
        href: '/api-reference/swap/counterfactual/get',
      },
    ],
  },
  {
    heading: 'Swap API',
    endpoints: [
      {
        method: 'GET',
        path: '/swap/approval',
        title: 'Get swap approval data',
        href: '/api-reference/swap/approval/get',
      },
      {
        method: 'POST',
        path: '/swap/approval',
        title: 'Build embedded crosschain actions',
        href: '/api-reference/swap/approval/post',
      },
      {
        method: 'GET',
        path: '/swap/chains',
        title: 'Get supported chains',
        href: '/api-reference/swap/chains/get',
      },
      {
        method: 'GET',
        path: '/swap/tokens',
        title: 'Get supported tokens',
        href: '/api-reference/swap/tokens/get',
      },
      {
        method: 'GET',
        path: '/swap/sources',
        title: 'Get supported sources',
        href: '/api-reference/swap/sources/get',
      },
    ],
  },
  {
    heading: 'Tracking Deposits',
    endpoints: [
      {
        method: 'GET',
        path: '/deposit',
        title: 'Get all details for a single deposit',
        href: '/api-reference/deposit/get',
      },
      {
        method: 'GET',
        path: '/deposit/status',
        title: 'Track the lifecycle of a deposit',
        href: '/api-reference/deposit/status/get',
      },
      {
        method: 'GET',
        path: '/deposits',
        title: 'Get all deposits for a depositor',
        href: '/api-reference/deposits/get',
      },
    ],
  },
  {
    heading: 'Suggested Fees API (Legacy)',
    endpoints: [
      {
        method: 'GET',
        path: '/suggested-fees',
        title: 'Retrieve suggested fee quote',
        href: '/api-reference/suggested-fees/get',
      },
      {
        method: 'GET',
        path: '/available-routes',
        title: 'Retrieve available routes',
        href: '/api-reference/available-routes/get',
      },
      {
        method: 'GET',
        path: '/limits',
        title: 'Retrieve current transfer limits',
        href: '/api-reference/limits/get',
      },
    ],
  },
];

const methodColors: Record<string, { bg: string; text: string; border: string }> = {
  GET: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
  },
  POST: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
  },
  PUT: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
  },
  DELETE: {
    bg: 'bg-red-500/10',
    text: 'text-red-400',
    border: 'border-red-500/20',
  },
};

function MethodBadge({ method }: { method: string }) {
  const colors = methodColors[method] ?? methodColors.GET;
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide ${colors.bg} ${colors.text} ${colors.border} border`}
    >
      {method}
    </span>
  );
}

export function APICards() {
  return (
    <div className="block xl:hidden mt-8 space-y-4">
      {sections.map((section) => (
        <div
          key={section.heading}
          className="rounded-xl border border-fd-border bg-fd-card overflow-hidden"
        >
          <div className="px-4 py-2.5 border-b border-fd-border bg-fd-muted/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-fd-primary">
              {section.heading}
            </span>
          </div>

          {section.endpoints.map((ep) => (
            <Link
              key={ep.href}
              href={ep.href}
              className="group flex items-center gap-3 px-4 py-3 no-underline border-b border-fd-border last:border-b-0 transition-colors hover:bg-fd-primary/[0.04]"
            >
              <MethodBadge method={ep.method} />
              <div className="flex-1 min-w-0">
                <code className="text-[13px] font-medium text-fd-foreground/80 group-hover:text-fd-foreground transition-colors">
                  {ep.path}
                </code>
                <p className="text-sm text-fd-muted-foreground leading-snug mt-0.5 group-hover:text-fd-foreground/70 transition-colors">
                  {ep.title}
                </p>
              </div>
              <ChevronRight className="size-4 shrink-0 text-fd-muted-foreground group-hover:text-fd-foreground/70 transition-all group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}
