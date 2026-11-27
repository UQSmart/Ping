/** 7.1 Received pings — il ping visualizzato (poi sparisce) */
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Screen } from '../../components/ui';
import { PingCard } from '../../components/PingCard';
import { usePings } from '../../context/PingsContext';
import { useSettings } from '../../context/SettingsContext';
import { useProfile } from '../../hooks/useGun';
import { ReceivedPing } from '../../lib/pings';
import { deleteSavedPing, loadSavedPings, savePingLocally } from '../../lib/storage';
import { COLORS } from '../../lib/config';

export default function PingView() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const fromSaved = saved === '1';
  const { getPing, removePing } = usePings();
  const { settings, update } = useSettings();
  // "Fotografiamo" il ping all'apertura: dopo verrà cancellato dal grafo.
  const [ping, setPing] = useState<ReceivedPing | undefined>(() => (fromSaved ? undefined : getPing(id)));
  const [isSaved, setIsSaved] = useState(fromSaved);
  const sender = useProfile(ping?.fromPub);
  const player = useAudioPlayer(require('../../../assets/ping.wav'));
  const played = useRef(false);

  useEffect(() => {
    if (fromSaved) loadSavedPings().then((all) => setPing(all.find((p) => p.id === id) as any));
  }, [fromSaved, id]);

  // Suono "ping" + vibrazione quando il ping viene mostrato.
  useEffect(() => {
    if (!ping || played.current || fromSaved) return;
    played.current = true;
    if (settings.sound) {
      try {
        player.seekTo(0);
        player.play();
      } catch {}
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  }, [ping, settings.sound, player, fromSaved]);

  // Un ping è transitorio: quando l'utente esce dalla schermata viene eliminato.
  useEffect(() => {
    return () => {
      if (!fromSaved) removePing(id);
    };
  }, [id, fromSaved, removePing]);

  if (!ping) {
    return (
      <Screen back>
        <Text style={{ color: COLORS.white, textAlign: 'center', marginTop: 40 }}>
          This ping is no longer available.
        </Text>
      </Screen>
    );
  }

  async function toggleSave() {
    if (!ping) return;
    if (isSaved) {
      await deleteSavedPing(ping.id);
      setIsSaved(false);
      if (fromSaved) router.back();
    } else {
      await savePingLocally({
        id: ping.id, fromPub: ping.fromPub, fromName: ping.fromName, text: ping.text, links: ping.links, ts: ping.ts,
      });
      setIsSaved(true);
    }
  }

  return (
    <Screen back>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <PingCard
          name={ping.fromName}
          avatar={sender?.avatar}
          text={ping.text}
          links={ping.links}
          bounce={!fromSaved}
          onPressLink={(_sid, url) => Linking.openURL(url)}
        />
      </View>
      <View style={styles.actions}>
        <Action icon="bookmark" label={isSaved ? 'Saved' : 'Save'} onPress={toggleSave} />
        <Action
          icon="reply"
          label="Ping back"
          onPress={() => router.replace({ pathname: '/compose', params: { to: ping.fromPub } })}
        />
        <Action icon="xmark" label="Close" onPress={() => router.back()} />
      </View>
      {!fromSaved && (
        <Pressable
          onPress={() => {
            update({ blocked: [...new Set([...settings.blocked, ping.fromPub])] });
            router.back();
          }}
          style={{ alignSelf: 'center', paddingBottom: 10 }}
        >
          <Text style={{ color: COLORS.textSoft, textDecorationLine: 'underline' }}>Block {ping.fromName}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

function Action({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.action} hitSlop={8}>
      <FontAwesome6 name={icon as any} size={20} color={COLORS.white} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 18 },
  action: { alignItems: 'center', gap: 6, minWidth: 80 },
  actionText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});
