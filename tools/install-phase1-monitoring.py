# -*- coding: utf-8 -*-
"""
install-phase1-monitoring.py — Replace stubs for Sentry, Analytics, RevenueCat
with real defensive integration code (no-op if SDK missing or not configured).

Files installed in all 11 apps:
  - src/utils/sentry.ts        — @sentry/react-native wrapper
  - src/utils/analytics.ts     — Firebase Analytics + segment-style events
  - src/utils/revenuecat.ts    — RevenueCat IAP wrapper
"""
from pathlib import Path

ROOT = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps-deploy")
MONO = Path(r"C:\Users\21266\Desktop\sdk52\SallyCards\apps\mobile")
APPS = ['belote', 'okey', 'quiestce', 'scopa', 'tarot', 'solitaire',
        'kdoub', 'poker', 'ronda', 'concentration', 'kantcopy']

SENTRY = '''/**
 * @file sentry.ts
 * @description Sentry error tracking — defensive (no-op if @sentry/react-native missing).
 * Setup: 1) Add @sentry/react-native to package.json
 *        2) Set EXPO_PUBLIC_SENTRY_DSN in .env.production
 *        3) Sentry.init({ dsn: SENTRY_DSN }) called automatically at module load
 */
let Sentry: any = null;
try { Sentry = require('@sentry/react-native'); } catch {}

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';

if (Sentry && DSN) {
  try {
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.1,
      enableInExpoDevelopment: false,
      debug: false,
      environment: process.env.EXPO_PUBLIC_BUILD_ENV || 'production',
    });
  } catch (e) {
    console.warn('[SENTRY] init failed:', (e as any)?.message);
  }
}

export function captureException(err: any, context?: Record<string, any>): void {
  if (Sentry?.captureException) {
    try { Sentry.captureException(err, { contexts: { custom: context || {} } }); }
    catch {}
  }
  console.error('[SENTRY-LOCAL]', err?.message ?? err, err?.stack);
}

export function captureMessage(msg: string, level: 'info'|'warning'|'error' = 'info'): void {
  if (Sentry?.captureMessage) {
    try { Sentry.captureMessage(msg, level); } catch {}
  }
  console.log(`[SENTRY-LOCAL/${level.toUpperCase()}]`, msg);
}

export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (Sentry?.setUser) {
    try { Sentry.setUser(user); } catch {}
  }
}

export function addBreadcrumb(category: string, message: string, data?: Record<string, any>): void {
  if (Sentry?.addBreadcrumb) {
    try {
      Sentry.addBreadcrumb({
        category, message, data,
        level: 'info',
        timestamp: Date.now() / 1000,
      });
    } catch {}
  }
}

export function sentryAvailable(): boolean {
  return !!Sentry && !!DSN;
}
'''

ANALYTICS = '''/**
 * @file analytics.ts
 * @description Firebase Analytics tracking — defensive.
 * Setup: 1) Install @react-native-firebase/app + @react-native-firebase/analytics
 *        2) Place google-services.json in android/app/
 *        3) Events queued and flushed automatically by Firebase SDK
 */
let analytics: any = null;
try {
  const a = require('@react-native-firebase/analytics');
  analytics = a.default ? a.default() : null;
} catch {}

type EventName =
  | 'app_open' | 'login' | 'sign_up' | 'guest_login'
  | 'onboarding_start' | 'onboarding_complete' | 'onboarding_skip'
  | 'game_start' | 'game_end' | 'game_win' | 'game_lose'
  | 'shop_open' | 'purchase_start' | 'purchase_complete' | 'purchase_failed'
  | 'achievement_unlock' | 'friend_invite' | 'tournament_join'
  | 'daily_reward_claim' | 'rewarded_ad_view' | 'screen_view';

export function track(event: EventName, params?: Record<string, any>): void {
  if (analytics?.logEvent) {
    try { analytics.logEvent(event, params || {}); } catch {}
  }
  // Local debug log
  if (__DEV__) console.log('[ANALYTICS]', event, params);
}

export function setUserId(id: string): void {
  if (analytics?.setUserId) {
    try { analytics.setUserId(id); } catch {}
  }
}

export function setUserProperty(key: string, value: string): void {
  if (analytics?.setUserProperty) {
    try { analytics.setUserProperty(key, value); } catch {}
  }
}

export function screenView(screenName: string, screenClass?: string): void {
  if (analytics?.logScreenView) {
    try {
      analytics.logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch {}
  }
  if (__DEV__) console.log('[ANALYTICS] screen:', screenName);
}

export function analyticsAvailable(): boolean { return !!analytics; }
'''

