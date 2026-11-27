/** 5.1 Main screen — "Who pinged me?" */
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Avatar, Screen } from '../components/ui';
import { SwipeToDelete } from '../components/SwipeToDelete';
import { useAuth } from '../context/AuthContext';
import { usePings } from '../context/PingsContext';
import { useProfile } from '../hooks/useGun';
import { ReceivedPing } from '../lib/pings';
import { COLORS } from '../lib/config';

function timeLabel(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function PingRow({ p, onDelete }: { p: ReceivedPing; onDelete: () => void }) {
  const sender = useProfile(p.fromPub); // foto profilo letta live dal grafo GUN
  return (
    <SwipeToDelete onDelete={onDelete}>
      <View style={styles.row}>
        <Pressable style={styles.rowMain} onPress={() => router.push(`/ping/${p.id}`)}>
          <Avatar uri={sender?.avatar} name={p.fromName} size={52} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.rowName}>{p.fromName}</Text>
            <Text style={styles.rowTime}>{timeLabel(p.ts)}</Text>
          </View>
        </Pressable>
        {/* Freccia con logo: rispondi con un ping al mittente */}
        <Pressable
          hitSlop={10}
          style={styles.reply}
          onPress={() => router.push({ pathname: '/compose', params: { to: p.fromPub } })}
        >
          <FontAwesome6 name="reply" size={14} color={COLORS.primary} />
          <Text style={styles.replyP}>P</Text>
        </Pressable>
      </View>
    </SwipeToDelete>
  );
}

export default function Home() {
  const { profile } = useAuth();
  const { pings, removePing } = usePings();

  return (
    <Screen
      left={
        <Pressable onPress={() => router.push('/settings')} hitSlop={10}>
          <Avatar uri={profile?.avatar} name={profile?.name} size={36} />
        </Pressable>
      }
    >
      {/* Pulsante grande "P": crea un nuovo ping */}
      <Pressable style={styles.bigP} onPress={() => router.push('/compose')} accessibilityLabel="New ping">
        <Text style={styles.bigPText}>P</Text>
      </Pressable>

      <Text style={styles.section}>Who pinged me?</Text>
      <View style={styles.divider} />

      <FlatList
        data={pings}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <PingRow p={item} onDelete={() => removePing(item.id)} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={<Text style={styles.empty}>No new pings. Why not ping someone?</Text>}
        contentContainerStyle={{ paddingBottom: 30, paddingTop: 10 }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bigP: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  bigPText: { color: COLORS.primary, fontSize: 58, fontWeight: '900', marginTop: -4 },
  section: { color: COLORS.white, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  divider: { height: 1.5, backgroundColor: COLORS.fieldBorder, marginTop: 10, opacity: 0.7 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 6,
  },
  rowMain: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowName: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  rowTime: { color: COLORS.textSoft, fontSize: 13, marginTop: 2 },
  reply: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  replyP: { color: COLORS.primary, fontWeight: '900', fontSize: 15 },
  empty: { color: COLORS.textSoft, textAlign: 'center', marginTop: 40 },
});
