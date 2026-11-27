import React from 'react';
import { Pressable, View } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { SOCIALS, SocialId } from '../lib/links';

/** Quadratino con l'icona del social (come nelle slide 6.1 / 7.1). */
export function SocialIcon({
  id, size = 44, onPress, dimmed,
}: {
  id: SocialId;
  size?: number;
  onPress?: () => void;
  dimmed?: boolean;
}) {
  const s = SOCIALS.find((x) => x.id === id)!;
  return (
    <Pressable onPress={onPress} disabled={!onPress} hitSlop={6} accessibilityLabel={s.label} accessibilityRole="button">
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.22,
          backgroundColor: s.color,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: dimmed ? 0.35 : 1,
          borderWidth: 2,
          borderColor: 'white',
        }}
      >
        <FontAwesome6 name={s.icon as any} size={size * 0.5} color="white" />
      </View>
    </Pressable>
  );
}