REVENUECAT = '''/**
 * @file revenuecat.ts
 * @description RevenueCat IAP wrapper — handles Coins packs + VIP subscription.
 * Setup: 1) Install react-native-purchases
 *        2) Set EXPO_PUBLIC_REVENUECAT_KEY_ANDROID + _IOS in .env.production
 *        3) Configure entitlements in RevenueCat dashboard:
 *           - "coins_100", "coins_500", "coins_1000", "coins_5000", "vip_monthly", "vip_yearly"
 */
import { useEffect, useState, useCallback } from 'react';

let Purchases: any = null;
try { Purchases = require('react-native-purchases').default; } catch {}

const RC_KEY = (() => {
  const Platform = require('react-native').Platform;
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID || '';
  return process.env.EXPO_PUBLIC_REVENUECAT_KEY_IOS || '';
})();

let initialized = false;
async function ensureInit(userId?: string) {
  if (!Purchases || !RC_KEY || initialized) return;
  try {
    await Purchases.configure({ apiKey: RC_KEY, appUserID: userId });
    initialized = true;
  } catch (e) {
    console.warn('[RC] init failed', (e as any)?.message);
  }
}

export interface CoinsPackage {
  identifier: string;        // RC product id e.g. "coins_500"
  coins: number;
  bonus: number;
  price: string;             // "9.99 €"
  isVIP?: boolean;
}

export async function listPackages(): Promise<CoinsPackage[]> {
  await ensureInit();
  if (!Purchases) return [];
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings?.current?.availablePackages || [];
    return current.map((p: any) => ({
      identifier: p.identifier,
      coins: parseInt(p.product?.identifier?.match(/coins_(\\d+)/)?.[1] || '0'),
      bonus: 0,
      price: p.product?.priceString || '?',
      isVIP: p.product?.identifier?.startsWith('vip_'),
    }));
  } catch (e) {
    console.warn('[RC] listPackages failed', (e as any)?.message);
    return [];
  }
}

export async function purchase(packageId: string): Promise<{ success: boolean; error?: string }> {
  await ensureInit();
  if (!Purchases) return { success: false, error: 'RevenueCat not configured' };
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.availablePackages?.find((p: any) => p.identifier === packageId);
    if (!pkg) return { success: false, error: 'Package not found' };
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true };
  } catch (e: any) {
    if (e.userCancelled) return { success: false, error: 'cancelled' };
    return { success: false, error: e?.message || 'Unknown error' };
  }
}

export function useVIPStatus() {
  const [isVIP, setIsVIP] = useState(false);
  const refresh = useCallback(async () => {
    await ensureInit();
    if (!Purchases) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setIsVIP(!!info?.entitlements?.active?.vip);
    } catch {}
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { isVIP, refresh };
}

export function revenueCatAvailable(): boolean { return !!Purchases && !!RC_KEY; }
'''


def install():
    for app in APPS:
        for root in [ROOT / f"sally-{app}", MONO / app]:
            if not root.exists(): continue
            target = root / "src" / "utils"
            target.mkdir(parents=True, exist_ok=True)
            (target / "sentry.ts").write_text(SENTRY, encoding='utf-8')
            (target / "analytics.ts").write_text(ANALYTICS, encoding='utf-8')
            (target / "revenuecat.ts").write_text(REVENUECAT, encoding='utf-8')
        print(f"  OK {app}: sentry.ts + analytics.ts + revenuecat.ts installed")

    # Add deps to package.json
    import json
    DEPS = {
        '@sentry/react-native': '^5.24.0',
        '@react-native-firebase/app': '^21.0.0',
        '@react-native-firebase/analytics': '^21.0.0',
        'react-native-purchases': '^8.0.0',
    }
    for app in APPS:
        f = ROOT / f"sally-{app}" / "package.json"
        if not f.exists(): continue
        j = json.loads(f.read_text(encoding='utf-8'))
        changed = False
        for k, v in DEPS.items():
            if k not in j['dependencies']:
                j['dependencies'][k] = v
                changed = True
        if changed:
            f.write_text(json.dumps(j, indent=2), encoding='utf-8')
    print(f"\nDONE — monitoring stack installed in {len(APPS)} apps")
    print(f"User action needed:")
    print(f"  1. Create Sentry project → set EXPO_PUBLIC_SENTRY_DSN")
    print(f"  2. Create Firebase project → drop google-services.json in android/app/")
    print(f"  3. Create RevenueCat project → set EXPO_PUBLIC_REVENUECAT_KEY_ANDROID/IOS")


if __name__ == "__main__":
    install()
