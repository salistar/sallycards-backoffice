/**
 * @file game/[roomCode].tsx
 * @description Table Tarot multijoueur — client MINCE du gateway /game
 *   AUTORITATIF (gameType 'tarot'). Pendant RN de apps/web/app/tarot/room/[code].
 *   Bots + plis + décompte gérés CÔTÉ SERVEUR.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { io, Socket } from 'socket.io-client';
import AppHeader from '../../src/components/AppHeader';
import P2PCall from '../../src/components/P2PCall';
import Chat from '../../src/components/Chat';
import { useTheme } from '../../src/contexts/AppProviders';
import { logger } from '../../src/utils/logger';
import { APP_CONFIG } from '../../src/config/app.config';
import { SOCKET_URL } from '../../shared/api';
import * as api from '../../shared/api';

const log = logger.scoped('TarotRoom');
const GOLD = '#FCD34D';
const SUIT_SYM: Record<string, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣', S: '♠', H: '♥', D: '♦', C: '♣', pique: '♠', coeur: '♥', carreau: '♦', trefle: '♣' };

interface AnyCard { id?: string; suit?: string; value?: number; trump?: number; excuse?: boolean; [k: string]: any }
interface SeatPlayer { id: string; name: string; isBot: boolean; count: number; hand?: AnyCard[] }
interface Snapshot {
  youId: string; phase: 'playing' | 'game_over'; turn: number; currentId: string | null;
  players: SeatPlayer[]; trick: { p: string; card: AnyCard }[];
  takerPoints?: number; takerBouts?: number; result?: string; winner?: number | null;
  lastEvent?: string; log?: string[];
}

function cardText(c: AnyCard): string {
  if (!c) return '?';
  if (c.excuse) return '★';
  if (c.trump != null) return `🃏${c.trump}`;
  const sym = c.suit ? (SUIT_SYM[c.suit] || c.suit) : '';
  const v = c.value != null ? (c.value === 11 ? 'V' : c.value === 12 ? 'C' : c.value === 13 ? 'D' : c.value === 14 ? 'R' : c.value) : (c.id ?? '');
  return `${v}${sym}`;
}
function cardColor(c: AnyCard): string {
  if (c?.excuse || c?.trump != null) return '#7C3AED';
  return (c?.suit === 'hearts' || c?.suit === 'diamonds' || c?.suit === 'H' || c?.suit === 'D' || c?.suit === 'coeur' || c?.suit === 'carreau') ? '#DC2626' : '#111827';
}

async function ensureToken(): Promise<string | null> {
  if (api.getAuthToken()) return api.getAuthToken();
  try { await api.createGuestSession(); } catch (e) { log.warn('guest failed', (e as any)?.message); }
  return api.getAuthToken();
}
async function refreshAuth(): Promise<string | null> {
  try { await api.refreshTokenAsync(); } catch { try { await api.createGuestSession(); } catch {} }
  return api.getAuthToken();
}

export default function TarotRoomScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const code = (roomCode || '').toString().toUpperCase();
  const router = useRouter();
  const { palette } = useTheme();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const tokenRef = useRef<string | null>(api.getAuthToken());

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      await ensureToken();
      if (cancelled) return;
      tokenRef.current = api.getAuthToken();
      const s = io(`${SOCKET_URL}/game`, { transports: ['websocket'], timeout: 8000, auth: (cb: (d: any) => void) => cb({ token: tokenRef.current }) });
      socketRef.current = s;
      s.on('connect', () => { setConnected(true); s.emit('game:join', { roomCode: code, gameType: 'tarot' }); });
      s.on('disconnect', () => setConnected(false));
      s.on('game:state', (snapshot: Snapshot) => setSnap(snapshot));
      s.on('game:error', (e: any) => log.warn('game:error', e?.message));
      s.on('connect_error', async (e: any) => { if (/token|auth|jwt|unauthor/i.test(e?.message || '')) { await refreshAuth(); tokenRef.current = api.getAuthToken(); } });
    })();
    return () => { cancelled = true; socketRef.current?.disconnect(); socketRef.current = null; };
  }, [code]);

  const me = snap?.players.find((p) => p.id === snap.youId) || null;
  const myIdx = snap && me ? snap.players.indexOf(me) : -1;
  const myTurn = !!(snap && me && snap.phase === 'playing' && snap.currentId === me.id);
  const myHand: AnyCard[] = me?.hand || [];

  const emitAction = useCallback((action: any) => { socketRef.current?.emit('game:action', { roomCode: code, action }); }, [code]);
  const playCard = useCallback((c: AnyCard) => { if (!myTurn) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); emitAction({ type: 'PLAY_CARD', cardId: c.id }); }, [myTurn, emitAction]);
  const rematch = useCallback(() => { socketRef.current?.emit('game:start', { roomCode: code }); }, [code]);
  useEffect(() => { if (snap?.phase === 'game_over') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }, [snap?.phase]);

  const styles = createStyles(palette);
  const isOver = snap?.phase === 'game_over';

  const Card = ({ c, onPress, dim }: { c: AnyCard; onPress?: () => void; dim?: boolean }) => (
    <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.card, { opacity: dim ? 0.5 : 1, transform: [{ translateY: onPress && pressed ? -2 : 0 }] }]}>
      <Text style={[styles.cardText, { color: cardColor(c) }]}>{cardText(c)}</Text>
    </Pressable>
  );

  return (
    <View style={styles.root}>
      <LinearGradient colors={palette.bgGradient} style={StyleSheet.absoluteFill} />
      <AppHeader title={APP_CONFIG.name} subtitle={`Salon ${code || '—'} ${connected ? '· 🟢' : '· 🔌'}`} showBack onBack={() => setShowQuit(true)} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.commsRow}>
          <TouchableOpacity onPress={() => setVoiceOpen((v) => !v)} style={[styles.commsBtn, voiceOpen && styles.commsBtnActive]}><Ionicons name="videocam" size={16} color="#fff" /><Text style={styles.commsBtnText}>📹 Appel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setChatOpen((v) => !v)} style={[styles.commsBtn, chatOpen && styles.commsBtnActive]}><Ionicons name="chatbubbles" size={16} color="#fff" /><Text style={styles.commsBtnText}>💬 Chat</Text></TouchableOpacity>
        </View>
        {voiceOpen && <View style={{ marginBottom: 12 }}><P2PCall compact roomCode={`tarot-${code}`} displayName={me?.name ?? 'Joueur'} authToken={api.getAuthToken() ?? ''} onClose={() => setVoiceOpen(false)} /></View>}
        {chatOpen && <View style={{ marginBottom: 12 }}><Chat roomId={`tarot-${code}`} token={api.getAuthToken()} onClose={() => setChatOpen(false)} /></View>}

        {snap && (
          <View style={styles.playersRow}>
            {snap.players.map((p) => {
              const active = snap.currentId === p.id && snap.phase === 'playing';
              return (
                <View key={p.id} style={[styles.playerCard, active && styles.playerCardActive]}>
                  <Text style={styles.playerName} numberOfLines={1}>{p.id === snap.youId ? '🧑 Vous' : (p.isBot ? '🤖 ' + p.name : '🧑 ' + p.name)}</Text>
                  <Text style={styles.playerScoreSub}>{p.count} cartes</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.table}>
          {!snap && <View style={styles.tableEmpty}><Text style={styles.tableEmptyText}>{connected ? 'Distribution…' : 'Connexion à la room…'}</Text></View>}
          {snap && (
            <>
              <Text style={styles.tableLabel}>Pli en cours</Text>
              <View style={styles.tableRow}>
                {(snap.trick || []).length === 0 && <Text style={styles.waitText}>—</Text>}
                {(snap.trick || []).map((e, i) => <Card key={i} c={e.card} />)}
              </View>
              {(snap.takerPoints != null) && <Text style={styles.tableLabel}>Preneur : {snap.takerPoints} pts · {snap.takerBouts ?? 0} bouts</Text>}
            </>
          )}
        </View>

        {snap && <Text style={[styles.eventText, { color: palette.textSecondary }]}>{isOver ? (snap.result || 'Partie terminée') : myTurn ? 'À toi de jouer une carte.' : (snap.lastEvent || '')}</Text>}

        {snap && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.handTitle, { color: palette.text }]}>Votre main ({myHand.length}) {myTurn ? '· à vous' : ''}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
              {myHand.map((c, i) => <Card key={c.id ?? i} c={c} onPress={() => playCard(c)} dim={!myTurn} />)}
              {myHand.length === 0 && <Text style={{ color: palette.textSecondary, padding: 12 }}>—</Text>}
            </ScrollView>
          </View>
        )}

        {snap && (snap.log || []).length > 0 && (
          <View style={styles.logBox}>{(snap.log || []).slice(0, 6).map((l, i) => <Text key={i} style={[styles.logLine, { color: i === 0 ? palette.text : palette.textSecondary }]} numberOfLines={1}>{l}</Text>)}</View>
        )}
      </ScrollView>

      <Modal visible={isOver} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <LinearGradient colors={['#0A0A1A', palette.card]} style={[styles.modalCard, { borderColor: GOLD }]}>
            <Text style={styles.modalEmoji}>🏆</Text>
            <Text style={styles.modalTitle}>{snap?.result || 'Fin de partie'}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity onPress={rematch} style={[styles.modalBtn, { backgroundColor: APP_CONFIG.primary }]}><Ionicons name="refresh" size={18} color="#fff" /><Text style={styles.modalBtnText}>Revanche</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}><Text style={styles.modalBtnText}>Quitter</Text></TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
      <Modal visible={showQuit} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={styles.modalTitle}>Quitter la partie ?</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
              <TouchableOpacity onPress={() => setShowQuit(false)} style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}><Text style={styles.modalBtnText}>Annuler</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setShowQuit(false); router.back(); }} style={[styles.modalBtn, { backgroundColor: '#EF4444' }]}><Text style={styles.modalBtnText}>Quitter</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(palette: ReturnType<typeof useTheme>['palette']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: palette.bg },
    body: { padding: 14, paddingBottom: 40 },
    commsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
    commsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10, backgroundColor: APP_CONFIG.primary },
    commsBtnActive: { backgroundColor: '#7C3AED' },
    commsBtnText: { color: '#fff', fontFamily: 'Inter-Bold', fontSize: 14 },
    playersRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    playerCard: { flex: 1, minWidth: 80, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 },
    playerCardActive: { backgroundColor: 'rgba(252,211,77,0.16)', borderColor: GOLD },
    playerName: { color: '#fff', fontSize: 11, fontFamily: 'Inter-Bold' },
    playerScoreSub: { color: palette.textSecondary, fontSize: 11, fontFamily: 'Inter-SemiBold', marginTop: 2 },
    table: { position: 'relative', minHeight: 150, borderRadius: 24, borderWidth: 5, borderColor: '#5b3a1a', backgroundColor: '#0E5A36', padding: 14, overflow: 'hidden', marginBottom: 12 },
    tableEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    tableEmptyText: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter-Bold' },
    tableLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 1, textTransform: 'uppercase', marginVertical: 6 },
    tableRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 64, alignItems: 'center', justifyContent: 'center' },
    waitText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' },
    card: { minWidth: 42, height: 60, borderRadius: 8, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, marginHorizontal: 3, borderWidth: 1, borderColor: 'rgba(0,0,0,0.2)' },
    cardText: { fontSize: 18, fontFamily: 'Inter-Black' },
    eventText: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 4, minHeight: 18 },
    handTitle: { fontSize: 14, fontFamily: 'Inter-Bold', marginBottom: 8 },
    handScroll: { paddingVertical: 12, paddingHorizontal: 4, gap: 6, minHeight: 84 },
    logBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14 },
    logLine: { fontSize: 12, fontFamily: 'Inter-Regular', paddingVertical: 1 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
    modalCard: { padding: 26, borderRadius: 20, alignItems: 'center', borderWidth: 2, minWidth: 290, maxWidth: '85%' },
    modalEmoji: { fontSize: 52, marginBottom: 6 },
    modalTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter-Black', letterSpacing: 0.3, textAlign: 'center' },
    modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    modalBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-Bold' },
  });
}
