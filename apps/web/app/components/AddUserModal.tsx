'use client';

import { useState } from 'react';
import { apiClient } from '../lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddUserModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'player' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password) {
      setError('Tous les champs sont requis.');
      return;
    }
    setLoading(true);
    try {
      await apiClient.createUser(form);
      setForm({ username: '', email: '', password: '', role: 'player' });
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la creation.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-gray-900 outline-none bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 ease-out';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 border border-gray-200 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-black text-gray-900 mb-6 tracking-tighter">Ajouter un utilisateur</h2>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Nom d&apos;utilisateur</label>
            <input className={inputCls} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="pseudo" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
            <input className={inputCls} type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Mot de passe</label>
            <input className={inputCls} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="min. 8 caracteres" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Role</label>
            <select className={inputCls} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
              <option value="player">Joueur</option>
              <option value="moderator">Moderateur</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-all duration-300 ease-out active:scale-95">
              {loading ? 'Creation...' : 'Creer'}
            </button>
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 ease-out">
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
