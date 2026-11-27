/**
 * La "card" del ping: foto profilo con i cerchi concentrici, nome, messaggio
 * e icone dei social. Quando `bounce` è vero l'immagine "rimbalza" un paio
 * di volte (slide 5 e 7.1).
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Avatar } from './ui';
import { SocialIcon } from './SocialIcon';
import { COLORS } from '../lib/config';
import { SOCIALS, SocialId } from '../lib/links';

type Props = {
  name: string;
  avatar?: string | null;
  text?: string;
  links?: Record<string, string>;
  bounce?: boolean;
  onPressLink?: (id: SocialId, url: string) => void;
  size?: number;
};

export function PingCard({ name, avatar, text, links = {}, bounce, onPressLink, size = 150 }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!bounce) return;
    const hop = (to: number) =>
      Animated.timing(scale, { toValue: to, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true });
    Animated.sequence([hop(1.15), hop(0.95), hop(1.12), hop(0.97), hop(1)]).start();
  }, [bounce, scale]);

  const ring = (d: number, o: number) => ({
    width: d,
    height: d,
    borderRadius: d / 2,
    borderWidth: 2,
    borderColor: `rgba(255,255,255,${o})`,
    backgroundColor: `rgba(255,255,255,${o * 0.12})`,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  });

  const present = SOCIALS.filter((s) => links[s.id]);

  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={ring(size * 1.75, 0.35)}>
          <View style={ring(size * 1.35, 0.6)}>
            <View style={styles.avatarBorder}>
              <Avatar uri={avatar} name={name} size={size} />
            </View>
          </View>
        </View>
      </Animated.View>
      <Text style={styles.name}>{name}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {present.length > 0 && (
        <View style={styles.links}>
          {present.map((s) => (
            <SocialIcon key={s.id} id={s.id} size={40} onPress={() => onPressLink?.(s.id as SocialId, links[s.id])} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBorder: { borderRadius: 999, borderWidth: 4, borderColor: COLORS.white },
  name: { color: COLORS.white, fontSize: 24, fontWeight: '800', marginTop: 18 },
  text: { color: COLORS.white, fontSize: 17, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  links: { flexDirection: 'row', gap: 10, marginTop: 20, flexWrap: 'wrap', justifyContent: 'center' },
});
