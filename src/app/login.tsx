/** 2.1 Sign-up / log-in screen */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, useAlert } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { normalizePhone } from '../lib/phone';

export default function Login() {
  const { logIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  async function onLogin() {
    const p = normalizePhone(phone);
    if (!p || !password) {
      alert.show('Either the mobile number or the password entered are not recognised, please try again', 'Unable to log in');
      return;
    }
    setLoading(true);
    try {
      await logIn(p, password); // il layout porta automaticamente alla Main screen
    } catch (e: any) {
      alert.show(e.message, 'Unable to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Field placeholder="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
          <Field placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Log In" onPress={onLogin} loading={loading} />
          <Button title="Forgotten Password" variant="ghost" onPress={() => router.push('/reset-request')} />
        </View>
        <Button title="Create a new account" onPress={() => router.push('/signup')} style={{ marginBottom: 12 }} />
      </KeyboardAvoidingView>
      {alert.node}
    </Screen>
  );
}
