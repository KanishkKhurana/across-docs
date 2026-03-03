import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import { Inter, Barlow } from 'next/font/google';

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
      <body className="flex flex-col min-h-screen">
        <RootProvider theme={{ enabled: false }}>{children}</RootProvider>
      </body>
    </html>
  );
}
