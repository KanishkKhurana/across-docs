import type { Metadata } from 'next';
import Script from 'next/script';
import { AISearch, AISearchPanel, AISearchTrigger } from '@/components/ai/search';
import { MessageCircleIcon } from 'lucide-react';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';

import { Provider } from '@/components/provider';
import './global.css';
import { Inter, Barlow } from 'next/font/google';
import { cn } from '@/lib/cn';

export const metadata: Metadata = {
  icons: {
    icon: '/across-logo.svg',
  },
};

const inter = Inter({
  subsets: ['latin'],
});

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow',
});

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`dark ${inter.className} ${barlow.variable}`} suppressHydrationWarning>

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>

      <body className="flex flex-col min-h-screen">
        <AISearch>
          {/* Mobile-only: floating trigger + overlay panel (hidden on xl+) */}
          <div className="contents xl:hidden">
            <AISearchPanel />
            <AISearchTrigger
              position="float"
              className={cn(
                buttonVariants({
                  variant: 'secondary',
                  className: 'text-fd-muted-foreground rounded-2xl',
                }),
              )}
            >
              <MessageCircleIcon className="size-4.5" />
              Ask AI
            </AISearchTrigger>
          </div>
          <Provider>{children}</Provider>
        </AISearch>
      </body>
    </html>
  );
}
