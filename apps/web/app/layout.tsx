import type { Metadata } from 'next';
import './globals.css';
import RootLayoutClient from './layout-client';

export const metadata: Metadata = {
  title: 'SallyCards - جوي الكارطة',
  description: 'SallyCards - 10 jeux de cartes MENA. Ronda, Kdoub, Belote, Poker et plus.',
  manifest: '/manifest.json',
  themeColor: '#0EA5E9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0EA5E9" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800;900&family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  );
}
