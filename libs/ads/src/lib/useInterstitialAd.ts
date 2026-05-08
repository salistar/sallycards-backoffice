import { useEffect, useCallback, useRef, useState } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { getAdUnitId, MIN_INTERSTITIAL_INTERVAL_MS } from './ad-config';
import { useAds } from './AdProvider';

export interface UseSallyInterstitialAdOptions {
  /**
   * Called when the interstitial is shown successfully.
   */
  onAdShown?: () => void;

  /**
   * Called when the interstitial is closed by the user.
   */
  onAdClosed?: () => void;

  /**
   * Called when the interstitial fails to load.
   */
  onError?: (error: Error) => void;
}

export interface UseSallyInterstitialAdReturn {
  /**
   * Whether an interstitial ad is loaded and ready to show.
   */
  isLoaded: boolean;

  /**
   * Whether an interstitial is currently being shown.
   */
  isShowing: boolean;

  /**
   * Show the interstitial ad if one is loaded and the anti-spam
   * conditions are met (minimum interval and game count).
   * Returns true if the ad was shown, false otherwise.
   */
  showInterstitial: () => boolean;
}

/**
 * Hook to manage interstitial ads with built-in anti-spam logic.
 *
 * Anti-spam rules:
 * - Minimum 60 seconds between interstitials
 * - Only shows after every N games (configured in ad-config)
 * - Never shows for Premium users
 * - Never shows on the first game after app launch
 *
 * Usage:
 * ```tsx
 * const { showInterstitial, isLoaded } = useSallyInterstitialAd({
 *   onAdClosed: () => navigateToScore(),
 * });
 * ```
 */
export function useSallyInterstitialAd(
  options: UseSallyInterstitialAdOptions = {},
): UseSallyInterstitialAdReturn {
  const { isPremium, gameCount, shouldShowInterstitial } = useAds();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const lastShownAtRef = useRef<number>(0);
  const interstitialRef = useRef<InterstitialAd | null>(null);

  // Load the interstitial ad
  useEffect(() => {
    // Don't load ads for premium users
    if (isPremium) {
      return;
    }

    const adUnitId = getAdUnitId('interstitial');
    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => {
        setIsLoaded(true);
      },
    );

    const unsubscribeOpened = interstitial.addAdEventListener(
      AdEventType.OPENED,
      () => {
        setIsShowing(true);
        options.onAdShown?.();
      },
    );

    const unsubscribeClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsShowing(false);
        setIsLoaded(false);
        options.onAdClosed?.();

        // Reload for the next opportunity
        interstitial.load();
      },
    );

    const unsubscribeError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        setIsLoaded(false);
        setIsShowing(false);
        options.onError?.(error);

        if (__DEV__) {
          console.warn('[useInterstitialAd] Error:', error.message);
        }

        // Retry loading after a delay
        setTimeout(() => {
          interstitial.load();
        }, 30_000);
      },
    );

    interstitialRef.current = interstitial;
    interstitial.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
      interstitialRef.current = null;
    };
  }, [isPremium]);

  const showInterstitial = useCallback((): boolean => {
    // Premium users never see ads
    if (isPremium) {
      return false;
    }

    // Check if the anti-spam conditions are met
    if (!shouldShowInterstitial()) {
      return false;
    }

    // Check minimum time interval
    const now = Date.now();
    if (now - lastShownAtRef.current < MIN_INTERSTITIAL_INTERVAL_MS) {
      return false;
    }

    // Check if an ad is loaded
    if (!isLoaded || !interstitialRef.current) {
      return false;
    }

    // Show the ad
    lastShownAtRef.current = now;
    interstitialRef.current.show();
    return true;
  }, [isPremium, isLoaded, shouldShowInterstitial]);

  return {
    isLoaded: !isPremium && isLoaded,
    isShowing,
    showInterstitial,
  };
}
