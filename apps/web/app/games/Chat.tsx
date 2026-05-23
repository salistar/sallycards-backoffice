/**
 * @file apps/web/app/games/Chat.tsx
 * @description Chat texte temps réel pour les rooms (namespace /chat). Panneau
 *   repliable (avec / sans chat). roomId namespacé par jeu pour l'indépendance.
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Send, X } from 'lucide-react';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
const GOLD = '#FCD34D';
const BLUE = '#93C5FD';

interface Msg { id: string; senderId: string; senderName: string; content: string; timestamp: string }

export default function Chat({ roomId, token, defaultOpen = false }: { roomId: string; token: string | null; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [unread, setUnread] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const meRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  useEffect(() => { openRef.current = open; if (open) setUnread(0); }, [open]);

  useEffect(() => {
    if (!token || !roomId) return;
    const s = io(`${SOCKET_URL}/chat`, { transports: ['websocket'], auth: { token } });
    socketRef.current = s;
    s.on('connect', () => s.emit('chat:join', { roomId }));
    s.on('chat:message', (m: Msg) => {
      setMsgs((prev) => [...prev.slice(-80), m]);
      if (!openRef.current && m.senderId !== meRef.current) setUnread((u) => u + 1);
    });
    return () => { s.emit('chat:leave', { roomId }); s.disconnect(); socketRef.current = null; };
  }, [token, roomId]);

  useEffect(() => { if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [msgs, open]);

  const send = () => {
    const c = text.trim();
    if (!c || !socketRef.current) return;
    socketRef.current.emit('chat:message', { roomId, content: c });
    setText('');
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 50, display: 'inline-flex', alignItems: 'center', gap: 8, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', fontWeight: 800, border: 'none', borderRadius: 999, padding: '12px 18px', cursor: 'pointer', boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
        <MessageCircle style={{ width: 18, height: 18 }} /> Chat{unread > 0 ? ` (${unread})` : ''}
      </button>
    );
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 50, width: 300, maxWidth: 'calc(100vw - 32px)', height: 380, background: '#0A1429', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}><MessageCircle style={{ width: 16, height: 16, color: GOLD }} /> Chat</span>
        <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
      </div>
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {msgs.length === 0 && <span style={{ color: '#64748B', fontSize: '0.8rem', textAlign: 'center', marginTop: 20 }}>Aucun message. Dis bonjour 👋</span>}
        {msgs.map((m) => (
          <div key={m.id} style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
            <div style={{ color: GOLD, fontSize: '0.66rem', fontWeight: 800 }}>{m.senderName}</div>
            <div style={{ color: '#E2E8F0', fontSize: '0.84rem', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '6px 10px', marginTop: 2 }}>{m.content}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, padding: 10, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Message…" maxLength={500} style={{ flex: 1, background: '#152A47', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 11px', color: '#fff', outline: 'none', fontSize: '0.85rem' }} />
        <button onClick={send} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 40, background: `linear-gradient(90deg, ${GOLD}, #F59E0B)`, color: '#0A1535', border: 'none', borderRadius: 10, cursor: 'pointer' }}><Send style={{ width: 16, height: 16 }} /></button>
      </div>
    </div>
  );
}
