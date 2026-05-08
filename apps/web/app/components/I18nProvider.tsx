'use client';

import { useEffect, useState } from 'react';

export default function I18nProvider({ children }: { children: any }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import('../lib/i18n').then((mod) => {
      const { LANGUAGES } = mod;
      const lang = mod.default.language;
      const dir = LANGUAGES.find((l: any) => l.code === lang)?.dir || 'ltr';
      document.documentElement.dir = dir;
      document.documentElement.lang = lang;
      setReady(true);
    });
  }, []);

  if (!ready) return <>{children}</>;

  return <>{children}</>;
}
