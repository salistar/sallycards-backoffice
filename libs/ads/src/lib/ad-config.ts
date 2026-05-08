import { Platform } from 'react-native';

/**
 * Ad unit IDs for SallyCards apps.
 *
 * In development (__DEV__ === true), Google-provided test IDs are used.
 * In production, replace the placeholder values with real AdMob unit IDs.
 *
 * IMPORTANT: Never use real ad unit IDs during development.
 * Doing so may result in your AdMob account being suspended.
 */
export const AD_UNITS = {
  banner: {
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/6300978111'
      : 'ca-app-pub-XXXXX/BANNER_ANDROID',
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/2934735716'
      : 'ca-app-pub-XXXXX/BANNER_IOS',
  },
  interstitial: {
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/1033173712'
      : 'ca-app-pub-XXXXX/INTERSTITIAL_ANDROID',
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/4411468910'
      : 'ca-app-pub-XXXXX/INTERSTITIAL_IOS',
  },
  rewarded: {
    android: __DEV__
      ? 'ca-app-pub-3940256099942544/5224354917'
      : 'ca-app-pub-XXXXX/REWARDED_ANDROID',
    ios: __DEV__
      ? 'ca-app-pub-3940256099942544/1712485313'
      : 'ca-app-pub-XXXXX/REWARDED_IOS',
  },
} as const;

export type AdType = keyof typeof AD_UNITS;

/**
 * Returns the appropriate ad unit ID for the current platform and ad type.
 */
export function getAdUnitId(type: AdType): string {
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  return AD_UNITS[type][platform];
}

/**
 * Minimum interval between interstitial ads in milliseconds.
 * Default: 60 seconds.
 */
export const MIN_INTERSTITIAL_INTERVAL_MS = 60_000;

/**
 * Number of games between interstitial ads.
 * An interstitial is shown once every N games.
 */
export const GAMES_BETWEEN_INTERSTITIALS = 3;

/**
 * Whether to skip the first interstitial opportunity after app launch.
 */
export const SKIP_FIRST_INTERSTITIAL = true;
