/** 8.1 User profile screen — modifica nome, data di nascita e foto */
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Avatar, Button, Field, Screen, Title, useAlert } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../lib/profile';
import { pickAvatar } from '../lib/avatar';
import { COLORS } from '../lib/config';

export default function ProfileScreen() {
  const { profile, refreshProfile, phone } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [dob, setDob] = useState(profile?.dob ?? '');
  const [avatar, setAvatar] = useState<string | null | undefined>(profile?.avatar);
  const [editing, setEditing] = useState<'name' | 'dob' | null>(null);
  const [saving, setSaving] = useState(false);
  const alert = useAlert();

  useEffect(() => {
    setName(profile?.name ?? '');
    setDob(profile?.dob ?? '');
    setAvatar(profile?.avatar);
  }, [profile]);

  const dirty = name !== (profile?.name ?? '') || dob !== (profile?.dob ?? '') || avatar !== profile?.avatar;

  async function save() {
    if (!name.trim()) return alert.show('Name cannot be empty');
    setSaving(true);
    try {
      await updateMyProfile({ name: name.trim(), dob, avatar: avatar ?? null });
      await refreshProfile();
      setEditing(null);
    } catch (e: any) {
      alert.show(e.message);
    } finally {
      setSaving(false);
    }
  }

  const pen = (k: 'name' | 'dob') => (
    <Pressable onPress={() => setEditing(k)} hitSlop={10}>
      <FontAwesome6 name="pen" size={14} color={COLORS.white} />
    </Pressable>
  );

  return (
    <Screen back>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Title>Your profile</Title>
        <Pressable
          style={{ alignSelf: 'center', marginBottom: 20 }}
          onPress={async () => setAvatar((await pickAvatar()) ?? avatar)}
        >
          <View style={{ borderWidth: 3, borderColor: COLORS.white, borderRadius: 999 }}>
            <Avatar uri={avatar} name={name} size={110} />
          </View>
          <View style={{ position: 'absolute', right: 4, bottom: 4, backgroundColor: COLORS.primaryDark, borderRadius: 14, padding: 7 }}>
            <FontAwesome6 name="pen" size={12} color={COLORS.white} />
          </View>
        </Pressable>
        <Field label="Name" value={name} onChangeText={setName} editable={editing === 'name'} right={pen('name')} />
        <Field label="Date of birth" value={dob} onChangeText={setDob} editable={editing === 'dob'} right={pen('dob')} />
        <Field label="Mobile number" value={phone ?? ''} editable={false} />
        <Text style={{ color: COLORS.textSoft, fontSize: 12, marginBottom: 16 }}>
          Your mobile number is your Ping! identity and cannot be changed.
        </Text>
        {dirty && <Button title="Save changes" onPress={save} loading={saving} />}
      </ScrollView>
      {alert.node}
    </Screen>
  );
}
