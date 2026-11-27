/** Password and security: cambio password da utente loggato */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Title, useAlert } from '../components/ui';
import { changePassword } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function ChangePassword() {
  const { phone } = useAuth();
  const [current, setCurrent] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  async function onChange() {
    if (pass.length < 8) return alert.show('The password must be at least 8 characters long');
    if (pass !== confirm) return alert.show("Passwords don't match");
    setLoading(true);
    try {
      await changePassword(phone!, current, pass);
      router.back();
    } catch (e: any) {
      alert.show(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen back>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Title>Change your password</Title>
        <Field placeholder="Current password" secureTextEntry value={current} onChangeText={setCurrent} />
        <Field placeholder="New password" secureTextEntry value={pass} onChangeText={setPass} />
        <Field placeholder="Confirm new password" secureTextEntry value={confirm} onChangeText={setConfirm} />
        <Button title="Change password" onPress={onChange} loading={loading} />
      </View>
      {alert.node}
    </Screen>
  );
}
