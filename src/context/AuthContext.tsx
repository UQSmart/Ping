/**
 * Stato della sessione: chi è loggato. Avvolge le funzioni di lib/auth.ts.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as auth from '../lib/auth';
import { user } from '../lib/gun';
import { getMyProfile, Profile, profileNode, startHeartbeat, updateMyProfile } from '../lib/profile';
import { getPushToken } from '../lib/notifications';

type Status = 'loading' | 'signedOut' | 'signedIn';

type Ctx = {
  status: Status;
  pub: string | null;
  phone: string | null;
  profile: Profile | undefined;
  refreshProfile: () => Promise<void>;
  logIn: (phone: string, pass: string) => Promise<void>;
  signUp: (d: auth.SignUpData) => Promise<string>;
  logOut: () => Promise<void>;
  markSignedIn: (phone: string) => void;
};

const AuthCtx = createContext<Ctx>(null as any);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [phone, setPhone] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>();

  const refreshProfile = useCallback(async () => {
    const p = await getMyProfile();
    if (p) setProfile((prev) => ({ ...(prev as Profile), ...p }));
  }, []);

  const markSignedIn = useCallback((p: string) => {
    setPhone(p);
    setStatus('signedIn');
  }, []);

  // All'avvio: prova a ripristinare la sessione salvata in SecureStore.
  useEffect(() => {
    auth.restoreSession().then((p) => (p ? markSignedIn(p) : setStatus('signedOut')));
  }, [markSignedIn]);

  // Da loggati: profilo "live" dal grafo, "battito" Online, token push.
  useEffect(() => {
    if (status !== 'signedIn') return;
    refreshProfile();
    const pub = user.is?.pub;
    let ev: any;
    // Ogni modifica al profilo (anche da un altro dispositivo) aggiorna la UI.
    profileNode(pub).on((data: any, _k: string, _m: any, e: any) => {
      ev = e;
      const { _, dob, lastSeen, ...rest } = data || {};
      setProfile((prev) => ({ ...(prev as Profile), ...rest }));
    });
    const stop = startHeartbeat();
    getPushToken().then((t) => {
      if (t) updateMyProfile({ pushToken: t });
    });
    return () => {
      stop();
      ev?.off?.();
    };
  }, [status, refreshProfile]);

  const value: Ctx = {
    status,
    phone,
    pub: status === 'signedIn' ? user.is?.pub ?? null : null,
    profile,
    refreshProfile,
    markSignedIn,
    logIn: async (p, pass) => {
      await auth.logIn(p, pass);
      markSignedIn(p);
    },
    signUp: async (d) => {
      const code = await auth.signUp(d);
      // NB: non passiamo subito a signedIn: prima mostriamo il codice di recupero.
      setPhone(d.phone);
      return code;
    },
    logOut: async () => {
      await updateMyProfile({ pushToken: null }).catch(() => {});
      await auth.logOut();
      setProfile(undefined);
      setPhone(null);
      setStatus('signedOut');
    },
  };
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
