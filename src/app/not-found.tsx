import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#151518] px-6 text-center">
      {/* Broken bridge — the transfer didn't make it across */}
      <svg
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="mb-8 w-72 sm:w-96"
      >
        {/* Left platform */}
        <rect x="0" y="60" width="60" height="8" rx="4" fill="#6CF9D8" opacity="0.9" />
        {/* Right platform */}
        <rect x="140" y="60" width="60" height="8" rx="4" fill="#6CF9D8" opacity="0.9" />
        {/* Left pillar */}
        <rect x="48" y="40" width="8" height="28" rx="4" fill="#6CF9D8" opacity="0.6" />
        {/* Right pillar */}
        <rect x="144" y="40" width="8" height="28" rx="4" fill="#6CF9D8" opacity="0.6" />
        {/* Broken path — left stub */}
        <path
          d="M56 44 Q72 30 82 42"
          stroke="#6CF9D8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
          strokeDasharray="4 3"
        />
        {/* Broken path — right stub */}
        <path
          d="M118 42 Q128 30 144 44"
          stroke="#6CF9D8"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.4"
          strokeDasharray="4 3"
        />
        {/* Gap dots — the missing middle */}
        <circle cx="92" cy="52" r="2" fill="#6CF9D8" opacity="0.25">
          <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="100" cy="56" r="2" fill="#6CF9D8" opacity="0.25">
          <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="108" cy="52" r="2" fill="#6CF9D8" opacity="0.25">
          <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
        {/* Subtle glow under platforms */}
        <ellipse cx="30" cy="72" rx="28" ry="6" fill="#6CF9D8" opacity="0.06" />
        <ellipse cx="170" cy="72" rx="28" ry="6" fill="#6CF9D8" opacity="0.06" />
      </svg>
      <p className="mt-4 max-w-sm text-base text-fd-muted-foreground sm:text-lg">
        Looks like this page didn&apos;t make it across.
      </p>
      <p className="mt-1 text-sm italic text-fd-muted-foreground opacity-60">
        ...get it?
      </p>
      <Link
        href="/"
        className="mt-10 rounded-lg bg-fd-primary px-5 py-2.5 text-sm font-medium text-fd-primary-foreground transition-opacity hover:opacity-90"
      >
        Go back to the docs
      </Link>
    </div>
  );
}
