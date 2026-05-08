import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { getAdUnitId } from './ad-config';
import { useAds } from './AdProvider';

export interface SallyBannerAdProps {
  /**
   * Position of the banner on the screen.
   * Controls whether padding is applied to the top or bottom.
   */
  position?: 'top' | 'bottom';

  /**
   * Banner size. Defaults to ANCHORED_ADAPTIVE_BANNER which
   * automatically adjusts to the screen width.
   */
  size?: BannerAdSize;

  /**
   * Called when the banner fails to load. Useful for analytics.
   */
  onError?: (error: Error) => void;
}

/**
 * SallyBannerAd displays an AdMob banner ad at the top or bottom of the screen.
 *
 * - Automatically hidden for Premium users.
 * - Uses adaptive banner size by default for best fill rate.
 * - Handles load errors gracefully by hiding the banner.
 *
 * Usage:
 * ```tsx
 * <SallyBannerAd position="bottom" />
 * ```
 */
export function SallyBannerAd({
  position = 'bottom',
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
  onError,
}: SallyBannerAdProps) {
  const { isPremium } = useAds();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleAdLoaded = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleAdFailedToLoad = useCallback(
    (error: Error) => {
      setHasError(true);
      setIsLoaded(false);
      onError?.(error);

      if (__DEV__) {
        console.warn('[SallyBannerAd] Failed to load:', error.message);
      }
    },
    [onError],
  );

  // Premium users never see ads
  if (isPremium) {
    return null;
  }

  // If the ad failed to load, don't render anything to avoid blank space
  if (hasError) {
    return null;
  }

  const adUnitId = getAdUnitId('banner');

  return (
    <View
      style={[
        styles.container,
        position === 'top' ? styles.top : styles.bottom,
        !isLoaded && styles.hidden,
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
});
