'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth-context';
import { GAMES } from '../../lib/games';
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowRight, Gamepad2, Shield, User as UserIcon } from 'lucide-react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  paddingLeft: '3rem',
  paddingRight: '1rem',
  paddingTop: '1rem',
  paddingBottom: '1rem',
  backgroundColor: '#ffffff',
  border: '2px solid #e5e7eb',
  borderRadius: '0.75rem',
  fontSize: '1rem',
  color: '#111827',
  outline: 'none',
};

const inputStylePassword: React.CSSProperties = {
  ...inputStyle,
  paddingRight: '3.5rem',
};

const iconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '1rem',
  top: '50%',
  transform: 'translateY(-50%)',
  width: '1.25rem',
  height: '1.25rem',
  color: '#9ca3af',
  pointerEvents: 'none',
};

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Choix type de jeu (depuis ?game= ou défaut belote) + rôle
  const [gameType, setGameType] = useState<string>(searchParams?.get('game') || 'belote');
  const [role, setRole] = useState<'player' | 'admin'>('player');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    setLoading(true);
    try {
      // Mémorise le contexte (le rôle réel reste validé côté serveur)
      try {
        localStorage.setItem('sally_gameType', gameType);
        localStorage.setItem('sally_role', role);
      } catch {}
      await login(email, password);
      // Redirection : admin → console admin, sinon → le jeu choisi
      router.push(role === 'admin' ? '/admin' : `/${gameType}`);
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@sallycards.com');
    setPassword('Demo123456');
  };

  return (
    <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          {t('auth.login')}
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6 }}>
          {t('auth.loginWelcome')}
        </p>
      </div>

      {/* Demo box */}
      <button
        onClick={fillDemo}
        type="button"
        style={{
          width: '100%',
          padding: '1.25rem 1.5rem',
          borderRadius: '0.75rem',
          backgroundColor: '#eff6ff',
          border: '2px solid #bfdbfe',
          cursor: 'pointer',
          textAlign: 'left' as const,
          marginBottom: '2rem',
        }}
      >
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#2563eb', marginBottom: '0.5rem' }}>
          {t('auth.demoAccount')}
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', fontFamily: 'monospace', color: '#6b7280' }}>
          <span>Email: <span style={{ color: '#111827', fontWeight: 600 }}>demo@sallycards.com</span></span>
          <span>Pass: <span style={{ color: '#111827', fontWeight: 600 }}>Demo123456</span></span>
        </div>
      </button>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Type de jeu */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            <Gamepad2 style={{ width: '1rem', height: '1rem', color: '#10b981' }} /> Type de jeu
          </label>
          <select
            value={gameType}
            onChange={(e) => setGameType(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '1rem', appearance: 'auto' as any }}
          >
            {GAMES.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>
        </div>

        {/* Rôle */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            Rôle
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {([['player', 'Joueur', UserIcon], ['admin', 'Administrateur', Shield]] as const).map(([val, label, Icon]) => (
              <button
                key={val}
                type="button"
                onClick={() => setRole(val)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  padding: '0.85rem', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem',
                  border: `2px solid ${role === val ? '#10b981' : '#e5e7eb'}`,
                  backgroundColor: role === val ? '#ecfdf5' : '#ffffff',
                  color: role === val ? '#047857' : '#6b7280',
                }}
              >
                <Icon style={{ width: '1.1rem', height: '1.1rem' }} /> {label}
              </button>
            ))}
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            {t('auth.email')}
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={iconStyle} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nom@exemple.com"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
              {t('auth.password')}
            </label>
            <Link href="#" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#10b981', textDecoration: 'none' }}>
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock style={iconStyle} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStylePassword}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}
            >
              {showPassword ? <EyeOff style={{ width: '1.25rem', height: '1.25rem' }} /> : <Eye style={{ width: '1.25rem', height: '1.25rem' }} />}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '1rem',
            backgroundColor: loading ? '#86efac' : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '0.75rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 10px 25px -5px rgba(16,185,129,0.25)',
            marginBottom: '2rem',
          }}
        >
          {loading ? (
            <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />
          ) : (
            <>
              {t('auth.loginButton')}
              <ArrowRight style={{ width: '1.25rem', height: '1.25rem' }} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{ position: 'relative', margin: '1.5rem 0' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', borderTop: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <span style={{ padding: '0 1rem', fontSize: '0.75rem', textTransform: 'uppercase' as const, color: '#9ca3af', fontWeight: 600, backgroundColor: 'white' }}>
            ou
          </span>
        </div>
      </div>

      {/* Social */}
      <div style={{ marginBottom: '2rem' }}>
        <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.875rem', borderRadius: '0.75rem', backgroundColor: 'white', border: '2px solid #e5e7eb', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: '#374151', width: '100%' }}>
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" style={{ width: '1.25rem', height: '1.25rem' }} alt="Google" />
          Google
        </button>
      </div>

      {/* Register link */}
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
        {t('auth.noAccount')}{' '}
        <Link href="/auth/register" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
          {t('auth.register')}
        </Link>
      </p>
    </div>
  );
}
