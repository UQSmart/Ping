/** Ping salvati localmente dall'utente (opzione prevista nella slide 3) */
import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Avatar, Screen, Title } from '../components/ui';
import { useProfile } from '../hooks/useGun';
import { loadSavedPings, SavedPing } from '../lib/storage';
import { COLORS } from '../lib/config';

function Row({ p }: { p: SavedPing }) {
  const prof = useProfile(p.fromPub);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/ping/[id]', params: { id: p.id, saved: '1' } })}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
    >
      <Avatar uri={prof?.avatar} name={p.fromName} size={46} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: COLORS.white, fontWeight: '700', fontSize: 16 }}>{p.fromName}</Text>
        <Text style={{ color: COLORS.textSoft }} numberOfLines={1}>
          {p.text || 'Ping!'} · {new Date(p.ts).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
}

export default function Saved() {
  const [items, setItems] = useState<SavedPing[]>([]);
  useFocusEffect(
    useCallback(() => {
      loadSavedPings().then(setItems);
    }, []),
  );
  return (
    <Screen back>
      <Title>Saved pings</Title>
      <FlatList
        data={items}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <Row p={item} />}
        ListEmptyComponent={<Text style={{ color: COLORS.textSoft, textAlign: 'center' }}>No saved pings yet.</Text>}
      />
    </Screen>
  );
}
