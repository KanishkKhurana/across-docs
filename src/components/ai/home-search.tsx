'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, Loader2, ArrowRight } from 'lucide-react';
import { type UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type Tool, type UIToolInvocation } from 'ai';
import { Markdown } from '../markdown';
import type { SearchTool } from '../../app/api/chat/route';
import Link from 'next/link';

export function HomeSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);

  const { messages, status, sendMessage, setMessages } = useChat({
    id: 'home-search',
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Send pending question once messages are cleared
  useEffect(() => {
    if (pendingQuestion && messages.length === 0) {
      sendMessage({ text: pendingQuestion });
      setPendingQuestion(null);
    }
  }, [pendingQuestion, messages.length, sendMessage]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const question = inputRef.current?.value.trim() ?? '';
    if (!question || isLoading) return;

    if (messages.length > 0) {
      setPendingQuestion(question);
      setMessages([]);
    } else {
      sendMessage({ text: question });
    }
  };

  // Extract assistant answer + most relevant docs URL
  const lastAssistant = [...messages].reverse().find(
    (m) => m.role === 'assistant',
  );

  let answerText = '';
  let relevantUrl = '/introduction';

  if (lastAssistant) {
    for (const part of lastAssistant.parts ?? []) {
      if (part.type === 'text') {
        answerText += part.text;
      }
      if (part.type.startsWith('tool-')) {
        const toolName = part.type.slice('tool-'.length);
        if (toolName === 'search') {
          const p = part as UIToolInvocation<SearchTool>;
          if (p.output && Array.isArray(p.output) && p.output.length > 0) {
            const first = p.output[0] as { id?: string; doc?: { url?: string } };
            if (first?.doc?.url) relevantUrl = first.doc.url;
            else if (typeof first?.id === 'string') relevantUrl = first.id;
          }
        }
      }
    }
  }

  const showAnswer = answerText.length > 0 || (isLoading && messages.length > 0);
  const isDone = !isLoading && answerText.length > 0;

  return (
    <div className="w-full max-w-2xl mb-12">
      <div className="rounded-xl border border-fd-border bg-fd-card/50 backdrop-blur-sm overflow-hidden">
        {/* Search Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center px-4 py-3 gap-3"
        >
          <Search className="size-5 text-fd-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            onChange={(e) => setCanSubmit(e.target.value.trim().length > 0)}
            placeholder="Ask anything about Across..."
            className="flex-1 bg-transparent text-fd-foreground placeholder:text-fd-muted-foreground focus:outline-none text-sm"
            disabled={isLoading}
          />
          {isLoading ? (
            <Loader2 className="size-5 text-fd-muted-foreground animate-spin shrink-0" />
          ) : (
            <button
              type="submit"
              disabled={!canSubmit}
              className="shrink-0 disabled:opacity-30 transition-opacity"
            >
              <Send className="size-4 text-fd-primary" />
            </button>
          )}
        </form>

        {/* Answer Area */}
        {showAnswer && (
          <div className="border-t border-fd-border px-4 py-4">
            {answerText ? (
              <div className="prose prose-sm text-sm text-fd-foreground max-h-[300px] overflow-y-auto fd-scroll-container">
                <Markdown text={answerText} />
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-fd-muted-foreground py-1">
                <Loader2 className="size-4 animate-spin" />
                Thinking...
              </div>
            )}

            {isDone && (
              <Link
                href={relevantUrl}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                style={{ backgroundColor: '#6CF9D8', color: '#0a0a0a' }}
              >
                Integrate Across in less than 60 mins
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
