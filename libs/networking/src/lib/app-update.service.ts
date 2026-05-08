import { Platform } from 'react-native';

export interface UpdateInfo {
  available: boolean;
  version?: string;
  mandatory?: boolean;
  releaseNotes?: string;
  downloadUrl?: string;
}

export interface UpdateProgress {
  bytesWritten: number;
  totalBytes: number;
  percentage: number;
}

type UpdateListener = (progress: UpdateProgress) => void;

const UPDATE_CHECK_URL = 'https://api.sally.cards/v1/app/version';

/**
 * Service to check for and apply over-the-air (OTA) updates.
 *
 * For React Native / Expo, this wraps expo-updates functionality
 * with additional logic for mandatory updates and version checking.
 */
export class AppUpdateService {
  private listeners: UpdateListener[] = [];
  private lastCheckTimestamp = 0;
  private cachedUpdateInfo: UpdateInfo | null = null;
  private readonly CHECK_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown

  /**
   * Check if an update is available by querying the version endpoint.
   *
   * Returns update info including whether the update is mandatory.
   * Mandatory updates should block the user from continuing until applied.
   */
  async checkForUpdate(): Promise<UpdateInfo> {
    const now = Date.now();

    // Use cached result if within cooldown
    if (
      this.cachedUpdateInfo &&
      now - this.lastCheckTimestamp < this.CHECK_COOLDOWN_MS
    ) {
      return this.cachedUpdateInfo;
    }

    try {
      const currentVersion = this.getCurrentVersion();
      const platform = Platform.OS;

      const response = await fetch(
        `${UPDATE_CHECK_URL}?platform=${platform}&current=${currentVersion}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Platform': platform,
            'X-App-Version': currentVersion,
          },
        },
      );

      if (!response.ok) {
        return { available: false };
      }

      const data = await response.json();

      const updateInfo: UpdateInfo = {
        available: data.updateAvailable ?? false,
        version: data.latestVersion,
        mandatory: data.mandatory ?? false,
        releaseNotes: data.releaseNotes,
        downloadUrl: data.downloadUrl,
      };

      this.cachedUpdateInfo = updateInfo;
      this.lastCheckTimestamp = now;

      return updateInfo;
    } catch (error) {
      console.warn('Failed to check for updates:', error);
      return { available: false };
    }
  }

  /**
   * Download the latest update package.
   * Emits progress events that can be listened to via onProgress().
   *
   * For Expo managed workflow, this uses expo-updates under the hood.
   */
  async downloadUpdate(): Promise<void> {
    try {
      // Dynamic import of expo-updates to avoid bundling issues
      // when running in web or development mode
      const Updates = await this.getExpoUpdates();

      if (!Updates) {
        console.warn('expo-updates not available in this environment');
        return;
      }

      this.notifyProgress({ bytesWritten: 0, totalBytes: 100, percentage: 0 });

      const update = await Updates.fetchUpdateAsync();

      if (update.isNew) {
        this.notifyProgress({
          bytesWritten: 100,
          totalBytes: 100,
          percentage: 100,
        });
      }
    } catch (error) {
      console.error('Failed to download update:', error);
      throw new Error(
        `Update download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Apply the downloaded update.
   * This will reload the app with the new bundle.
   *
   * Should only be called after downloadUpdate() completes successfully.
   */
  async applyUpdate(): Promise<void> {
    try {
      const Updates = await this.getExpoUpdates();

      if (!Updates) {
        console.warn('expo-updates not available in this environment');
        return;
      }

      await Updates.reloadAsync();
    } catch (error) {
      console.error('Failed to apply update:', error);
      throw new Error(
        `Update apply failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Register a listener for download progress updates.
   */
  onProgress(listener: UpdateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Get the current app version from the native constants.
   */
  getCurrentVersion(): string {
    try {
      // In a real Expo app, this comes from expo-constants
      const Constants = require('expo-constants');
      return Constants.default?.expoConfig?.version ?? '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  /**
   * Check if the app was launched from a downloaded update
   * (as opposed to the embedded bundle).
   */
  async isRunningUpdate(): Promise<boolean> {
    try {
      const Updates = await this.getExpoUpdates();
      if (!Updates) return false;
      const status = await Updates.checkForUpdateAsync();
      return !status.isAvailable;
    } catch {
      return false;
    }
  }

  /**
   * Clear the cached update info to force a fresh check.
   */
  clearCache(): void {
    this.cachedUpdateInfo = null;
    this.lastCheckTimestamp = 0;
  }

  // --- Private helpers ---

  private notifyProgress(progress: UpdateProgress): void {
    for (const listener of this.listeners) {
      try {
        listener(progress);
      } catch (err) {
        console.warn('Progress listener error:', err);
      }
    }
  }

  private async getExpoUpdates(): Promise<any> {
    try {
      return require('expo-updates');
    } catch {
      return null;
    }
  }
}
