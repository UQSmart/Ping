/** 9.1 Settings screen */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Href, router } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../lib/config';

const ITEMS: { label: string; href: Href }[] = [
  { label: 'Profile and personal details', href: '/profile' },
  { label: 'Password and security', href: '/change-password' },
  { label: 'General preferences', href: '/preferences' },
  { label: 'Notifications', href: '/preferences' },
  { label: 'Saved pings', href: '/saved' },
];

export default function Settings() {
  const { logOut } = useAuth();
  return (
    <Screen back>
      <Title>Settings</Title>
      <View style={styles.box}>
        {ITEMS.map((it) => (
          <Pressable key={it.label} style={styles.item} onPress={() => router.push(it.href)}>
            <Text style={styles.text}>{it.label}</Text>
            <FontAwesome6 name="chevron-right" size={12} color={COLORS.textSoft} />
          </Pressable>
        ))}
        <Pressable style={[styles.item, { borderBottomWidth: 0 }]} onPress={logOut}>
          <Text style={styles.text}>Log out</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: { backgroundColor: COLORS.field, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.fieldBorder, paddingHorizontal: 14 },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
  },
  text: { color: COLORS.white, fontSize: 15, fontWeight: '600' },
});
