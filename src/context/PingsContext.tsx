/**
 * Ping ricevuti e non ancora visti ("Who pinged me?").
 * Si abbona all'inbox GUN appena l'utente è loggato.
 */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { deletePing, ReceivedPing, subscribeInbox } from '../lib/pings';
import { notifyLocal, setupNotifications } from '../lib/notifications';

type Ctx = {
  pings: ReceivedPing[];
  getPing: (id: string) => ReceivedPing | undefined;
  removePing: (id: string) => void;
};
const PingsCtx = createContext<Ctx>({ pings: [], getPing: () => undefined, removePing: () => {} });

export function PingsProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const { settings } = useSettings();
  const [pings, setPings] = useState<ReceivedPing[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    if (status !== 'signedIn') {
      setPings([]);
      return;
    }
    setupNotifications().catch(() => {});
    const startedAt = Date.now();

    const unsubscribe = subscribeInbox(
      (p) => {
        const s = settingsRef.current;
        if (s.blocked.includes(p.fromPub)) {
          deletePing(p.id); // utente bloccato: il ping viene eliminato senza mostrarlo
          return;
        }
        setPings((prev) =>
          prev.some((x) => x.id === p.id) ? prev : [...prev, p].sort((a, b) => b.ts - a.ts),
        );
        // Notifichiamo solo i ping arrivati DOPO l'apertura dell'app.
        if (p.ts > startedAt - 5000) {
          if (AppState.currentState === 'active') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          }
          if (s.notifications) {
            notifyLocal('Ping!', `${p.fromName} pinged you!`, { pingId: p.id }).catch(() => {});
          }
        }
      },
      (id) => setPings((prev) => prev.filter((x) => x.id !== id)),
    );
    return unsubscribe;
  }, [status]);

  const getPing = useCallback((id: string) => pings.find((p) => p.id === id), [pings]);
  const removePing = useCallback((id: string) => {
    deletePing(id);
    setPings((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return <PingsCtx.Provider value={{ pings, getPing, removePing }}>{children}</PingsCtx.Provider>;
}

export const usePings = () => useContext(PingsCtx);
