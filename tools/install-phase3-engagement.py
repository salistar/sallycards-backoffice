# -*- coding: utf-8 -*-
"""
install-phase3-engagement.py — Daily reward + Achievements + Friends + Push + Tournament UI.

Frontend components, defensive backend (calls shared/api.ts methods that may not exist yet).
"""
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps-deploy")
APPS = ['belote', 'okey', 'quiestce', 'scopa', 'tarot', 'solitaire',
        'kdoub', 'poker', 'ronda', 'concentration', 'kantcopy']

# 1. Daily reward state machine + modal
DAILY_REWARD = '''/**
 * @file useDailyReward.ts
 * @description 7-day streak rewards. Persists last-claim date in AsyncStorage.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DAILY_REWARDS = [50, 100, 150, 200, 300, 500, 1000];
const KEY_LAST_CLAIM = 'daily:lastClaimISO';
const KEY_STREAK = 'daily:streak';

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function yesterdayISO(): string {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function useDailyReward() {
  const [streak, setStreak] = useState(0);
  const [claimable, setClaimable] = useState(false);
  const [todaysReward, setTodaysReward] = useState(50);

  const refresh = useCallback(async () => {
    const last = await AsyncStorage.getItem(KEY_LAST_CLAIM);
    const rawStreak = parseInt((await AsyncStorage.getItem(KEY_STREAK)) || '0', 10);
    const today = todayISO();
    if (last === today) {
      setClaimable(false);
      setStreak(rawStreak);
    } else {
      const wasYesterday = last === yesterdayISO();
      const newStreak = wasYesterday ? Math.min(rawStreak, 7) : 0;
      setClaimable(true);
      setStreak(newStreak);
      setTodaysReward(DAILY_REWARDS[newStreak % 7]);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const claim = useCallback(async (): Promise<{ coins: number; newStreak: number }> => {
    const newStreak = (streak + 1) % 8 || 1;
    await AsyncStorage.setItem(KEY_LAST_CLAIM, todayISO());
    await AsyncStorage.setItem(KEY_STREAK, String(newStreak));
    setStreak(newStreak);
    setClaimable(false);
    return { coins: todaysReward, newStreak };
  }, [streak, todaysReward]);

  return { streak, claimable, todaysReward, rewards: DAILY_REWARDS, claim, refresh };
}
'''

