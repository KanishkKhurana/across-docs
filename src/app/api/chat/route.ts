import { createOpenAI } from '@ai-sdk/openai';
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from 'ai';
import { z } from 'zod';
import { source } from '@/lib/source';
import { Document, type DocumentData } from 'flexsearch';

interface CustomDocument extends DocumentData {
  url: string;
  title: string;
  description: string;
  content: string;
}

const searchServer = createSearchServer();

async function createSearchServer() {
  const search = new Document<CustomDocument>({
    document: {
      id: 'url',
      index: ['title', 'description', 'content'],
      store: true,
    },
  });

  const docs = await chunkedAll(
    source.getPages().map(async (page) => {
      if (!('getText' in page.data)) return null;

      return {
        title: page.data.title,
        description: page.data.description,
        url: page.url,
        content: await page.data.getText('raw'),
      } as CustomDocument;
    }),
  );

  for (const doc of docs) {
    if (doc) search.add(doc);
  }

  return search;
}

async function chunkedAll<O>(promises: Promise<O>[]): Promise<O[]> {
  const SIZE = 50;
  const out: O[] = [];
  for (let i = 0; i < promises.length; i += SIZE) {
    out.push(...(await Promise.all(promises.slice(i, i + SIZE))));
  }
  return out;
}

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = [
  'You are the Across Protocol documentation assistant. You answer questions about Across Protocol — its architecture, API, SDK, contracts, bridges, chains, relayers, intents, settlement mechanisms, and integration guides. You also answer general blockchain, web3, crosschain, coding, and software engineering questions.',
  '',
  'STRICT GUARDRAIL: Only reject questions that have ZERO connection to technology, software, or crypto (e.g. cooking recipes, dating advice, sports scores, celebrity gossip). If a question is about ANY programming language, framework, tool, library, architecture pattern, devops, frontend, backend, databases, APIs, or tech comparison — answer it freely. When in doubt, answer the question.',
  '"I\'m only here to help with Across Protocol and blockchain-related questions. Feel free to ask me about the Swap API, bridging, integration guides, smart contracts, crosschain architecture, or anything else related to Across and web3!"',
  'Do NOT answer off-topic questions under any circumstances, even if the user insists.',
  '',
  'Use the `search` tool to retrieve relevant docs context before answering when needed.',
  'The `search` tool returns raw JSON results from documentation. Use those results to ground your answer and cite sources as markdown links using the document `url` field when available.',
  'If you cannot find the answer in search results, say you do not know and suggest the user check the Across docs or reach out on Telegram (https://t.me/acrosstg).',
].join('\n');

export async function POST(req: Request) {
  const reqJson: { messages?: UIMessage[] } = await req.json();

  const result = streamText({
    model: openai(process.env.OPENAI_MODEL ?? 'gpt-4o-mini'),
    stopWhen: stepCountIs(5),
    tools: {
      search: searchTool,
    },
    messages: [
      { role: 'system', content: systemPrompt },
      ...(await convertToModelMessages(reqJson.messages ?? [])),
    ],
    toolChoice: 'auto',
  });

  return result.toUIMessageStreamResponse();
}

const searchTool = tool({
  description: 'Search the docs content and return raw JSON results.',
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().int().min(1).max(100).default(10),
  }),
  async execute({ query, limit }) {
    const search = await searchServer;
    return await search.searchAsync(query, { limit, merge: true, enrich: true });
  },
});

export type SearchTool = typeof searchTool;
