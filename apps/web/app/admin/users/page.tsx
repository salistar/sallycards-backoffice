'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../lib/api';
import AddUserModal from '../../components/AddUserModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import {
  Search,
  UserPlus,
  Trash2,
  Pencil,
  Trophy,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  MoreVertical
} from 'lucide-react';
import EditUserModal from '../../components/EditUserModal';

// Types & Config
const STATUS_CONFIG: Record<string, { label: string; dotColor: string; textColor: string; bgColor: string }> = {
  online: { label: 'En ligne', dotColor: '#10b981', textColor: '#059669', bgColor: '#ecfdf5' },
  in_game: { label: 'En jeu', dotColor: '#f59e0b', textColor: '#d97706', bgColor: '#fffbeb' },
  offline: { label: 'Hors ligne', dotColor: '#9ca3af', textColor: '#6b7280', bgColor: '#f9fafb' },
  idle: { label: 'Inactif', dotColor: '#9ca3af', textColor: '#9ca3af', bgColor: '#f9fafb' },
};

const ROLE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  admin: { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
  moderator: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  player: { bg: '#f3f4f6', text: '#4b5563', border: '#e5e7eb' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [addBtnHover, setAddBtnHover] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await apiClient.listUsers(params);
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiClient.deleteUserById(deleteTarget._id);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur.');
    } finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : '-';
  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    return hours > 0 ? `${hours}h` : `${Math.floor(ms / 60000)}m`;
  };

  const FILTERS = ['all', 'online', 'in_game', 'offline'];
  const FILTER_LABELS: Record<string, string> = { all: 'Tous', online: 'Online', in_game: 'In game', offline: 'Offline' };
  const TABLE_HEADERS = ['Joueur', 'Role', 'App', 'Score / ELO', 'Activite', 'Statut', ''];

  const GAME_TYPE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    ronda: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    kdoub: { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    belote: { bg: '#faf5ff', text: '#9333ea', border: '#e9d5ff' },
    poker: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    tarot: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    scopa: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
    okey: { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    concentration: { bg: '#fdf4ff', text: '#c026d3', border: '#f5d0fe' },
    solitaire: { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' },
    quiestce: { bg: '#fefce8', text: '#ca8a04', border: '#fef08a' },
  };

  return (
    <div style={{ maxWidth: 1600, margin: '0 auto', padding: 32, display: 'flex', flexDirection: 'column', gap: 48 }}>

      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              padding: 12,
              backgroundColor: '#ecfdf5',
              borderRadius: 24,
              border: '1px solid #a7f3d0',
            }}
          >
            <UsersIcon style={{ width: 32, height: 32, color: '#10b981' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#111827', letterSpacing: '-0.05em' }}>Joueurs</h1>
            <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>{total}</span> membres enregistres
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          onMouseEnter={() => setAddBtnHover(true)}
          onMouseLeave={() => setAddBtnHover(false)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 20px',
            backgroundColor: addBtnHover ? '#059669' : '#10b981',
            color: '#ffffff',
            fontWeight: 700,
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.3s ease-out',
            fontSize: 14,
          }}
        >
          <UserPlus style={{ width: 20, height: 20 }} />
          <span>Nouveau joueur</span>
        </button>
      </div>

      {/* Control Bar (Search & Filters) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 16,
          backgroundColor: '#ffffff',
          padding: 16,
          borderRadius: 24,
          border: '1px solid #f3f4f6',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 300px' }}>
          <Search
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 16,
              color: '#9ca3af',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Rechercher un pseudo ou email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: '100%',
              backgroundColor: '#f9fafb',
              border: '2px solid #e5e7eb',
              borderRadius: 12,
              padding: '10px 16px 10px 44px',
              fontSize: 14,
              color: '#111827',
              outline: 'none',
              transition: 'all 0.3s ease-out',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#10b981'; e.target.style.boxShadow = '0 0 0 4px rgba(16,185,129,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {FILTERS.map((f) => {
            const isActive = statusFilter === f;
            const isHov = hoveredFilter === f;
            return (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setPage(1); }}
                onMouseEnter={() => setHoveredFilter(f)}
                onMouseLeave={() => setHoveredFilter(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s ease-out',
                  border: isActive ? '1px solid #10b981' : '1px solid #e5e7eb',
                  backgroundColor: isActive ? '#ecfdf5' : 'transparent',
                  color: isActive ? '#059669' : isHov ? '#374151' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {FILTER_LABELS[f] || f.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Section */}
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 24,
          border: '1px solid #f3f4f6',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {TABLE_HEADERS.map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '16px 24px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '80px 0', textAlign: 'center' }}>
                    <Loader />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '80px 0', textAlign: 'center', color: '#6b7280' }}>
                    Aucun joueur trouve
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const st = STATUS_CONFIG[u.status] || STATUS_CONFIG.offline;
                  const isRowHovered = hoveredRow === u._id;
                  const role = ROLE_STYLES[u.role] || ROLE_STYLES.player;
                  return (
                    <tr
                      key={u._id}
                      onMouseEnter={() => setHoveredRow(u._id)}
                      onMouseLeave={() => setHoveredRow(null)}
                      style={{
                        backgroundColor: isRowHovered ? '#f9fafb' : 'transparent',
                        transition: 'all 0.3s ease-out',
                        borderBottom: '1px solid #f9fafb',
                      }}
                    >
                      {/* User Info */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 12,
                              background: 'linear-gradient(135deg, #d1fae5, #ecfdf5)',
                              border: '1px solid #a7f3d0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: '#059669',
                              transition: 'all 0.3s ease-out',
                              transform: isRowHovered ? 'scale(1.1)' : 'scale(1)',
                            }}
                          >
                            {u.username?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: 4 }}>
                              {u.username}
                            </p>
                            <p style={{ fontSize: 12, color: '#6b7280' }}>{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 12px',
                            borderRadius: 12,
                            border: `1px solid ${role.border}`,
                            fontSize: 10,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            backgroundColor: role.bg,
                            color: role.text,
                          }}
                        >
                          <Shield style={{ width: 12, height: 12 }} />
                          {u.role}
                        </div>
                      </td>

                      {/* App / Game Type */}
                      <td style={{ padding: '16px 24px' }}>
                        {(() => {
                          const gt = u.gameType || 'ronda';
                          const gtStyle = GAME_TYPE_COLORS[gt] || GAME_TYPE_COLORS.ronda;
                          return (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 12px',
                                borderRadius: 12,
                                border: `1px solid ${gtStyle.border}`,
                                fontSize: 10,
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                backgroundColor: gtStyle.bg,
                                color: gtStyle.text,
                              }}
                            >
                              {gt}
                            </div>
                          );
                        })()}
                      </td>

                      {/* ELO / Stats */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Trophy style={{ width: 14, height: 14, color: '#f59e0b' }} />
                            <span style={{ fontSize: 14, fontWeight: 900, color: '#111827' }}>{u.stats?.elo || 1000}</span>
                            <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 500 }}>({u.stats?.gamesPlayed} matches)</span>
                          </div>
                          <div style={{ width: 96, height: 4, backgroundColor: '#f3f4f6', borderRadius: 4, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                background: 'linear-gradient(90deg, #d97706, #fbbf24)',
                                transition: 'all 0.3s ease-out',
                                width: `${Math.min(100, (u.stats?.elo / 2500) * 100)}%`,
                                borderRadius: 4,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Playtime */}
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>{formatTime(u.stats?.totalPlayTimeMs || 0)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 24px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '4px 12px',
                            borderRadius: 999,
                            border: '1px solid #e5e7eb',
                            backgroundColor: st.bgColor,
                            color: st.textColor,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: st.dotColor,
                              animation: u.status === 'online' || u.status === 'in_game' ? 'pulse 2s infinite' : 'none',
                            }}
                          />
                          {st.label}
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          onClick={() => setEditTarget(u)}
                          style={{
                            padding: 8,
                            color: '#9ca3af',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease-out',
                          }}
                          title="Edit"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#2563eb';
                            e.currentTarget.style.backgroundColor = '#eff6ff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#9ca3af';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Pencil style={{ width: 16, height: 16 }} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          style={{
                            padding: 8,
                            color: '#9ca3af',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: 12,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease-out',
                          }}
                          title="Supprimer"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.backgroundColor = '#fef2f2';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#9ca3af';
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Trash2 style={{ width: 16, height: 16 }} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '16px 24px',
              backgroundColor: '#f9fafb',
              borderTop: '1px solid #f9fafb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <p style={{ fontSize: 12, color: '#6b7280' }}>
              Affichage de la page <span style={{ color: '#111827', fontWeight: 700 }}>{page}</span> sur <span style={{ color: '#111827', fontWeight: 700 }}>{totalPages}</span>
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.2 : 1,
                  color: '#374151',
                  transition: 'all 0.3s ease-out',
                }}
              >
                <ChevronLeft style={{ width: 16, height: 16 }} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  padding: 8,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#ffffff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.2 : 1,
                  color: '#374151',
                  transition: 'all 0.3s ease-out',
                }}
              >
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddUserModal open={showAddModal} onClose={() => setShowAddModal(false)} onCreated={fetchUsers} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Supprimer le joueur"
        message={`Attention, vous allez supprimer le profil de ${deleteTarget?.username}. Cette action est definitive.`}
        confirmLabel="Confirmer la suppression"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDestructive
        loading={deleting}
      />
      <EditUserModal
        open={!!editTarget}
        user={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={fetchUsers}
      />
    </div>
  );
}

// Loader component
function Loader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: '4px solid #a7f3d0',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        Synchronisation...
      </span>
    </div>
  );
}