# 2. Achievements registry + hook
ACHIEVEMENTS = '''/**
 * @file useAchievements.ts
 * @description 30+ achievement definitions per app + unlock tracking.
 */
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AchievementCategory = 'onboarding' | 'gameplay' | 'social' | 'mastery' | 'spending' | 'special';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  title: string;
  description: string;
  icon: string;        // emoji or ionicon name
  coins: number;       // reward
  threshold: number;   // numeric target (e.g. wins=10)
}

export const ACHIEVEMENTS: Achievement[] = [
  // Onboarding (5)
  { id: 'first_launch', category: 'onboarding', title: 'Premier pas', description: 'Lance l app pour la première fois', icon: '👋', coins: 50, threshold: 1 },
  { id: 'lang_picked', category: 'onboarding', title: 'Polyglotte', description: 'Choisis une langue', icon: '🌍', coins: 25, threshold: 1 },
  { id: 'tutorial_done', category: 'onboarding', title: 'Apprenti', description: 'Termine le tutoriel', icon: '📖', coins: 100, threshold: 1 },
  { id: 'profile_created', category: 'onboarding', title: 'Bienvenue', description: 'Crée ton profil', icon: '👤', coins: 50, threshold: 1 },
  { id: 'avatar_set', category: 'onboarding', title: 'Style', description: 'Personnalise ton avatar', icon: '🎨', coins: 30, threshold: 1 },

  // Gameplay (10)
  { id: 'first_win', category: 'gameplay', title: 'Première victoire', description: 'Gagne ta première partie', icon: '🏆', coins: 100, threshold: 1 },
  { id: 'win_10', category: 'gameplay', title: 'Habitué', description: 'Gagne 10 parties', icon: '🎯', coins: 250, threshold: 10 },
  { id: 'win_50', category: 'gameplay', title: 'Confirmé', description: 'Gagne 50 parties', icon: '🥇', coins: 500, threshold: 50 },
  { id: 'win_100', category: 'gameplay', title: 'Pro', description: 'Gagne 100 parties', icon: '👑', coins: 1500, threshold: 100 },
  { id: 'streak_3', category: 'gameplay', title: 'En feu', description: '3 victoires de suite', icon: '🔥', coins: 200, threshold: 3 },
  { id: 'streak_5', category: 'gameplay', title: 'Imbattable', description: '5 victoires de suite', icon: '⚡', coins: 500, threshold: 5 },
  { id: 'play_100', category: 'gameplay', title: 'Marathon', description: 'Joue 100 parties', icon: '🏃', coins: 300, threshold: 100 },
  { id: 'play_500', category: 'gameplay', title: 'Mordu', description: 'Joue 500 parties', icon: '🎮', coins: 1000, threshold: 500 },
  { id: 'perfect_game', category: 'gameplay', title: 'Sans faute', description: 'Gagne sans perdre de carte', icon: '✨', coins: 400, threshold: 1 },
  { id: 'comeback', category: 'gameplay', title: 'Comeback', description: 'Gagne en étant largement mené', icon: '↩️', coins: 300, threshold: 1 },

  // Social (5)
  { id: 'invite_friend', category: 'social', title: 'Réseau', description: 'Invite 1 ami', icon: '✉️', coins: 100, threshold: 1 },
  { id: 'invite_5', category: 'social', title: 'Influenceur', description: 'Invite 5 amis', icon: '📣', coins: 500, threshold: 5 },
  { id: 'play_with_friend', category: 'social', title: 'Partenaire', description: 'Joue avec un ami', icon: '🤝', coins: 150, threshold: 1 },
  { id: 'share_win', category: 'social', title: 'Vantard', description: 'Partage une victoire', icon: '📤', coins: 50, threshold: 1 },
  { id: 'voice_chat', category: 'social', title: 'Conversation', description: 'Utilise le voice chat', icon: '🎤', coins: 100, threshold: 1 },

  // Mastery (5)
  { id: 'elo_1100', category: 'mastery', title: 'Bronze', description: 'Atteins 1100 ELO', icon: '🥉', coins: 200, threshold: 1100 },
  { id: 'elo_1300', category: 'mastery', title: 'Argent', description: 'Atteins 1300 ELO', icon: '🥈', coins: 500, threshold: 1300 },
  { id: 'elo_1500', category: 'mastery', title: 'Or', description: 'Atteins 1500 ELO', icon: '🥇', coins: 1000, threshold: 1500 },
  { id: 'elo_1800', category: 'mastery', title: 'Diamant', description: 'Atteins 1800 ELO', icon: '💎', coins: 2500, threshold: 1800 },
  { id: 'top_100', category: 'mastery', title: 'Top 100', description: 'Atteins le top 100 mondial', icon: '🌐', coins: 5000, threshold: 100 },

  // Spending (3)
  { id: 'first_purchase', category: 'spending', title: 'Soutien', description: 'Achète ton premier pack', icon: '💰', coins: 100, threshold: 1 },
  { id: 'vip_join', category: 'spending', title: 'VIP', description: 'Active Sally Plus VIP', icon: '👑', coins: 500, threshold: 1 },
  { id: 'big_spender', category: 'spending', title: 'Mécène', description: 'Achète 5 packs', icon: '💎', coins: 1000, threshold: 5 },

  // Special (2)
  { id: 'daily_7', category: 'special', title: 'Régulier', description: 'Streak quotidien de 7 jours', icon: '📅', coins: 1000, threshold: 7 },
  { id: 'all_apps', category: 'special', title: 'Collectionneur', description: 'Joue aux 11 jeux Sally', icon: '🃏', coins: 5000, threshold: 11 },
];

const KEY_UNLOCKED = 'achievements:unlocked';
const KEY_PROGRESS = 'achievements:progress';

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<Record<string, number>>({});

  const refresh = useCallback(async () => {
    const u = await AsyncStorage.getItem(KEY_UNLOCKED);
    const p = await AsyncStorage.getItem(KEY_PROGRESS);
    setUnlocked(new Set(u ? JSON.parse(u) : []));
    setProgress(p ? JSON.parse(p) : {});
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const incrementProgress = useCallback(async (id: string, by: number = 1) => {
    const newProgress = { ...progress, [id]: (progress[id] || 0) + by };
    await AsyncStorage.setItem(KEY_PROGRESS, JSON.stringify(newProgress));
    setProgress(newProgress);
    // Check unlock
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (ach && newProgress[id] >= ach.threshold && !unlocked.has(id)) {
      const newUnlocked = new Set(unlocked); newUnlocked.add(id);
      await AsyncStorage.setItem(KEY_UNLOCKED, JSON.stringify([...newUnlocked]));
      setUnlocked(newUnlocked);
      return ach;  // return unlocked achievement for toast
    }
    return null;
  }, [progress, unlocked]);

  const unlockOnce = useCallback(async (id: string) => {
    if (unlocked.has(id)) return null;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return null;
    const newUnlocked = new Set(unlocked); newUnlocked.add(id);
    await AsyncStorage.setItem(KEY_UNLOCKED, JSON.stringify([...newUnlocked]));
    setUnlocked(newUnlocked);
    return ach;
  }, [unlocked]);

  return { ACHIEVEMENTS, unlocked, progress, incrementProgress, unlockOnce, refresh };
}
'''

