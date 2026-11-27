/**
 * Barra "Ping! >>>" da trascinare verso destra per inviare (slide 6.2).
 * Realizzata con PanResponder + Animated del core di React Native.
 */
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Animated, PanResponder, StyleSheet, Text, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../lib/config';

const KNOB = 110;

export function SlideToSend({ onSend, disabled }: { onSend: () => Promise<void>; disabled?: boolean }) {
  const x = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);
  const [busy, setBusy] = useState(false);
  const max = Math.max(1, width - KNOB - 8);
  const maxRef = useRef(max);
  maxRef.current = max;
  const lockRef = useRef(false);
  lockRef.current = !!disabled || busy;

  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

  const reset = () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !lockRef.current,
      onStartShouldSetPanResponderCapture: () => !lockRef.current,
      onMoveShouldSetPanResponder: (_e, g) => !lockRef.current && Math.abs(g.dx) > 4,
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_e, g) => x.setValue(Math.min(Math.max(0, g.dx), maxRef.current)),
      onPanResponderRelease: async (_e, g) => {
        if (g.dx > maxRef.current * 0.85) {
          Animated.timing(x, { toValue: maxRef.current, duration: 80, useNativeDriver: true }).start();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
          setBusy(true);
          try {
            await onSendRef.current();
          } finally {
            setBusy(false);
            reset();
          }
        } else reset();
      },
      onPanResponderTerminate: reset,
    }),
  ).current;
  return (
    <View
      style={[styles.track, disabled && { opacity: 0.5 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Text selectable={false} style={styles.hint}>{busy ? 'Sending…' : 'Slide to ping'}</Text>
      <Animated.View
        testID="slide-knob"
        accessibilityLabel="Slide to ping"
        style={[styles.knob, { transform: [{ translateX: x }] }]}
        {...pan.panHandlers}
      >
        {busy ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            <Text selectable={false} style={styles.knobText}>Ping!</Text>
            <FontAwesome6 name="angles-right" size={16} color={COLORS.white} />
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
    justifyContent: 'center',
    padding: 4,
  },
  hint: { position: 'absolute', alignSelf: 'center', color: COLORS.white, opacity: 0.8, fontWeight: '600' },
  knob: {
    userSelect: 'none',
    width: KNOB,
    height: 46,
    borderRadius: 11,
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  knobText: { color: COLORS.white, fontWeight: '900', fontSize: 18 },
});
