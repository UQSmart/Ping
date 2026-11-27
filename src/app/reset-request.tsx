/** 4.1 Password reset screen – Send request (con codice di recupero invece dell'SMS) */
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Title, useAlert } from '../components/ui';
import { recoverWithCode } from '../lib/auth';
import { normalizePhone } from '../lib/phone';
import { COLORS } from '../lib/config';

export default function ResetRequest() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const alert = useAlert();

  async function onNext() {
    const p = normalizePhone(phone);
    if (!p) return alert.show('Please enter a valid mobile number');
    setLoading(true);
    try {
      await recoverWithCode(p, code);
      router.replace({ pathname: '/reset-password', params: { phone: p } });
    } catch (e: any) {
      alert.show(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen back>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Title>Reset your password</Title>
        <Field placeholder="Mobile number" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <Field placeholder="Enter password reset code" autoCapitalize="characters" value={code} onChangeText={setCode} />
        <Text style={{ color: COLORS.textSoft, fontSize: 13, marginBottom: 14, textAlign: 'center' }}>
          Use the recovery code you received when you created your account.
        </Text>
        <Button title="Change password" onPress={onNext} loading={loading} disabled={!phone || !code} />
      </View>
      {alert.node}
    </Screen>
  );
}
