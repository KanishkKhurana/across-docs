'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { DropdownOption } from './types';

interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function LogoFallback({ label }: { label: string }) {
  return (
    <div className="size-5 rounded-full bg-[var(--color-fd-primary)]/20 flex items-center justify-center text-[10px] font-bold text-[var(--color-fd-primary)] shrink-0">
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

function Logo({
  url,
  label,
  className,
}: {
  url?: string;
  label: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return <LogoFallback label={label} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className={cn('size-5 rounded-full shrink-0', className)}
      onError={() => setFailed(true)}
    />
  );
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const showSearch = options.length > 8;

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel?.toLowerCase().includes(search.toLowerCase()) ?? false),
      )
    : options;

  const close = useCallback(() => {
    setOpen(false);
    setSearch('');
    setHighlightIndex(0);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Focus search when opened
  useEffect(() => {
    if (open && showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open, showSearch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-option]');
    items[highlightIndex]?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) {
          onChange(filtered[highlightIndex].value);
          close();
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen(!open);
        }}
        className={cn(
          'w-full flex items-center gap-2 rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
          'py-2.5 px-3 text-sm text-left',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-fd-primary)] focus:border-transparent',
          'transition-shadow',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {selected ? (
          <>
            <Logo url={selected.logoUrl} label={selected.label} />
            <span className="text-[var(--color-fd-foreground)] truncate flex-1">
              {selected.label}
            </span>
          </>
        ) : (
          <span className="text-[var(--color-fd-muted-foreground)] truncate flex-1">
            {placeholder}
          </span>
        )}
        <ChevronDown
          className={cn(
            'size-4 text-[var(--color-fd-muted-foreground)] shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--color-fd-border)] bg-[var(--color-fd-card)] shadow-lg overflow-hidden">
          {showSearch && (
            <div className="p-2 border-b border-[var(--color-fd-border)]">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightIndex(0);
                }}
                placeholder="Search..."
                className={cn(
                  'w-full rounded-md border border-[var(--color-fd-border)] bg-[var(--color-fd-background)]',
                  'py-1.5 px-3 text-sm text-[var(--color-fd-foreground)]',
                  'placeholder:text-[var(--color-fd-muted-foreground)]',
                  'focus:outline-none focus:ring-1 focus:ring-[var(--color-fd-primary)]',
                )}
              />
            </div>
          )}
          <div ref={listRef} className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[var(--color-fd-muted-foreground)] text-center">
                No results
              </div>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={option.value}
                  data-option
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    close();
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                    'hover:bg-[var(--color-fd-secondary)] transition-colors',
                    i === highlightIndex && 'bg-[var(--color-fd-secondary)]',
                    option.value === value &&
                      'text-[var(--color-fd-primary)] font-medium',
                  )}
                >
                  <Logo url={option.logoUrl} label={option.label} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[var(--color-fd-foreground)] truncate">
                      {option.label}
                    </div>
                    {option.sublabel && (
                      <div className="text-xs text-[var(--color-fd-muted-foreground)] truncate">
                        {option.sublabel}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
