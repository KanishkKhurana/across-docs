import { source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();

  const sections = new Map<string, { title: string; url: string; description: string }[]>();

  for (const page of pages) {
    // Derive section from first slug segment
    const section = page.slugs[0] ?? 'other';
    if (!sections.has(section)) {
      sections.set(section, []);
    }
    sections.get(section)!.push({
      title: page.data.title,
      url: page.url,
      description: page.data.description ?? '',
    });
  }

  const sectionLabels: Record<string, string> = {
    introduction: 'Introduction',
    guides: 'Guides',
    'ai-agents': 'AI Agents',
    tools: 'Tools',
    'api-reference': 'API Reference',
  };

  const sectionOrder = ['introduction', 'guides', 'ai-agents', 'tools', 'api-reference'];

  const lines: string[] = [];

  // H1 title
  lines.push('# Across Protocol Documentation');
  lines.push('');

  // Blockquote summary
  lines.push('> Across Protocol is a crosschain interoperability protocol powering fast, low-cost token transfers across 23+ chains.');
  lines.push('> Three settlement mechanisms: Intents (relayer network), CCTP (USDC), and OFT (USDT).');
  lines.push('> API base URL: https://app.across.to/api');
  lines.push('');

  // Ordered sections
  for (const key of sectionOrder) {
    const entries = sections.get(key);
    if (!entries?.length) continue;

    const label = sectionLabels[key] ?? key;
    lines.push(`## ${label}`);
    lines.push('');
    for (const entry of entries) {
      const desc = entry.description ? `: ${entry.description}` : '';
      lines.push(`- [${entry.title}](${entry.url})${desc}`);
    }
    lines.push('');
  }

  // Optional section for any sections not in the ordered list
  const remaining = [...sections.keys()].filter((k) => !sectionOrder.includes(k));
  if (remaining.length > 0) {
    lines.push('## Optional');
    lines.push('');
    for (const key of remaining) {
      const entries = sections.get(key)!;
      for (const entry of entries) {
        const desc = entry.description ? `: ${entry.description}` : '';
        lines.push(`- [${entry.title}](${entry.url})${desc}`);
      }
    }
    lines.push('');
  }

  return new Response(lines.join('\n'));
}
