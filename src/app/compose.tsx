/** 6.1 Sending a Ping – User card screen */
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Avatar, Button, Field, Screen, useAlert, styles as ui } from '../components/ui';
import { SocialIcon } from '../components/SocialIcon';
import { useAuth } from '../context/AuthContext';
import { COLORS, MAX_MESSAGE_LENGTH } from '../lib/config';
import { containsUrl, isValidSocialLink, SOCIALS, SocialId } from '../lib/links';

export default function Compose() {
  const { to } = useLocalSearchParams<{ to?: string }>();
  const { profile } = useAuth();
  const [text, setText] = useState('');
  const [links, setLinks] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<SocialId | null>(null);
  const [draft, setDraft] = useState('');
  const alert = useAlert();

  function openLink(id: SocialId) {
    setDraft(links[id] ?? '');
    setEditing(id);
  }

  function saveLink() {
    if (!editing) return;
    const url = draft.trim();
    const next = { ...links };
    if (!url) delete next[editing];
    else if (!isValidSocialLink(editing, url)) {
      const label = SOCIALS.find((s) => s.id === editing)?.label;
      alert.show(`This doesn't look like a ${label} link.`);
      return;
    } else next[editing] = url;
    setLinks(next);
    setEditing(null);
  }

  function onNext() {
    if (containsUrl(text)) {
      alert.show('Links are not allowed in the text. Use the social icons to add a link!');
      return;
    }
    router.push({
      pathname: '/contacts',
      params: { text: text.trim(), links: JSON.stringify(links), ...(to ? { to } : {}) },
    });
  }

  return (
    <Screen back>
      <View style={{ alignItems: 'center', marginTop: 6 }}>
        <View style={{ borderWidth: 3, borderColor: COLORS.white, borderRadius: 999 }}>
          <Avatar uri={profile?.avatar} name={profile?.name} size={72} />
        </View>
      </View>

      <View style={{ marginTop: 18 }}>
        <Field
          placeholder="Enter text here"
          value={text}
          onChangeText={setText}
          maxLength={MAX_MESSAGE_LENGTH}
          multiline
          style={{ minHeight: 70, textAlignVertical: 'top' }}
        />
        <Text style={s.counter}>
          {text.length}/{MAX_MESSAGE_LENGTH}
        </Text>
      </View>

      <Text style={s.addLink}>Add a link!</Text>
      <View style={s.grid}>
        {SOCIALS.map((so) => (
          <View key={so.id} style={{ alignItems: 'center' }}>
            <SocialIcon id={so.id} size={58} onPress={() => openLink(so.id)} dimmed={!links[so.id]} />
            {links[so.id] ? <FontAwesome6 name="check" size={12} color={COLORS.white} style={{ marginTop: 4 }} /> : <View style={{ height: 16 }} />}
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Pressable style={s.next} onPress={onNext}>
        <Text style={s.nextText}>Next</Text>
        <FontAwesome6 name="angles-right" size={14} color={COLORS.white} />
      </Pressable>

      {/* Pop-up per incollare il link del post */}
      <Modal transparent visible={!!editing} animationType="fade" onRequestClose={() => setEditing(null)}>
        <View style={ui.modalBackdrop}>
          <View style={[ui.modalBox, { backgroundColor: COLORS.primaryDark }]}>
            {editing && <SocialIcon id={editing} size={44} />}
            <Text style={[ui.modalMsg, { marginVertical: 10 }]}>
              Paste the link to your {SOCIALS.find((x) => x.id === editing)?.label} post
            </Text>
            <View style={{ alignSelf: 'stretch' }}>
              <Field placeholder="https://…" value={draft} onChangeText={setDraft} autoCapitalize="none" keyboardType="url" />
            </View>
            <Button title="Save" onPress={saveLink} style={{ alignSelf: 'stretch' }} />
            <Button title="Cancel" variant="ghost" onPress={() => setEditing(null)} />
          </View>
        </View>
      </Modal>
      {alert.node}
    </Screen>
  );
}

const s = StyleSheet.create({
  counter: { color: COLORS.textSoft, alignSelf: 'flex-end', marginTop: -6, fontSize: 12 },
  addLink: { color: COLORS.white, fontWeight: '800', fontSize: 17, textAlign: 'center', marginTop: 18, marginBottom: 14 },
  // 3 icone per riga, come nella slide 6.1
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignSelf: 'center', width: 270, columnGap: 24, rowGap: 10 },
  next: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
  },
  nextText: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
});
