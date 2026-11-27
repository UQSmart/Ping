/** 6.2 Sending a Ping – List of Contacts */
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Avatar, Screen, useAlert } from '../components/ui';
import { SlideToSend } from '../components/SlideToSend';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../hooks/useGun';
import { AppContact, loadPhoneContacts, resolveContacts } from '../lib/contacts';
import { sendPing } from '../lib/pings';
import { getProfile, isOnline } from '../lib/profile';
import { loadRecents, touchRecent } from '../lib/storage';
import { normalizePhone, waNumber } from '../lib/phone';
import { pubForPhone } from '../lib/auth';
import { COLORS, INVITE_URL, MAX_RECIPIENTS } from '../lib/config';

type Sort = 'recent' | 'az';

function ContactRow({ c, selected, onPress }: { c: AppContact; selected: boolean; onPress: () => void }) {
  const p = useProfile(c.pub);
  const online = isOnline(p);
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
      <Avatar uri={p?.avatar} name={c.name} size={48} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.name}>{c.name}</Text>
        <Text style={{ color: online ? COLORS.online : COLORS.offline, fontSize: 13 }}>
          {online ? 'Online' : 'Offline'}
        </Text>
      </View>
      {selected && <FontAwesome6 name="check" size={18} color={COLORS.white} />}
    </Pressable>
  );
}

function InviteRow({ c, myName }: { c: AppContact; myName: string }) {
  const invite = () => {
    // Chi non ha Ping! riceve un messaggio WhatsApp con il link per scaricarla (slide 2).
    const msg = `${myName} just pinged you! Download the app here: ${INVITE_URL}`;
    Linking.openURL(`https://wa.me/${waNumber(c.phone)}?text=${encodeURIComponent(msg)}`);
  };
  return (
    <View style={[styles.row, { opacity: 0.85 }]}>
      <Avatar name={c.name} size={40} />
      <Text style={[styles.name, { marginLeft: 12, flex: 1 }]}>{c.name}</Text>
      <Pressable onPress={invite} style={styles.invite} hitSlop={6}>
        <FontAwesome6 name="whatsapp" size={14} color={COLORS.white} />
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 13 }}>Invite</Text>
      </Pressable>
    </View>
  );
}

