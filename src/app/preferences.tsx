/** General preferences + Notifications (salvate solo sul telefono, slide 9.2) */
import React from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen, Title, Avatar } from '../components/ui';
import { useSettings } from '../context/SettingsContext';
import { useProfile } from '../hooks/useGun';
import { COLORS } from '../lib/config';

function BlockedRow({ pub, onUnblock }: { pub: string; onUnblock: () => void }) {
  const p = useProfile(pub);
  return (
    <View style={styles.row}>
      <Avatar uri={p?.avatar} name={p?.name} size={34} />
      <Text style={[styles.label, { flex: 1, marginLeft: 10 }]}>{p?.name ?? '…'}</Text>
      <Pressable onPress={onUnblock} hitSlop={8}>
        <Text style={{ color: COLORS.white, fontWeight: '800' }}>Unblock</Text>
      </Pressable>
    </View>
  );
}

export default function Preferences() {
  const { settings, update } = useSettings();
  return (
    <Screen back>
      <Title>General preferences</Title>
      <View style={styles.box}>
        <View style={styles.row}>
          <Text style={[styles.label, { flex: 1 }]}>Sound effects</Text>
          <Switch value={settings.sound} onValueChange={(v) => update({ sound: v })} />
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={[styles.label, { flex: 1 }]}>Notify me of new pings</Text>
          <Switch value={settings.notifications} onValueChange={(v) => update({ notifications: v })} />
        </View>
      </View>

      <Text style={styles.section}>Blocked users</Text>
      <View style={styles.box}>
        {settings.blocked.length === 0 ? (
          <Text style={[styles.label, { paddingVertical: 14, opacity: 0.7 }]}>Nobody is blocked.</Text>
        ) : (
          settings.blocked.map((pub) => (
            <BlockedRow key={pub} pub={pub} onUnblock={() => update({ blocked: settings.blocked.filter((x) => x !== pub) })} />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: COLORS.field, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.fieldBorder, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.25)' },
  label: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
  section: { color: COLORS.white, fontWeight: '800', marginTop: 24, marginBottom: 8 },
});
