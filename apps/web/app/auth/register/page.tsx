'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../lib/auth-context';
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

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

const focusIn = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#10b981';
  e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)';
};
const focusOut = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = '#e5e7eb';
  e.target.style.boxShadow = 'none';
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim()) return setError("Choisissez un nom d'utilisateur.");
    if (!form.email.trim()) return setError('Entrez votre email.');
    if (form.password.length < 6) return setError('Mot de passe: 6 caracteres minimum.');
    if (form.password !== form.confirmPassword) return setError('Les mots de passe ne correspondent pas.');
    if (!acceptTerms) return setError("Acceptez les conditions d'utilisation.");

    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la creation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: 440, margin: '0 auto' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.03em', marginBottom: '0.5rem' }}>
          {t('auth.register')}
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#6b7280', lineHeight: 1.6 }}>
          {t('auth.registerWelcome')}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Username */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            {t('auth.username')}
          </label>
          <div style={{ position: 'relative' }}>
            <User style={iconStyle} />
            <input type="text" value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="votre_pseudo" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>

        {/* Email */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            {t('auth.email')}
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={iconStyle} />
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="votre@email.com" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            {t('auth.password')}
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={iconStyle} />
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder="••••••••"
              style={inputStylePassword}
              onFocus={focusIn}
              onBlur={focusOut}
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

        {/* Confirm Password */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
            {t('auth.confirmPassword')}
          </label>
          <div style={{ position: 'relative' }}>
            <Lock style={iconStyle} />
            <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="••••••••" style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </div>
        </div>

        {/* Terms */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.5rem' }}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            style={{ width: '1.25rem', height: '1.25rem', accentColor: '#10b981', marginTop: '0.15rem', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#6b7280' }}>
            J&apos;accepte les{' '}
            <Link href="/terms" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>conditions</Link>
            {' '}et la{' '}
            <Link href="/privacy" style={{ color: '#10b981', fontWeight: 600, textDecoration: 'none' }}>politique de confidentialite</Link>
          </span>
        </label>

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
              {t('auth.registerButton')}
              <ArrowRight style={{ width: '1.25rem', height: '1.25rem' }} />
            </>
          )}
        </button>
      </form>

      {/* Login link */}
      <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#6b7280' }}>
        {t('auth.hasAccount')}{' '}
        <Link href="/auth/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
          {t('auth.login')}
        </Link>
      </p>
    </div>
  );
}
