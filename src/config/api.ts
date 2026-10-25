import Constants from 'expo-constants';
import { Platform } from 'react-native';

const configuredApiUrl = (process.env.EXPO_PUBLIC_API_URL || '').trim();

function getDevelopmentApiUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:4000`;
  }

  // Expo publishes the host currently serving the app bundle. This follows
  // the laptop onto a different Wi-Fi network without editing .env.
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return '';

  try {
    const host = new URL(`http://${hostUri}`).hostname;
    return `http://${host}:4000`;
  } catch {
    console.warn('[network] Could not determine the Expo development host. Set EXPO_PUBLIC_API_URL.');
    return '';
  }
}

export const apiBaseUrl = (configuredApiUrl || getDevelopmentApiUrl()).replace(/\/$/, '');

if (__DEV__) {
  console.info(`[network] Backend API: ${apiBaseUrl || 'not configured'}`);
}

export async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unsupported FormDataPart implementation')) {
      throw new Error('The selected file could not be encoded for upload. Please choose the file again and retry.', { cause: error });
    }
    console.error('[network] Backend API request could not reach the server:', error);
    throw new Error(
      `Cannot reach the backend API. Check that it is running, the phone and laptop share a reachable network, and port 4000 is allowed. ${error instanceof Error ? error.message : ''}`
    );
  }
}

export function logApiResponseFailure(label: string, status: number, detail?: string): void {
  console.error(`[backend] ${label} returned HTTP ${status}.${detail ? ` ${detail}` : ' Check backend logs and /api/health.'}`);
}