# 3. Friends + Invite (deeplink WhatsApp)
FRIENDS = '''/**
 * @file useFriends.ts
 * @description Friend list + invite via WhatsApp deep link.
 */
import { useState, useEffect, useCallback } from 'react';
import { Linking, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Friend {
  id: string;
  username: string;
  avatar?: string;
  elo: number;
  online: boolean;
}

const KEY_FRIENDS = 'friends:list';

export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      // TODO: fetch from /api/friends when backend ready
      const cached = await AsyncStorage.getItem(KEY_FRIENDS);
      setFriends(cached ? JSON.parse(cached) : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const inviteViaWhatsApp = useCallback(async (referralCode: string, appName: string) => {
    const message = `Rejoins-moi sur Sally ${appName} ! Utilise mon code ${referralCode} pour 100 coins gratuits : https://sallycards.salistar.com/r/${referralCode}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback to native share sheet
      await Share.share({ message });
    }
  }, []);

  const inviteViaShare = useCallback(async (referralCode: string, appName: string) => {
    const message = `Rejoins-moi sur Sally ${appName} ! Code ${referralCode}: https://sallycards.salistar.com/r/${referralCode}`;
    return await Share.share({
      message,
      title: `Sally ${appName}`,
    });
  }, []);

  return { friends, loading, refresh, inviteViaWhatsApp, inviteViaShare };
}
'''

# 4. Push notifications real
PUSH = '''/**
 * @file push-notifications.ts
 * @description Real expo-notifications integration replacing the stubs.
 */
import { useEffect } from 'react';

let Notifications: any = null;
try { Notifications = require('expo-notifications'); } catch {}

const DAILY_REMINDER_HOUR = 20; // 8 PM local
const DAILY_REMINDER_MINUTE = 0;

export async function setupDailyChallengeNotification(): Promise<{
  scheduled: boolean; reason?: string;
}> {
  if (!Notifications) return { scheduled: false, reason: 'expo-notifications not installed' };
  try {
    const perm = await Notifications.requestPermissionsAsync();
    if (!perm.granted) return { scheduled: false, reason: 'Permissions refusées' };

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Cancel previous
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule daily reminder at 20:00 local
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Ton défi quotidien t\\'attend !',
        body: 'Joue une partie pour gagner +50 pièces',
        sound: true,
      },
      trigger: {
        hour: DAILY_REMINDER_HOUR,
        minute: DAILY_REMINDER_MINUTE,
        repeats: true,
      },
    });
    return { scheduled: true };
  } catch (e) {
    return { scheduled: false, reason: (e as any)?.message };
  }
}

export async function cancelDailyChallengeNotification(): Promise<void> {
  if (!Notifications) return;
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

export async function sendLocalTestNotification(title: string, body: string): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: { seconds: 1 },
    });
  } catch {}
}

export function pushNotificationsAvailable(): boolean { return !!Notifications; }

export function usePushSetup() {
  useEffect(() => {
    setupDailyChallengeNotification().catch(() => {});
  }, []);
}
'''

# 5. Tournament UI
TOURNAMENT = '''/**
 * @file useTournament.ts
 * @description Weekly tournament state — bracket + standings.
 */
import { useState, useEffect, useCallback } from 'react';

export interface TournamentPlayer {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  position?: number;
}

export interface Tournament {
  id: string;
  name: string;
  startsAt: string;       // ISO
  endsAt: string;
  entryFeeCoins: number;
  prizePoolCoins: number;
  maxPlayers: number;
  status: 'open' | 'live' | 'finished';
  players: TournamentPlayer[];
}

export function useTournament(appName: string) {
  const [current, setCurrent] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: fetch /api/tournaments/current?app={appName}
      // Mock data for now
      setCurrent({
        id: 'mock-t-1',
        name: `Tournoi Hebdo Sally ${appName}`,
        startsAt: new Date().toISOString(),
        endsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
        entryFeeCoins: 100,
        prizePoolCoins: 3200,
        maxPlayers: 32,
        status: 'open',
        players: [],
      });
    } finally {
      setLoading(false);
    }
  }, [appName]);

  useEffect(() => { refresh(); }, [refresh]);

  const join = useCallback(async () => {
    // TODO: POST /api/tournaments/:id/join (deducts entry fee + adds player)
    return { joined: true };
  }, []);

  return { current, loading, refresh, join };
}
'''

FILES = {
    'src/utils/useDailyReward.ts':    DAILY_REWARD,
    'src/utils/useAchievements.ts':   ACHIEVEMENTS,
    'src/utils/useFriends.ts':        FRIENDS,
    'src/game/push-notifications.ts': PUSH,
    'src/utils/useTournament.ts':     TOURNAMENT,
}

for app in APPS:
    for rel, content in FILES.items():
        dest = ROOT / f"sally-{app}" / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding='utf-8')
    print(f"  OK {app}: 5 engagement files installed")

print(f"\nDONE Phase 3 — {len(APPS)} apps × {len(FILES)} files")
