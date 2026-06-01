/**
 * @file game/[roomCode].tsx
 * @description Table Scopa multijoueur TEMPS RÉEL — client MINCE du gateway
 *   /game AUTORITATIF. Pendant RN de apps/web/app/scopa/room/[code]/page.tsx.
 *   gameType 'scopa' : on émet game:join/game:action, on rend game:state.
 *   Bots + transitions (capture, scope, manche) gérés CÔTÉ SERVEUR.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { io, Socket } from 'socket.io-client';
import AppHeader from '../../src/components/AppHeader';
import AnimatedCard from '../../src/components/AnimatedCard';
import P2PCall from '../../src/components/P2PCall';
import Chat from '../../src/components/Chat';
import { useTheme } from '../../src/contexts/AppProviders';
import { logger } from '../../src/utils/logger';
import { APP_CONFIG } from '../../src/config/app.config';
import { SOCKET_URL } from '../../shared/api';
import * as api from '../../shared/api';

const log = logger.scoped('ScopaRoom');
const GOLD = '#FCD34D';

// ── Forme d'état serveur (scopaView) — cartes italiennes ─────────────────────
type SSuit = 'spade' | 'coppe' | 'bastoni' | 'denari';
interface ServerCard { id: string; suit: SSuit; value: number }
interface SeatPlayer {
  id: string; name: string; isBot: boolean;
  capturedCount: number; scope: number; handCount: number; hand?: ServerCard[];
}
interface Snapshot {
  youId: string;
  phase: 'playing' | 'round_end' | 'game_over';
  turn: number;
  currentId: string | null;
  table: ServerCard[];
  deckCount?: number;
  scores?: number[];
  target: number;
  roundNumber: number;
  winner: number | null;
  lastEvent?: string;
  log?: string[];
  players: SeatPlayer[];
}

// Cartes italiennes serveur → clés d'assets espagnols (mêmes valeurs/PNG).
const SUIT_LONG: Record<SSuit, string> = { spade: 'espadas', coppe: 'copas', bastoni: 'bastos', denari: 'oros' };
function toLocalCard(c: ServerCard) {
  return { id: `${String(c.value).padStart(2, '0')}-${SUIT_LONG[c.suit] || 'oros'}`, suit: SUIT_LONG[c.suit], value: c.value } as any;
}

async function ensureToken(): Promise<string | null> {
  if (api.getAuthToken()) return api.getAuthToken();
  try { await api.createGuestSession(); } catch (e) { log.warn('guest session failed', (e as any)?.message); }
  return api.getAuthToken();
}
async function refreshAuth(): Promise<string | null> {
  try { await api.refreshTokenAsync(); } catch { try { await api.createGuestSession(); } catch {} }
  return api.getAuthToken();
}

export default function ScopaRoomScreen() {
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
      s.on('connect', () => { setConnected(true); log.explain(`/game connecté → join scopa:${code}`); s.emit('game:join', { roomCode: code, gameType: 'scopa' }); });
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
  const myHand: ServerCard[] = me?.hand || [];
  const table: ServerCard[] = snap?.table || [];

  const emitAction = useCallback((action: any) => { socketRef.current?.emit('game:action', { roomCode: code, action }); }, [code]);
  const playCard = useCallback((cardId: string) => { if (!myTurn) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); emitAction({ type: 'PLAY_CARD', cardId }); }, [myTurn, emitAction]);
  const rematch = useCallback(() => { socketRef.current?.emit('game:start', { roomCode: code }); }, [code]);

  useEffect(() => { if (snap?.phase === 'game_over') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }, [snap?.phase]);

  const styles = createStyles(palette);
  const isOver = snap?.phase === 'game_over';
  const iWin = isOver && snap?.winner === myIdx;

  return (
    <View style={styles.root}>
      <LinearGradient colors={palette.bgGradient} style={StyleSheet.absoluteFill} />
      <AppHeader title={APP_CONFIG.name} subtitle={`Salon ${code || '—'} ${connected ? '· 🟢' : '· 🔌'}`} showBack onBack={() => setShowQuit(true)} />

      <ScrollView contentContainerStyle={styles.body}>
        {/* Comms : appel audio/vidéo + chat */}
        <View style={styles.commsRow}>
          <TouchableOpacity onPress={() => setVoiceOpen((v) => !v)} style={[styles.commsBtn, voiceOpen && styles.commsBtnActive]}>
            <Ionicons name="videocam" size={16} color="#fff" /><Text style={styles.commsBtnText}>📹 Appel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setChatOpen((v) => !v)} style={[styles.commsBtn, chatOpen && styles.commsBtnActive]}>
            <Ionicons name="chatbubbles" size={16} color="#fff" /><Text style={styles.commsBtnText}>💬 Chat</Text>
          </TouchableOpacity>
        </View>
        {voiceOpen && <View style={{ marginBottom: 12 }}><P2PCall compact roomCode={`scopa-${code}`} displayName={me?.name ?? 'Joueur'} authToken={api.getAuthToken() ?? ''} onClose={() => setVoiceOpen(false)} /></View>}
        {chatOpen && <View style={{ marginBottom: 12 }}><Chat roomId={`scopa-${code}`} token={api.getAuthToken()} onClose={() => setChatOpen(false)} /></View>}

        {/* Joueurs / scores */}
        {snap && (
          <View style={styles.playersRow}>
            {snap.players.map((p, i) => {
              const active = snap.currentId === p.id && snap.phase === 'playing';
              return (
                <View key={p.id} style={[styles.playerCard, active && styles.playerCardActive]}>
                  <Text style={styles.playerName} numberOfLines={1}>
                    {p.id === snap.youId ? '🧑 Vous' : (p.isBot ? '🤖 ' + p.name : '🧑 ' + p.name)}
                  </Text>
                  <Text style={styles.playerScore}>
                    {snap.scores ? snap.scores[i] ?? 0 : 0} <Text style={styles.playerScoreSub}>/ {snap.target} · {p.capturedCount}🃏 · {p.scope}🧹</Text>
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Table */}
        <View style={styles.table}>
          {!snap && <View style={styles.tableEmpty}><Text style={styles.tableEmptyText}>{connected ? 'Distribution…' : 'Connexion à la room…'}</Text></View>}
          {snap && (
            <>
              <Text style={styles.tableLabel}>Table ({table.length}){snap.deckCount != null ? ` · pioche ${snap.deckCount}` : ''}</Text>
              <View style={styles.tableRow}>
                {table.length === 0 && <Text style={styles.waitText}>Table vide</Text>}
                {table.map((c) => <AnimatedCard key={c.id} card={toLocalCard(c)} size="small" />)}
              </View>
            </>
          )}
        </View>

        {/* Bandeau d'événement */}
        {snap && (
          <Text style={[styles.eventText, { color: snap.phase === 'round_end' ? GOLD : palette.textSecondary }]}>
            {snap.phase === 'game_over' ? (snap.lastEvent || 'Partie terminée') : myTurn ? 'À toi : pose une carte (capture si somme/valeur correspond).' : (snap.lastEvent || '')}
          </Text>
        )}

        {/* Ma main */}
        {snap && (
          <View style={{ marginTop: 8 }}>
            <Text style={[styles.handTitle, { color: palette.text }]}>Votre main ({myHand.length}) {myTurn ? '· à vous de jouer' : ''}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
              {myHand.map((c) => {
                const canCapture = table.some((t) => t.value === c.value);
                return (
                  <Pressable key={c.id} onPress={() => playCard(c.id)} disabled={!myTurn}
                    style={({ pressed }) => [styles.handSlot, myTurn && canCapture && styles.handSlotCapture, { opacity: !myTurn ? 0.6 : 1, transform: [{ translateY: myTurn && pressed ? -2 : myTurn ? -6 : 0 }] }]}>
                    <AnimatedCard card={toLocalCard(c)} size="medium" />
                  </Pressable>
                );
              })}
              {myHand.length === 0 && <Text style={{ color: palette.textSecondary, padding: 12 }}>—</Text>}
            </ScrollView>
          </View>
        )}

        {/* Journal */}
        {snap && (snap.log || []).length > 0 && (
          <View style={styles.logBox}>
            {(snap.log || []).slice(0, 6).map((l, i) => <Text key={i} style={[styles.logLine, { color: i === 0 ? palette.text : palette.textSecondary }]} numberOfLines={1}>{l}</Text>)}
          </View>
        )}
      </ScrollView>

      {/* Fin de partie */}
      <Modal visible={isOver} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <LinearGradient colors={['#0A0A1A', palette.card]} style={[styles.modalCard, { borderColor: GOLD }]}>
            <Text style={styles.modalEmoji}>{iWin ? '🏆' : '🙃'}</Text>
            <Text style={styles.modalTitle}>{iWin ? 'Vous gagnez !' : `${snap && snap.winner != null ? snap.players[snap.winner]?.name : ''} gagne`}</Text>
            <Text style={[styles.modalSub, { color: palette.textSecondary }]} numberOfLines={2}>
              {snap?.players.map((p, i) => `${p.name}: ${snap.scores ? snap.scores[i] ?? 0 : p.capturedCount}`).join(' · ')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity onPress={rematch} style={[styles.modalBtn, { backgroundColor: APP_CONFIG.primary }]}><Ionicons name="refresh" size={18} color="#fff" /><Text style={styles.modalBtnText}>Revanche</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => router.back()} style={[styles.modalBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}><Text style={styles.modalBtnText}>Quitter</Text></TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Quitter */}
      <Modal visible={showQuit} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <Text style={styles.modalTitle}>Quitter la partie ?</Text>
            <Text style={[styles.modalSub, { color: palette.textSecondary }]}>Vous pourrez la rejoindre avec le même code.</Text>
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
    playerCard: { flex: 1, minWidth: 110, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 10 },
    playerCardActive: { backgroundColor: 'rgba(252,211,77,0.16)', borderColor: GOLD },
    playerName: { color: '#fff', fontSize: 11, fontFamily: 'Inter-Bold' },
    playerScore: { color: GOLD, fontFamily: 'Inter-Black', fontSize: 21, marginTop: 2 },
    playerScoreSub: { color: palette.textSecondary, fontSize: 10, fontFamily: 'Inter-SemiBold' },
    table: { position: 'relative', minHeight: 150, borderRadius: 24, borderWidth: 5, borderColor: '#5b3a1a', backgroundColor: '#0E5A36', padding: 14, overflow: 'hidden', marginBottom: 12 },
    tableEmpty: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    tableEmptyText: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter-Bold' },
    tableLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, fontFamily: 'Inter-Bold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
    tableRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, minHeight: 78, alignItems: 'center', justifyContent: 'center' },
    waitText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic' },
    eventText: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 4, minHeight: 18 },
    handTitle: { fontSize: 14, fontFamily: 'Inter-Bold', marginBottom: 8 },
    handScroll: { paddingVertical: 12, paddingHorizontal: 4, gap: 8, minHeight: 120 },
    handSlot: { marginHorizontal: 4, borderRadius: 8 },
    handSlotCapture: { shadowColor: '#22C55E', shadowOpacity: 0.9, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
    logBox: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12, marginTop: 14 },
    logLine: { fontSize: 12, fontFamily: 'Inter-Regular', paddingVertical: 1 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
    modalCard: { padding: 26, borderRadius: 20, alignItems: 'center', borderWidth: 2, minWidth: 290, maxWidth: '85%' },
    modalEmoji: { fontSize: 52, marginBottom: 6 },
    modalTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter-Black', letterSpacing: 0.3, textAlign: 'center' },
    modalSub: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginTop: 6, textAlign: 'center' },
    modalBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
    modalBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter-Bold' },
  });
}
