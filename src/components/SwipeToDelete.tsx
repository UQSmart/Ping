/**
 * Riga che si può trascinare a sinistra per eliminare il ping senza vederlo
 * (slide 5.1). Realizzata con PanResponder + Animated.
 */
import React, { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { COLORS } from '../lib/config';

export function SwipeToDelete({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const x = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderMove: (_e, g) => x.setValue(Math.min(0, g.dx)),
      onPanResponderRelease: (_e, g) => {
        if (g.dx < -120) {
          Animated.timing(x, { toValue: -500, duration: 180, useNativeDriver: true }).start(onDelete);
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
    }),
  ).current;

  return (
    <View>
      <View style={styles.behind}>
        <FontAwesome6 name="trash" size={18} color={COLORS.white} />
      </View>
      <Animated.View style={{ transform: [{ translateX: x }] }} {...pan.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  behind: {
    ...StyleSheet.absoluteFill,
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 24,
  },
});
