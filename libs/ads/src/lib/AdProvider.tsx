import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import mobileAds, {
  AdsConsent,
  AdsConsentStatus,
  MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import {
  GAMES_BETWEEN_INTERSTITIALS,
  SKIP_FIRST_INTERSTITIAL,
} from './ad-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdContextValue {
  /** Whether the current user has a Premium subscription (no ads). */
  isPremium: boolean;

  /** Whether the AdMob SDK has been initialized. */
  isInitialized: boolean;

  /** Whether the GDPR consent form has been handled. */
  consentHandled: boolean;

  /** Number of games played in the current session. */
  gameCount: number;

  /**
   * Call this after each completed game. Increments the internal counter
   * used for interstitial frequency capping.
   */
  incrementGameCount: () => void;

  /**
   * Returns true if an interstitial should be shown right now based on
   * the game count and anti-spam rules.
   */
  shouldShowInterstitial: () => boolean;

  /**
   * Request the GDPR consent form again (e.g. from a Settings screen
   * so the user can change their preference).
   */
  requestConsentUpdate: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AdContext = createContext<AdContextValue | null>(null);

/**
 * Hook to access the ad context. Must be used inside an `<AdProvider>`.
 */
export function useAds(): AdContextValue {
  const ctx = useContext(AdContext);
  if (!ctx) {
    throw new Error('useAds must be used within an <AdProvider>');
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface AdProviderProps {
  children: ReactNode;

  /**
   * Whether the current user has a Premium subscription.
   * When true, no ads are loaded or shown anywhere in the app.
   */
  isPremium: boolean;

  /**
   * If true, tag the app for child-directed treatment (COPPA).
   * This disables personalized ads and restricts ad content.
   * Default: false.
   */
  childDirected?: boolean;

  /**
   * Maximum ad content rating.
   * Default: MaxAdContentRating.G (suitable for all audiences).
   */
  maxAdContentRating?: MaxAdContentRating;
}

/**
 * AdProvider initializes the AdMob SDK, handles GDPR consent,
 * and provides ad-related state to the entire app.
 *
 * Place this near the root of your component tree, after AuthProvider
 * so that `isPremium` can be derived from the user's subscription.
 *
 * ```tsx
 * function App() {
 *   const { user } = useAuth();
 *   const isPremium = user?.subscription?.status === 'active';
 *
 *   return (
 *     <AdProvider isPremium={isPremium}>
 *       <Navigation />
 *     </AdProvider>
 *   );
 * }
 * ```
 */
export function AdProvider({
  children,
  isPremium,
  childDirected = false,
  maxAdContentRating = MaxAdContentRating.G,
}: AdProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [consentHandled, setConsentHandled] = useState(false);
  const [gameCount, setGameCount] = useState(0);

  // --------------------------------------------------
  // SDK initialization
  // --------------------------------------------------

  useEffect(() => {
    // Skip SDK init entirely for premium users to save resources
    if (isPremium) {
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        // 1. Configure the SDK
        await mobileAds().setRequestConfiguration({
          maxAdContentRating,
          tagForChildDirectedTreatment: childDirected,
          tagForUnderAgeOfConsent: childDirected,
        });

        // 2. Handle GDPR consent (EU users)
        await handleConsent();

        // 3. Initialize the SDK
        await mobileAds().initialize();

        if (!cancelled) {
          setIsInitialized(true);
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[AdProvider] Initialization error:', error);
        }
        // Even if init fails, mark as initialized so the app doesn't hang.
        // Ads simply won't load.
        if (!cancelled) {
          setIsInitialized(true);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [isPremium, childDirected, maxAdContentRating]);

  // --------------------------------------------------
  // GDPR consent
  // --------------------------------------------------

  async function handleConsent() {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();

      if (
        consentInfo.isConsentFormAvailable &&
        consentInfo.status === AdsConsentStatus.REQUIRED
      ) {
        await AdsConsent.showForm();
      }

      setConsentHandled(true);
    } catch (error) {
      if (__DEV__) {
        console.warn('[AdProvider] Consent error:', error);
      }
      // Don't block the app if consent handling fails.
      // Ads will be served as non-personalized.
      setConsentHandled(true);
    }
  }

  const requestConsentUpdate = useCallback(async () => {
    try {
      const consentInfo = await AdsConsent.requestInfoUpdate();
      if (consentInfo.isConsentFormAvailable) {
        await AdsConsent.showForm();
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[AdProvider] Consent update error:', error);
      }
    }
  }, []);

  // --------------------------------------------------
  // Game counter & interstitial frequency capping
  // --------------------------------------------------

  const incrementGameCount = useCallback(() => {
    setGameCount((prev) => prev + 1);
  }, []);

  const shouldShowInterstitial = useCallback((): boolean => {
    // Premium users never see ads
    if (isPremium) {
      return false;
    }

    // Skip the very first interstitial opportunity after app launch
    if (SKIP_FIRST_INTERSTITIAL && gameCount <= 1) {
      return false;
    }

    // Show an interstitial every N games
    return gameCount > 0 && gameCount % GAMES_BETWEEN_INTERSTITIALS === 0;
  }, [isPremium, gameCount]);

  // --------------------------------------------------
  // Context value (memoized to prevent unnecessary re-renders)
  // --------------------------------------------------

  const value = useMemo<AdContextValue>(
    () => ({
      isPremium,
      isInitialized,
      consentHandled,
      gameCount,
      incrementGameCount,
      shouldShowInterstitial,
      requestConsentUpdate,
    }),
    [
      isPremium,
      isInitialized,
      consentHandled,
      gameCount,
      incrementGameCount,
      shouldShowInterstitial,
      requestConsentUpdate,
    ],
  );

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}
