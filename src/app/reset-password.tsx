/** 4.2 Password reset screen – Change password */
import React, { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Field, Screen, Title, useAlert } from '../components/ui';
import { setNewPassword } from '../lib/auth';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { markSignedIn } = useAuth();
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  async function onChange() {
    if (pass.length < 8) return alert.show('The password must be at least 8 characters long');
    if (pass !== confirm) return alert.show("Passwords don't match");
    setLoading(true);
    try {
      await setNewPassword(phone, pass);
      markSignedIn(phone); // come da slide: dopo il cambio si va alla main screen
    } catch (e: any) {
      alert.show(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Title>Reset your password</Title>
        <Field placeholder="New password" secureTextEntry value={pass} onChangeText={setPass} />
        <Field placeholder="Confirm new password" secureTextEntry value={confirm} onChangeText={setConfirm} />
        <Button title="Change password" onPress={onChange} loading={loading} />
      </View>
      {alert.node}
    </Screen>
  );
}
