import type { Metadata } from 'next';
import './globals.css';
import RootLayoutClient from './layout-client';

export const metadata: Metadata = {
  title: 'SallyCards · Le Roi des Jeux de Cartes — Solitaire, Ronda, Belote',
  description:
    'Plateforme premium de jeux de cartes pour la région MENA. Solitaire disponible immédiatement (Android APK). 9 autres jeux à venir : Ronda, Kdoub, Belote, Poker, Tarot, Scopa, Okey, Memory, Qui-est-ce. Trilingue FR / EN / AR.',
  manifest: '/manifest.json',
  themeColor: '#0A1F44',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0A1F44" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;0,900;1,600&family=Inter:wght@300;400;500;600;700;800;900&family=Cairo:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
