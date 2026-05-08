import { useEffect, useCallback, useRef, useState } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from './ad-config';
import { useAds } from './AdProvider';

export interface RewardPayload {
  /** The type of reward (e.g., "sally_coins", "hint", "undo") */
  type: string;
  /** The amount of the reward */
  amount: number;
}

export interface UseSallyRewardedAdOptions {
  /**
   * Called when the user earns a reward by watching the full video.
   */
  onRewardEarned: (reward: RewardPayload) => void;

  /**
   * Called when the rewarded ad is closed (whether or not the reward was earned).
   */
  onAdClosed?: () => void;

  /**
   * Called when the rewarded ad fails to load.
   */
  onError?: (error: Error) => void;
}

export interface UseSallyRewardedAdReturn {
  /**
   * Whether a rewarded ad is loaded and ready to show.
   */
  isLoaded: boolean;

  /**
   * Whether a rewarded ad is currently being shown.
   */
  isShowing: boolean;

  /**
   * Show the rewarded ad. The user will see a full-screen video
   * and receive the reward if they watch it to completion.
   * Returns true if the ad was shown, false otherwise.
   */
  showRewardedAd: () => boolean;

  /**
   * Manually reload the rewarded ad. Useful after showing one
   * if you want to offer another viewing opportunity immediately.
   */
  reload: () => void;
}

/**
 * Hook to manage rewarded video ads.
 *
 * Rewarded ads are voluntary — the user explicitly taps a button to watch.
 * After watching the full video, they receive an in-app reward.
 *
 * This hook:
 * - Preloads the rewarded ad on mount
 * - Automatically reloads after the ad is shown or dismissed
 * - Handles errors with retry logic
 * - Skips loading entirely for Premium users
 *
 * Usage:
 * ```tsx
 * const { showRewardedAd, isLoaded } = useSallyRewardedAd({
 *   onRewardEarned: (reward) => {
 *     addSallyCoins(reward.amount);
 *   },
 * });
 *
 * return (
 *   <Button
 *     title="Watch ad for +100 SC"
 *     onPress={showRewardedAd}
 *     disabled={!isLoaded}
 *   />
 * );
 * ```
 */
export function useSallyRewardedAd(
  options: UseSallyRewardedAdOptions,
): UseSallyRewardedAdReturn {
  const { isPremium } = useAds();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const rewardedRef = useRef<RewardedAd | null>(null);
  const earnedRewardRef = useRef(false);

  const loadAd = useCallback(() => {
    if (isPremium) return;

    const adUnitId = getAdUnitId('rewarded');
    const rewarded = RewardedAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        setIsLoaded(true);
      },
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        earnedRewardRef.current = true;
        options.onRewardEarned({
          type: reward.type,
          amount: reward.amount,
        });
      },
    );

    const unsubscribeOpened = rewarded.addAdEventListener(
      AdEventType.OPENED,
      () => {
        setIsShowing(true);
        earnedRewardRef.current = false;
      },
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        setIsShowing(false);
        setIsLoaded(false);
        options.onAdClosed?.();

        // Reload for the next opportunity
        rewarded.load();
      },
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error: Error) => {
        setIsLoaded(false);
        setIsShowing(false);
        options.onError?.(error);

        if (__DEV__) {
          console.warn('[useRewardedAd] Error:', error.message);
        }

        // Retry loading after a delay
        setTimeout(() => {
          rewarded.load();
        }, 30_000);
      },
    );

    rewardedRef.current = rewarded;
    rewarded.load();

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeError();
      rewardedRef.current = null;
    };
  }, [isPremium, options.onRewardEarned, options.onAdClosed, options.onError]);

  useEffect(() => {
    const cleanup = loadAd();
    return cleanup;
  }, [loadAd]);

  const showRewardedAd = useCallback((): boolean => {
    if (isPremium) {
      return false;
    }

    if (!isLoaded || !rewardedRef.current) {
      return false;
    }

    rewardedRef.current.show();
    return true;
  }, [isPremium, isLoaded]);

  const reload = useCallback(() => {
    if (rewardedRef.current && !isLoaded && !isShowing) {
      rewardedRef.current.load();
    }
  }, [isLoaded, isShowing]);

  return {
    isLoaded: !isPremium && isLoaded,
    isShowing,
    showRewardedAd,
    reload,
  };
}
