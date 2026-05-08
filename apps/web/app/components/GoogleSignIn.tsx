/**
 * @file GoogleSignIn.tsx
 * @description Bouton Google Sign-In côté web (Google Identity Services).
 *
 * Utilise GIS pour récupérer un id_token, l'envoie au backend `/auth/google`
 * qui le vérifie via `https://oauth2.googleapis.com/tokeninfo` et retourne
 * un JWT du backend (synchro avec mobile).
 */

'use client';

import { useEffect, useRef, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInProps {
  onSuccess?: (user: any, accessToken: string) => void;
  onError?: (err: string) => void;
}

export default function GoogleSignIn({ onSuccess, onError }: GoogleSignInProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charge le script GIS si pas déjà chargé
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.google?.accounts?.id) {
      setScriptReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => setError('Impossible de charger Google Sign-In');
    document.head.appendChild(script);
  }, []);

  // Initialise GIS + render bouton
  useEffect(() => {
    if (!scriptReady || !buttonRef.current) return;
    if (!GOOGLE_CLIENT_ID) {
      setError('GOOGLE_OAUTH_CLIENT_ID non configuré (.env.local)');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response: { credential: string }) => {
        try {
          const res = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken: response.credential, gameType: 'solitaire' }),
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`Backend ${res.status}: ${text}`);
          }
          const json = await res.json();
          if (json?.accessToken) {
            // Persiste le token
            localStorage.setItem('accessToken', json.accessToken);
            localStorage.setItem('user', JSON.stringify(json.user));
            onSuccess?.(json.user, json.accessToken);
          } else {
            throw new Error('Pas de accessToken retourné');
          }
        } catch (e: any) {
          const msg = e?.message ?? String(e);
          setError(msg);
          onError?.(msg);
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      type: 'standard',
      size: 'large',
      theme: 'filled_blue',
      text: 'signin_with',
      shape: 'rectangular',
      logo_alignment: 'left',
    });
  }, [scriptReady, onSuccess, onError]);

  if (error) {
    return (
      <div className="text-sm text-red-400 p-3 bg-red-900/30 border border-red-500 rounded">
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div>
      <div ref={buttonRef} />
      {!scriptReady ? (
        <div className="text-xs text-slate-400 mt-2">Chargement de Google Sign-In…</div>
      ) : null}
    </div>
  );
}
