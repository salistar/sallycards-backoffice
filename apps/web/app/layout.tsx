import type { Metadata } from 'next';
import './globals.css';
import RootLayoutClient from './layout-client';

export const metadata: Metadata = {
  title: 'SallyCards · 10 jeux de cartes MENA — Solitaire, Ronda, Belote',
  description:
    'Plateforme de jeux de cartes pour la région MENA. Solitaire disponible maintenant (Android APK). 9 autres jeux à venir : Ronda, Kdoub, Belote, Poker, Tarot, Scopa, Okey, Memory, Qui-est-ce. Trilingue FR/EN/AR.',
  manifest: '/manifest.json',
  themeColor: '#0a0e1a',
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
