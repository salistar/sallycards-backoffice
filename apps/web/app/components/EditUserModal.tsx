'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';

const ROLES = ['player', 'admin', 'moderator'];
const GAME_TYPES = ['ronda', 'kdoub', 'belote', 'poker', 'tarot', 'scopa', 'okey', 'concentration', 'solitaire', 'quiestce'];

interface EditUserModalProps {
  open: boolean;
  user: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditUserModal({ open, user, onClose, onSaved }: EditUserModalProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('player');
  const [gameType, setGameType] = useState('ronda');
  const [elo, setElo] = useState(1000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveBtnHover, setSaveBtnHover] = useState(false);
  const [cancelBtnHover, setCancelBtnHover] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setRole(user.role || 'player');
      setGameType(user.gameType || 'ronda');
      setElo(user.stats?.elo || 1000);
      setError('');
    }
  }, [user]);

  if (!open || !user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await apiClient.updateUserById(user._id, {
        username,
        email,
        role,
        gameType,
        stats: { ...user.stats, elo },
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 24,
          padding: 40,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#111827',
            letterSpacing: '-0.03em',
            marginTop: 0,
            marginBottom: 8,
          }}>
            Edit User
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Modify the user profile details below.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 12,
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Username */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>

          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>

          {/* Role */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Game Type / App */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Game Type / App
            </label>
            <select
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            >
              {GAME_TYPES.map((g) => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* ELO */}
          <div>
            <label style={{
              display: 'block',
              fontSize: 12,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              ELO
            </label>
            <input
              type="number"
              value={elo}
              onChange={(e) => setElo(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e5e7eb',
                fontSize: 14,
                fontWeight: 500,
                color: '#111827',
                outline: 'none',
                backgroundColor: '#f9fafb',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#10b981'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; }}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32 }}>
          <button
            onClick={onClose}
            onMouseEnter={() => setCancelBtnHover(true)}
            onMouseLeave={() => setCancelBtnHover(false)}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              backgroundColor: cancelBtnHover ? '#f3f4f6' : '#ffffff',
              color: '#374151',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            onMouseEnter={() => setSaveBtnHover(true)}
            onMouseLeave={() => setSaveBtnHover(false)}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              border: 'none',
              backgroundColor: saving ? '#9ca3af' : saveBtnHover ? '#059669' : '#10b981',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
