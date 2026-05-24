/**
 * @file game/[roomCode].tsx
 * @description Table Qui-est-ce ? multijoueur — client MINCE du gateway /game
 *   AUTORITATIF (gameType 'quiestce'). Questions + déductions gérées SERVEUR.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
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

const log = logger.scoped('QuiestceRoom');
const GOLD = '#FCD34D';

interface Perso { id: string; name?: string; emoji?: string; [k: string]: any }
interface Question { key: string; label: string }
interface SeatPlayer { id: string; name: string; isBot: boolean; secret?: Perso | string; myCandidates?: string[]; candidates?: string[] }
interface Snapshot {
  youId: string; phase: string; turn?: number; currentId: string | null;
  personnages?: Perso[]; characters?: Perso[]; suspects?: Perso[];
  questions?: Question[]; players: SeatPlayer[];
  winner?: any; lastEvent?: string; log?: string[];
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

export default function QuiestceRoomScreen() {
  const { roomCode } = useLocalSearchParams<{ roomCode: string }>();
  const code = (roomCode || '').toString().toUpperCase();
  const router = useRouter();
  const { palette } = useTheme();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const [guessMode, setGuessMode] = useState(false);
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
      s.on('connect', () => { setConnected(true); s.emit('game:join', { roomCode: code, gameType: 'quiestce' }); });
      s.on('disconnect', () => setConnected(false));
      s.on('game:state', (snapshot: Snapshot) => setSnap(snapshot));
      s.on('game:error', (e: any) => log.warn('game:error', e?.message));
      s.on('connect_error', async (e: any) => { if (/token|auth|jwt|unauthor/i.test(e?.message || '')) { await refreshAuth(); tokenRef.current = api.getAuthToken(); } });
    })();
    return () => { cancelled = true; socketRef.current?.disconnect(); socketRef.current = null; };
  }, [code]);

  const me = snap?.players.find((p) => p.id === snap.youId) || null;
  const myTurn = !!(snap && me && snap.currentId === me.id && snap.phase !== 'over' && snap.phase !== 'game_over');
  const isOver = !!snap && (snap.phase === 'over' || snap.phase === 'game_over' || snap.winner != null);
  const persos: Perso[] = snap?.personnages || snap?.characters || snap?.suspects || [];
  const candidates: string[] = (me?.myCandidates || me?.candidates || persos.map((p) => p.id)) as string[];
  const secret = me?.secret;
  const secretObj: Perso | undefined = typeof secret === 'string' ? persos.find((p) => p.id === secret) : (secret as Perso | undefined);

  const emitAction = useCallback((action: any) => { socketRef.current?.emit('game:action', { roomCode: code, action }); }, [code]);
  const ask = useCallback((key: string) => { if (!myTurn) return; Haptics.selectionAsync().catch(() => {}); emitAction({ type: 'ASK', key }); }, [myTurn, emitAction]);
  const guess = useCallback((persoId: string) => { if (!myTurn) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); emitAction({ type: 'GUESS', persoId }); setGuessMode(false); }, [myTurn, emitAction]);
  const rematch = useCallback(() => { socketRef.current?.emit('game:start', { roomCode: code }); }, [code]);
  useEffect(() => { if (isOver) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}); }, [isOver]);

  const styles = createStyles(palette);

  return (
    <View style={styles.root}>
      <LinearGradient colors={palette.bgGradient} style={StyleSheet.absoluteFill} />
      <AppHeader title={APP_CONFIG.name} subtitle={`Salon ${code || '—'} ${connected ? '· 🟢' : '· 🔌'}`} showBack onBack={() => setShowQuit(true)} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.commsRow}>
          <TouchableOpacity onPress={() => setVoiceOpen((v) => !v)} style={[styles.commsBtn, voiceOpen && styles.commsBtnActive]}><Ionicons name="videocam" size={16} color="#fff" /><Text style={styles.commsBtnText}>📹 Appel</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setChatOpen((v) => !v)} style={[styles.commsBtn, chatOpen && styles.commsBtnActive]}><Ionicons name="chatbubbles" size={16} color="#fff" /><Text style={styles.commsBtnText}>💬 Chat</Text></TouchableOpacity>
        </View>
        {voiceOpen && <View style={{ marginBottom: 12 }}><P2PCall compact roomCode={`quiestce-${code}`} displayName={me?.name ?? 'Joueur'} authToken={api.getAuthToken() ?? ''} onClose={() => setVoiceOpen(false)} /></View>}
        {chatOpen && <View style={{ marginBottom: 12 }}><Chat roomId={`quiestce-${code}`} token={api.getAuthToken()} onClose={() => setChatOpen(false)} /></View>}

        {secretObj && (
          <View style={styles.secretBox}>
            <Text style={styles.secretLabel}>VOTRE PERSONNAGE SECRET</Text>
            <Text style={styles.secretName}>{secretObj.emoji || '🕵️'} {secretObj.name || secretObj.id}</Text>
          </View>
        )}

        {snap && <Text style={[styles.eventText, { color: palette.textSecondary }]}>{isOver ? (snap.lastEvent || 'Partie terminée') : myTurn ? (guessMode ? 'Touche un suspect pour deviner.' : 'Pose une question, ou « Deviner ».') : (snap.lastEvent || 'Tour de l’adversaire…')}</Text>}

        {/* Grille de suspects */}
        {!snap && <View style={styles.empty}><Text style={styles.emptyText}>{connected ? 'Préparation…' : 'Connexion à la room…'}</Text></View>}
        {persos.length > 0 && (
          <View style={styles.grid}>
            {persos.map((p) => {
              const active = candidates.includes(p.id);
              return (
                <TouchableOpacity key={p.id} activeOpacity={0.8} disabled={!(myTurn && guessMode)} onPress={() => guess(p.id)}
                  style={[styles.perso, !active && styles.persoOut, myTurn && guessMode && active && styles.persoGuess]}>
                  <Text style={styles.persoEmoji}>{p.emoji || '🙂'}</Text>
                  <Text style={styles.persoName} numberOfLines={1}>{p.name || p.id}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Questions */}
        {snap && myTurn && !guessMode && (snap.questions || []).length > 0 && (
          <View style={{ marginTop: 14 }}>
            <Text style={[styles.handTitle, { color: palette.text }]}>Questions</Text>
            <View style={styles.qWrap}>
              {(snap.questions || []).map((q) => (
                <TouchableOpacity key={q.key} onPress={() => ask(q.key)} style={styles.qChip}><Text style={styles.qChipText}>{q.label}</Text></TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bouton Deviner */}
        {snap && myTurn && (
          <TouchableOpacity onPress={() => setGuessMode((g) => !g)} style={[styles.actBtn, { backgroundColor: guessMode ? '#EF4444' : '#16A34A', marginTop: 14 }]}>
            <Text style={styles.actText}>{guessMode ? 'Annuler la devinette' : '🎯 Deviner un personnage'}</Text>
          </TouchableOpacity>
        )}

        {snap && (snap.log || []).length > 0 && (
          <View style={styles.logBox}>{(snap.log || []).slice(0, 6).map((l, i) => <Text key={i} style={[styles.logLine, { color: i === 0 ? palette.text : palette.textSecondary }]} numberOfLines={1}>{l}</Text>)}</View>
        )}
      </ScrollView>

      <Modal visible={isOver} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <LinearGradient colors={['#0A0A1A', palette.card]} style={[styles.modalCard, { borderColor: GOLD }]}>
            <Text style={styles.modalEmoji}>🏆</Text>
            <Text style={styles.modalTitle}>{snap?.lastEvent || 'Fin de partie'}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity onPress={rematch} style={[styles.modalBtn, { backgroundColor: APP_CONFIG.primary }]}><Ionicons name="refresh" size={18} color="#fff" /><Text style={styles.modalBtnText}>Rejouer</Text></TouchableOpacity>
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
    secretBox: { backgroundColor: 'rgba(124,58,237,0.18)', borderWidth: 1, borderColor: '#A78BFA', borderRadius: 12, padding: 12, marginBottom: 10, alignItems: 'center' },
    secretLabel: { color: palette.textSecondary, fontSize: 10, fontFamily: 'Inter-Bold', letterSpacing: 1 },
    secretName: { color: '#fff', fontSize: 18, fontFamily: 'Inter-Black', marginTop: 2 },
    eventText: { fontSize: 13, fontFamily: 'Inter-SemiBold', marginBottom: 10, minHeight: 18 },
    empty: { padding: 30, alignItems: 'center' },
    emptyText: { color: palette.textSecondary, fontFamily: 'Inter-Bold' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    perso: { width: '22%', aspectRatio: 0.78, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', padding: 4 },
    persoOut: { opacity: 0.28 },
    persoGuess: { borderColor: '#16A34A', backgroundColor: 'rgba(22,163,74,0.2)' },
    persoEmoji: { fontSize: 30 },
    persoName: { color: '#fff', fontSize: 9, fontFamily: 'Inter-SemiBold', marginTop: 2 },
    handTitle: { fontSize: 14, fontFamily: 'Inter-Bold', marginBottom: 8 },
    qWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    qChip: { backgroundColor: 'rgba(252,211,77,0.16)', borderWidth: 1, borderColor: 'rgba(252,211,77,0.4)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
    qChipText: { color: GOLD, fontFamily: 'Inter-Bold', fontSize: 12 },
    actBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 10 },
    actText: { color: '#fff', fontFamily: 'Inter-Bold', fontSize: 13 },
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
