/** 3.1 Create a new account screen */
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Avatar, Button, Field, Screen, Title, useAlert } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { normalizePhone } from '../lib/phone';
import { pickAvatar } from '../lib/avatar';
import { COLORS } from '../lib/config';

/** Accetta gg/mm/aaaa e verifica che la data sia reale. */
function validDob(s: string) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return false;
  const [d, mo, y] = [+m[1], +m[2], +m[3]];
  const dt = new Date(y, mo - 1, d);
  return dt.getDate() === d && dt.getMonth() === mo - 1 && y > 1900 && dt < new Date();
}

export default function SignUp() {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  async function onCreate() {
    const p = normalizePhone(phone);
    if (!name.trim()) return alert.show('Please enter your name');
    if (!validDob(dob)) return alert.show('Please enter a valid date of birth (dd/mm/yyyy)');
    if (!p) return alert.show('Please enter a valid mobile number');
    if (password.length < 8) return alert.show('The password must be at least 8 characters long');
    if (password !== confirm) return alert.show("The password provided doesn't match the confirmed one");
    setLoading(true);
    try {
      const code = await signUp({ name, dob, phone: p, password, avatar });
      router.replace({ pathname: '/recovery-code', params: { code } });
    } catch (e: any) {
      alert.show(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen back>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 24 }}>
        <Title>Create a new account</Title>
        <Field placeholder="Name" value={name} onChangeText={setName} autoCapitalize="words" />
        <Field placeholder="Date of birth (dd/mm/yyyy)" value={dob} onChangeText={setDob} keyboardType="numbers-and-punctuation" />
        <Field placeholder="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
        <Field placeholder="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />

        <Pressable onPress={async () => setAvatar((await pickAvatar()) ?? avatar)} style={{ alignItems: 'center', marginVertical: 14 }}>
          {avatar ? (
            <Avatar uri={avatar} size={110} />
          ) : (
            <View style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 1.5, borderColor: COLORS.fieldBorder, backgroundColor: COLORS.field, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: COLORS.textSoft, textAlign: 'center', fontSize: 13 }}>Upload{'\n'}profile{'\n'}picture</Text>
            </View>
          )}
        </Pressable>

        <Button title="Create a new account" onPress={onCreate} loading={loading} />
      </ScrollView>
      {alert.node}
    </Screen>
  );
}
