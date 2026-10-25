import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Scholarship } from "../types/scholarship";
import { useAuth } from "../context/AuthContext";
import { apiBaseUrl, apiFetch, logApiResponseFailure } from "../config/api";

const API_URL = apiBaseUrl;
const LOCAL_SAVED_KEY = "collabx:savedScholarshipIds";

export interface SavedScholarshipItem extends Scholarship {
  tracker?: {
    _id?: string;
    status:
      | "saved"
      | "preparing"
      | "applied"
      | "interviewing"
      | "awarded"
      | "rejected";
    notes?: string;
    reminderDate?: string;
    savedAt?: string;
  };
}

export function useScholarships(query = "") {
  const [items, setItems] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!API_URL) {
        throw new Error(
          "Backend API address is unavailable. Start Expo with LAN networking or set EXPO_PUBLIC_API_URL.",
        );
      }
      const r = await apiFetch(
        `${API_URL}/api/scholarships${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      );
      if (!r.ok) {
        logApiResponseFailure("Scholarships request", r.status);
        throw new Error(`Scholarship service returned HTTP ${r.status}`);
      }
      const b = await r.json();
      setItems(b.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load scholarships.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useRecommendedScholarships() {
  const { token, user } = useAuth();
  const [items, setItems] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!API_URL)
        throw new Error(
          "Backend API address is unavailable. Start Expo with LAN networking or set EXPO_PUBLIC_API_URL.",
        );
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await apiFetch(`${API_URL}/api/scholarships/recommended`, {
        headers,
      });
      if (!res.ok) {
        logApiResponseFailure("Recommendations request", res.status);
        throw new Error(`Recommendations service returned HTTP ${res.status}`);
      }
      const body = await res.json();
      setItems(body.data || []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not load recommendations.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, error, refresh };
}

export function useSavedScholarships() {
  const { token } = useAuth();
  const [saved, setSaved] = useState<string[]>([]);
  const [savedDetails, setSavedDetails] = useState<SavedScholarshipItem[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync saved list from server or local storage
  const syncSaved = useCallback(async () => {
    setLoading(true);
    try {
      if (token && API_URL) {
        // Authenticated: fetch from MongoDB
        const res = await apiFetch(`${API_URL}/api/saved-scholarships`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const body = await res.json();
          const ids: string[] = body.savedIds || [];
          setSaved(ids);
          setSavedDetails(body.data || []);
          await AsyncStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(ids));
          return;
        }
      }

      // Guest / Offline fallback: fetch from AsyncStorage
      const local = await AsyncStorage.getItem(LOCAL_SAVED_KEY);
      if (local) {
        setSaved(JSON.parse(local));
      }
    } catch (e) {
      console.error("Failed to sync saved scholarships:", e);
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, [token]);

  useEffect(() => {
    syncSaved();
  }, [syncSaved]);

  const toggle = useCallback(
    async (id: string) => {
      // Optimistic UI update
      setSaved((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        AsyncStorage.setItem(LOCAL_SAVED_KEY, JSON.stringify(next)).catch(
          () => {},
        );
        return next;
      });

      if (token && API_URL) {
        try {
          await apiFetch(`${API_URL}/api/saved-scholarships/toggle`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ scholarshipId: id }),
          });
          syncSaved();
        } catch (e) {
          console.error("Failed to toggle bookmark on server:", e);
        }
      }
    },
    [token, syncSaved],
  );

  const updateTrackerStatus = useCallback(
    async (id: string, status: string, notes?: string) => {
      if (!token || !API_URL) return;
      try {
        await apiFetch(
          `${API_URL}/api/saved-scholarships/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status, notes }),
          },
        );
        syncSaved();
      } catch (e) {
        console.error("Failed to update tracker status:", e);
      }
    },
    [token, syncSaved],
  );

  return {
    saved,
    savedDetails,
    ready,
    loading,
    toggle,
    updateTrackerStatus,
    refreshSaved: syncSaved,
  };
}
