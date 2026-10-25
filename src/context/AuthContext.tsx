import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File as ExpoFile } from 'expo-file-system';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, hasFirebaseConfig } from '../config/firebase';
import { apiBaseUrl, apiFetch, logApiResponseFailure } from '../config/api';

export interface UserResume {
  _id?: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface UserProfile {
  photoURL?: string;
  /** Legacy field retained so existing saved profiles continue to render. */
  avatarUrl?: string;
  headline?: string;
  degreeLevel?: string;
  cgpa?: number | null;
  cgpaScale?: number | null;
  nationality?: string;
  targetCountries?: string[];
  fieldsOfStudy?: string[];
  languages?: string[];
  resumes?: UserResume[];
}

export interface User {
  id: string;
  firebaseUid?: string;
  fullName: string;
  email: string;
  authProvider?: string;
  profile: UserProfile;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (fullName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<UserProfile> & { fullName?: string }) => Promise<{ success: boolean; error?: string }>;
  uploadProfilePhoto: (uri: string, fileName: string, mimeType: string) => Promise<{ success: boolean; error?: string; photoURL?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  token: null,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  resetPassword: async () => ({ success: false }),
  updateProfile: async () => ({ success: false }),
  uploadProfilePhoto: async () => ({ success: false }),
  refreshUser: async () => {},
});

const TOKEN_KEY = 'collabx:auth:token';
const USER_KEY = 'collabx:auth:user';

const API_BASE = apiBaseUrl;

function formatFirebaseError(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: string }).code;
    switch (code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters long.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again in a few minutes.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/operation-not-allowed':
        return 'Email/password sign-in is disabled. Enable it in Firebase Authentication settings.';
      case 'auth/invalid-api-key':
      case 'auth/api-key-not-valid.':
        return 'Firebase API key is invalid. Please check EXPO_PUBLIC_FIREBASE_API_KEY in .env.';
      default:
        if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
          return (err as { message: string }).message;
        }
    }
  }
  return err instanceof Error ? err.message : 'Authentication failed.';
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Syncs Firebase User with MongoDB User document
  const syncWithBackend = useCallback(async (fbUser: FirebaseUser, overrideName?: string) => {
    const name = overrideName || fbUser.displayName || fbUser.email?.split('@')[0] || '';
    try {
      if (API_BASE) {
        const sendFirebaseSync = (idToken: string) => apiFetch(`${API_BASE}/api/auth/firebase-sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            firebaseUid: fbUser.uid,
            email: fbUser.email,
            fullName: name,
            photoURL: fbUser.photoURL,
          }),
        });

        let res = await sendFirebaseSync(await fbUser.getIdToken());
        // A recently expired or revoked cached ID token can be refreshed before retrying sync.
        if (res.status === 401) {
          res = await sendFirebaseSync(await fbUser.getIdToken(true));
        }

        if (res.ok) {
          const body = await res.json();
          const syncedUser = {
            ...body.user,
            profile: body.user.profile || {},
          } as User;
          setToken(body.token);
          setUser(syncedUser);
          await AsyncStorage.setItem(TOKEN_KEY, body.token);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(syncedUser));
          return true;
        }
        const errorBody = await res.clone().json().catch(() => ({} as { error?: string }));
        logApiResponseFailure('Firebase account sync', res.status, errorBody.error);
      }
    } catch (err) {
      console.error('Failed to sync Firebase user with MongoDB:', err);
    }

    // Keep Firebase auth usable when the optional profile API is offline.
    setToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    const cachedUser = await AsyncStorage.getItem(USER_KEY);
    let cachedProfile: UserProfile = {};
    let cachedName = '';
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser) as User;
        if (parsed.firebaseUid === fbUser.uid) {
          cachedProfile = { ...cachedProfile, ...(parsed.profile || {}) };
          cachedName = parsed.fullName || '';
        }
      } catch {}
    }
    const fallbackUser: User = {
      id: fbUser.uid,
      firebaseUid: fbUser.uid,
      fullName: overrideName || fbUser.displayName || cachedName || name,
      email: fbUser.email || '',
      profile: {
        ...cachedProfile,
        ...(fbUser.photoURL ? { avatarUrl: fbUser.photoURL } : {}),
      },
    };
    setUser(fallbackUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(fallbackUser));
    return false;
  }, []);

  // Listen to Firebase auth state changes
  useEffect(() => {
    // Restore cached session first
    AsyncStorage.getItem(USER_KEY).then((cached) => {
      if (cached) {
        try {
          setUser(JSON.parse(cached));
        } catch {}
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        await syncWithBackend(fbUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
        setToken(null);
        await AsyncStorage.removeItem(TOKEN_KEY);
        await AsyncStorage.removeItem(USER_KEY);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [syncWithBackend]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        if (!hasFirebaseConfig) throw new Error('Firebase is not configured. Add your Firebase web app values to the project .env file and restart Expo.');
        const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
        await syncWithBackend(cred.user);
        return { success: true };
      } catch (err) {
        return { success: false, error: formatFirebaseError(err) };
      }
    },
    [syncWithBackend]
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      try {
        if (!hasFirebaseConfig) throw new Error('Firebase is not configured. Add your Firebase web app values to the project .env file and restart Expo.');
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Set display name on Firebase
        if (fullName.trim()) {
          await updateFirebaseProfile(cred.user, {
            displayName: fullName.trim(),
          });
        }
        await syncWithBackend(cred.user, fullName.trim());
        return { success: true };
      } catch (err) {
        return { success: false, error: formatFirebaseError(err) };
      }
    },
    [syncWithBackend]
  );

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setFirebaseUser(null);
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Error signing out from Firebase:', err);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    try {
      if (!email.trim()) return { success: false, error: 'Please enter your email address.' };
      if (!hasFirebaseConfig) throw new Error('Firebase is not configured. Add your Firebase web app values to the project .env file and restart Expo.');
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err) {
      return { success: false, error: formatFirebaseError(err) };
    }
  }, []);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile> & { fullName?: string }) => {
      try {
        const signedInUser = auth.currentUser || firebaseUser;
        if (!signedInUser) return { success: false, error: 'Your Firebase sign-in session is unavailable. Please sign in again.' };
        const profileUser = user || {
          id: signedInUser.uid,
          firebaseUid: signedInUser.uid,
          fullName: signedInUser.displayName || signedInUser.email?.split('@')[0] || '',
          email: signedInUser.email || '',
          profile: {},
        };

        // If updating name, also update Firebase display name
        if (data.fullName || data.avatarUrl) {
          await updateFirebaseProfile(signedInUser, {
            ...(data.fullName ? { displayName: data.fullName } : {}),
            ...(data.avatarUrl ? { photoURL: data.avatarUrl } : {}),
          });
        }

        if (!API_BASE) {
          const { fullName, ...profileUpdates } = data;
          const nextName = fullName?.trim() || profileUser.fullName;
          const nextProfile = { ...profileUser.profile, ...profileUpdates };
          const localUser: User = {
            ...profileUser,
            fullName: nextName,
            profile: nextProfile,
          };
          setUser(localUser);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(localUser));
          return { success: true };
        }

        if (!token) {
          const synced = await syncWithBackend(signedInUser, profileUser.fullName);
          if (!synced) {
            const { fullName, ...profileUpdates } = data;
            const nextName = fullName?.trim() || profileUser.fullName;
            const nextProfile = { ...profileUser.profile, ...profileUpdates };
            const localUser: User = {
              ...profileUser,
              fullName: nextName,
              profile: nextProfile,
            };
            setUser(localUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(localUser));
            return { success: true };
          }
        }

        const res = await apiFetch(`${API_BASE}/api/users/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${await signedInUser.getIdToken()}`,
          },
          body: JSON.stringify(data),
        });

        const body = await res.json();
        if (!res.ok) {
          logApiResponseFailure('Profile update', res.status);
          return { success: false, error: body.error || 'Profile update failed.' };
        }

        setUser(body.user);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(body.user));
        return { success: true };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Error updating profile.',
        };
      }
    },
    [firebaseUser, syncWithBackend, token, user]
  );

  const uploadProfilePhoto = useCallback(async (uri: string, fileName: string, mimeType: string) => {
    try {
      await auth.authStateReady();
      const signedInUser = auth.currentUser || firebaseUser;
      if (!signedInUser) return { success: false, error: 'Your Firebase sign-in session is unavailable. Please sign in again.' };
      if (!API_BASE) return { success: false, error: 'Connect to the API to upload a profile photo.' };
      if (!token) {
        const synced = await syncWithBackend(signedInUser);
        if (!synced) return { success: false, error: 'Connect to the API to upload a profile photo.' };
      }

      const sendPhoto = async (idToken: string) => {
        const formData = new FormData();
        if (Platform.OS === 'web') {
          const fileResponse = await fetch(uri);
          if (!fileResponse.ok) throw new Error('Could not read the selected profile photo.');
          const blob = await fileResponse.blob();
          const imageBlob = blob.type === mimeType ? blob : blob.slice(0, blob.size, mimeType);
          formData.append('photo', imageBlob, fileName);
        } else {
          formData.append('photo', new ExpoFile(uri), fileName);
        }
        return apiFetch(`${API_BASE}/api/users/profile`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${idToken}` },
          body: formData,
        });
      };

      let response = await sendPhoto(await signedInUser.getIdToken(true));
      if (response.status === 401) {
        response = await sendPhoto(await signedInUser.getIdToken(true));
      }
      const body = await response.json();
      if (!response.ok) {
        logApiResponseFailure('Profile photo upload', response.status, body.error);
        return { success: false, error: body.error || 'Photo upload failed.' };
      }

      const updatedUser = body.user as User;
      setUser(updatedUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { success: true, photoURL: updatedUser.profile?.photoURL };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Photo upload failed.' };
    }
  }, [firebaseUser, syncWithBackend, token]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await syncWithBackend(auth.currentUser);
    }
  }, [syncWithBackend]);

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        token,
        isLoading,
        login,
        register,
        logout,
        resetPassword,
        updateProfile,
        uploadProfilePhoto,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
