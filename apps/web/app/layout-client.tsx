'use client';

import { ReactNode, useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n, { LANGUAGES } from './lib/i18n';
import { AuthProvider } from './lib/auth-context';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lang = i18n.language;
    const dir = LANGUAGES.find((l) => l.code === lang)?.dir || 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </I18nextProvider>
  );
}
