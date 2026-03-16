import Image from 'next/image';
import Link from 'next/link';
import { Wrench, ArrowRight } from 'lucide-react';
import { HomeSearch } from '@/components/ai/home-search';

const cards = [
  {
    title: 'Integrate Across',
    description:
      'Start building with the Swap API and go live in under an hour.',
    href: '/introduction',
    image: '/integrate-across.svg',
  },
  {
    title: 'API Reference',
    description:
      'Full endpoint docs with parameters, schemas, and code samples.',
    href: '/api-reference',
    image: '/across-api.svg',
  },
  {
    title: 'AI Agents',
    description:
      'Let AI agents execute cross-chain actions on behalf of users.',
    href: '/ai-agents',
    image: '/across-ai.svg',
  },
] as const;

export default function HomePage() {
  return (
    <main className="flex flex-col items-center px-6 py-8 flex-1">
      {/* Announcement Banner */}
      <a
        href="https://app.across.to"
        target="_blank"
        rel="noopener noreferrer"
        className="group mb-10 inline-flex items-center gap-3 rounded-full border border-fd-primary/20 bg-fd-primary/[0.06] px-5 py-2 text-sm font-medium text-fd-primary transition-all hover:border-fd-primary/50 hover:bg-fd-primary/[0.12]"
      >
        <span className="rounded-full bg-fd-primary/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider">
          New
        </span>
        Bridge to Hyperliquid for free
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </a>

      {/* Logo */}
      <Image
        src="/across-builder-logo.svg"
        alt="Across Builder"
        width={50}
        height={48}
        className="mb-8"
        priority
      />

      {/* Hero */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-fd-foreground mb-3 text-center">
        Across Developer Documentation
      </h1>
      <p className="text-lg text-fd-muted-foreground mb-6 text-center">
        The fastest crosschain infrastructure for builders.
      </p>

      {/* Stats */}
      <div className="flex flex-wrap justify-center gap-10 mb-10">
        <div className="text-center">
          <div className="text-2xl font-bold text-fd-primary">$32B+</div>
          <div className="text-sm text-fd-muted-foreground mt-1">Bridged</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fd-primary">0</div>
          <div className="text-sm text-fd-muted-foreground mt-1">Exploits</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-fd-primary">{"<2s"}</div>
          <div className="text-sm text-fd-muted-foreground mt-1">Fill Time</div>
        </div>
      </div>

      {/* AI Search */}
      <HomeSearch />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mb-16">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:border-fd-primary/40"
          >
            <div className="inline-flex items-center justify-center rounded-lg p-2 mb-4" style={{ backgroundColor: 'rgba(108, 249, 216, 0.1)' }}>
              <Image src={card.image} alt="" width={32} height={32} />
            </div>
            <h2 className="text-lg font-semibold text-fd-card-foreground mb-2">
              {card.title}
            </h2>
            <p className="text-sm text-fd-muted-foreground leading-relaxed">
              {card.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Troubleshoot */}
      <Link
        href="/tools"
        className="inline-flex items-center gap-2 rounded-lg border border-fd-border px-5 py-2.5 text-sm text-fd-muted-foreground transition-colors hover:border-fd-primary/40 hover:text-fd-foreground"
      >
        <Wrench className="h-4 w-4" />
        Troubleshoot
      </Link>
    </main>
  );
}