export default function Contacts() {
  const params = useLocalSearchParams<{ text?: string; links?: string; to?: string }>();
  const { phone, profile } = useAuth();
  const [contacts, setContacts] = useState<AppContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [recents, setRecents] = useState<Record<string, number>>({});
  const [sort, setSort] = useState<Sort>('recent');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>(params.to ? [params.to] : []);
  const alert = useAlert();

  useEffect(() => {
    (async () => {
      setRecents(await loadRecents());
      const raw = await loadPhoneContacts();
      const resolved = await resolveContacts(raw, phone ?? '', (partial) => setContacts(partial));
      // Se rispondo a qualcuno che non è nella mia rubrica, lo aggiungo comunque.
      if (params.to && !resolved.some((c) => c.pub === params.to)) {
        const p = await getProfile(params.to);
        resolved.unshift({ key: params.to, name: p?.name ?? 'Unknown', phone: p?.phone ?? '', pub: params.to });
      }
      setContacts(resolved);
      setLoading(false);
    })();
  }, [phone, params.to]);

  // Se nella ricerca si digita un numero completo che non è in rubrica,
  // lo cerchiamo direttamente su GUN (utile anche per provare l'app nel browser).
  const [extra, setExtra] = useState<AppContact | null>(null);
  useEffect(() => {
    setExtra(null);
    const n = normalizePhone(query);
    if (!n || query.replace(/\D/g, '').length < 8 || contacts.some((c) => c.phone === n)) return;
    let alive = true;
    const t = setTimeout(async () => {
      const pub = await pubForPhone(n);
      if (!alive || !pub) return;
      const p = await getProfile(pub);
      if (alive) setExtra({ key: pub, name: p?.name ?? n, phone: n, pub });
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query, contacts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = contacts.filter((c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q));
    return extra ? [extra, ...base] : base;
  }, [contacts, query, extra]);

  const onPing = useMemo(() => {
    const list = filtered.filter((c) => c.pub);
    return list.sort((a, b) =>
      sort === 'az'
        ? a.name.localeCompare(b.name)
        : (recents[b.pub!] ?? 0) - (recents[a.pub!] ?? 0) || a.name.localeCompare(b.name),
    );
  }, [filtered, sort, recents]);
  const notOnPing = useMemo(
    () => filtered.filter((c) => !c.pub).sort((a, b) => a.name.localeCompare(b.name)),
    [filtered],
  );

  function toggle(pub: string) {
    setSelected((prev) => {
      if (prev.includes(pub)) return prev.filter((x) => x !== pub);
      if (MAX_RECIPIENTS === 1) return [pub];
      return prev.length >= MAX_RECIPIENTS ? prev : [...prev, pub];
    });
  }

  async function send() {
    const content = { text: params.text ?? '', links: JSON.parse(params.links || '{}') };
    try {
      for (const pub of selected) {
        await sendPing(pub, content, profile?.name ?? 'Someone');
        await touchRecent(pub);
      }
      router.dismissAll();
      router.replace('/home');
    } catch (e: any) {
      alert.show(e.message ?? 'Something went wrong, please try again');
    }
  }

  return (
    <Screen back>
      <Text style={styles.title}>Who do you want to ping!</Text>

      <View style={styles.toolbar}>
        <View style={styles.toggle}>
          {(['recent', 'az'] as Sort[]).map((k) => (
            <Pressable key={k} onPress={() => setSort(k)} style={[styles.toggleBtn, sort === k && styles.toggleOn]}>
              <Text style={styles.toggleText}>{k === 'az' ? 'A-Z' : 'Recent'}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.search}>
          <FontAwesome6 name="magnifying-glass" size={13} color={COLORS.textSoft} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search name or number"
            placeholderTextColor={COLORS.textSoft}
            style={{ flex: 1, color: COLORS.white, paddingVertical: 6, marginLeft: 6 }}
          />
        </View>
      </View>

      <FlatList
        data={[...onPing, ...(notOnPing.length ? [{ key: '__header' } as AppContact] : []), ...notOnPing]}
        keyExtractor={(c) => c.key}
        renderItem={({ item }) =>
          item.key === '__header' ? (
            <Text style={styles.sectionHeader}>Not on Ping! yet</Text>
          ) : item.pub ? (
            <ContactRow c={item} selected={selected.includes(item.pub)} onPress={() => toggle(item.pub!)} />
          ) : (
            <InviteRow c={item} myName={profile?.name ?? 'Someone'} />
          )
        }
        ListHeaderComponent={loading ? <ActivityIndicator color={COLORS.white} style={{ marginVertical: 12 }} /> : undefined}
        ListEmptyComponent={
          !loading ? <Text style={styles.empty}>No contacts found. Allow access to your contacts, or type a full mobile number in the search bar.</Text> : undefined
        }
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        style={{ flex: 1 }}
      />

      <View style={{ paddingVertical: 12 }}>
        <SlideToSend onSend={send} disabled={selected.length === 0} />
      </View>
      {alert.node}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: COLORS.white, fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  toggle: { flexDirection: 'row', backgroundColor: COLORS.field, borderRadius: 8, padding: 2 },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  toggleOn: { backgroundColor: COLORS.primaryLight },
  toggleText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.field,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 12 },
  rowSelected: { backgroundColor: COLORS.primaryLight, borderWidth: 1.5, borderColor: COLORS.fieldBorder },
  name: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  sep: { height: 1, backgroundColor: COLORS.fieldBorder, opacity: 0.4, marginLeft: 68 },
  sectionHeader: { color: COLORS.textSoft, fontWeight: '800', marginTop: 18, marginBottom: 6, textTransform: 'uppercase', fontSize: 12 },
  invite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  empty: { color: COLORS.textSoft, textAlign: 'center', marginTop: 30 },
});
