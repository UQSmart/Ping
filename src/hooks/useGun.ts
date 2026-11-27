/**
 * Hook React per GUN — l'equivalente "React Native" di gun-react.
 *
 * gun-react funziona solo nel browser (inietta <script> nel DOM), quindi
 * usiamo questi piccoli hook che fanno la stessa cosa: si abbonano a un nodo
 * del grafo con .on() e aggiornano lo stato React a ogni modifica, in tempo reale.
 */
import { useEffect, useState } from 'react';
import { clean, GunChain } from '../lib/gun';
import { Profile, profileNode } from '../lib/profile';

/** Valore "live" di un nodo GUN. `make` costruisce la catena (es. () => gun.get('a').get('b')). */
export function useGunNode<T extends Record<string, any>>(make: () => GunChain | null, deps: any[]) {
  const [value, setValue] = useState<T | undefined>(undefined);
  useEffect(() => {
    const chain = make();
    if (!chain) return;
    let alive = true;
    const ev: any[] = [];
    chain.on((data: any, _key: string, _msg: any, e: any) => {
      if (e) ev[0] = e;
      if (alive) setValue((prev) => ({ ...(prev as any), ...clean<T>(data) }));
    });
    return () => {
      alive = false;
      ev[0]?.off?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return value;
}

/** Profilo live di un utente (nome, foto, lastSeen per lo stato Online). */
export function useProfile(pub?: string | null) {
  return useGunNode<Profile>(() => (pub ? profileNode(pub) : null), [pub]);
}
