import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import './globals.css';
import { Geist } from 'next/font/google';
import { cn } from '@/lib/utils';
import Script from 'next/script';
import { ServerWakeupBanner } from '@/components/ui/server-wakeup-banner';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const viewport: Viewport = {
  themeColor: '#080c14',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Fabric Flow',
  description: 'Textile production and MES management',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Fabric Flow',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png',  sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png',  sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#080c14',
    'msapplication-TileImage': '/icon-144x144.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('dark', 'font-sans', geist.variable)}>
      <body
        className="font-sans antialiased bg-[#080c14] text-slate-100"
        suppressHydrationWarning
      >
        <QueryProvider>
          <ServerWakeupBanner />
          {children}
          <Toaster richColors position="top-right" theme="dark" />
        </QueryProvider>

        {/* PWA Service Worker registration */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) { console.log('[SW] Registered:', reg.scope); })
                    .catch(function(err) { console.warn('[SW] Failed:', err); });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
