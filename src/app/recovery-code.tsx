/**
 * Mostrata UNA volta dopo la registrazione: il codice di recupero.
 * Sostituisce l'SMS della presentazione (che richiederebbe un server).
 */
import React from 'react';
import { Share, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Button, Screen, Title } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../lib/config';

export default function RecoveryCode() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const { phone, markSignedIn } = useAuth();

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Title>Your recovery code</Title>
        <Text style={{ color: COLORS.white, textAlign: 'center', marginBottom: 20, lineHeight: 21 }}>
          Ping! has no servers, so we can't send you an SMS to reset your password.{'\n'}
          Write this code down and keep it safe: it's the only way to recover your account.
        </Text>
        <View style={{ backgroundColor: COLORS.field, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.fieldBorder, padding: 18 }}>
          <Text selectable style={{ color: COLORS.white, fontSize: 28, fontWeight: '900', textAlign: 'center', letterSpacing: 2 }}>
            {code}
          </Text>
        </View>
        <Button title="Share / copy" variant="ghost" onPress={() => Share.share({ message: `Ping! recovery code: ${code}` })} />
      </View>
      <Button
        title="I saved it, continue"
        onPress={() => {
          if (phone) markSignedIn(phone); // il layout porta alla Main screen
        }}
        style={{ marginBottom: 12 }}
      />
    </Screen>
  );
}
