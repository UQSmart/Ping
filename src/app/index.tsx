/**
 * 1. Opening screen (slide 10): logo su sfondo viola, mostrato il tempo
 * necessario a ripristinare la sessione (minimo ~1 secondo).
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PingLogo } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../lib/config';

export default function Opening() {
  const { status } = useAuth();
  const [minTimePassed, setMinTimePassed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 1000);
    return () => clearTimeout(t);
  }, []);

  if (minTimePassed && status !== 'loading') {
    return <Redirect href={status === 'signedIn' ? '/home' : '/login'} />;
  }
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
      <StatusBar style="light" />
      <PingLogo size={88} />
    </View>
  );
}
