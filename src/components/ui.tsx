/**
 * Componenti grafici di base, con il look & feel della presentazione
 * (sfondo viola, campi più scuri con bordo chiaro, testo bianco).
 */
import React from 'react';
import {
  ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { COLORS } from '../lib/config';

export function PingLogo({ size = 44 }: { size?: number }) {
  return <Text style={[styles.logo, { fontSize: size }]}>Ping!</Text>;
}

type ScreenProps = {
  children: React.ReactNode;
  back?: boolean;
  logo?: boolean;
  left?: React.ReactNode;
  style?: ViewStyle;
};
/** Contenitore di ogni schermata: sfondo viola, area sicura, logo e freccia "indietro". */
export function Screen({ children, back, logo = true, left, style }: ScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View style={styles.headerSide}>
          {back ? (
            <Pressable hitSlop={12} onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}>
              <FontAwesome6 name="arrow-left" size={22} color={COLORS.white} />
            </Pressable>
          ) : (
            left
          )}
        </View>
        {logo ? <PingLogo size={36} /> : <View />}
        <View style={styles.headerSide} />
      </View>
      <View style={[{ flex: 1, paddingHorizontal: 20 }, style]}>{children}</View>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Field(props: TextInputProps & { label?: string; right?: React.ReactNode }) {
  const { label, right, style, ...rest } = props;
  return (
    <View style={{ marginBottom: 12 }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <View style={styles.field}>
        <TextInput
          placeholderTextColor={COLORS.textSoft}
          style={[styles.fieldInput, style]}
          autoCorrect={false}
          {...rest}
        />
        {right}
      </View>
    </View>
  );
}

export function Button({
  title, onPress, loading, disabled, variant = 'solid', style,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'solid' | 'ghost';
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        variant === 'solid' ? styles.btn : styles.btnGhost,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.75 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={variant === 'solid' ? styles.btnText : styles.btnGhostText}>{title}</Text>
      )}
    </Pressable>
  );
}

/** Foto profilo rotonda; se manca mostra le iniziali. */
export function Avatar({ uri, name, size = 48 }: { uri?: string | null; name?: string; size?: number }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const box = { width: size, height: size, borderRadius: size / 2 };
  return uri ? (
    <Image source={{ uri }} style={[box, { backgroundColor: COLORS.primaryLight }]} />
  ) : (
    <View style={[box, styles.avatarFallback]}>
      <Text style={{ color: COLORS.white, fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

/** Pop-up d'errore come "Unable to log in" (slide 2.1). */
export function AlertModal({
  visible, title, message, onClose, closeLabel = 'Close',
}: {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  closeLabel?: string;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalBox}>
          {title ? <Text style={styles.modalTitle}>{title}</Text> : null}
          <Text style={styles.modalMsg}>{message}</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={styles.modalClose}>{closeLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/** Hook di comodo per mostrare il pop-up d'errore. */
export function useAlert() {
  const [state, setState] = React.useState<{ title?: string; message: string } | null>(null);
  const node = (
    <AlertModal
      visible={!!state}
      title={state?.title}
      message={state?.message ?? ''}
      onClose={() => setState(null)}
    />
  );
  return { show: (message: string, title?: string) => setState({ message, title }), node };
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerSide: { width: 44, alignItems: 'flex-start' },
  logo: {
    color: COLORS.white,
    fontWeight: '900',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.12)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  title: { color: COLORS.white, fontSize: 18, fontWeight: '800', textAlign: 'center', marginVertical: 16 },
  fieldLabel: { color: COLORS.white, fontSize: 12, marginBottom: 4, marginLeft: 4, opacity: 0.85 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.field,
    borderColor: COLORS.fieldBorder,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  fieldInput: { flex: 1, color: COLORS.white, fontSize: 16, paddingVertical: 12 },
  btn: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: '800' },
  btnGhost: { paddingVertical: 12, alignItems: 'center' },
  btnGhostText: { color: COLORS.white, fontSize: 15, textDecorationLine: 'underline' },
  avatarFallback: { backgroundColor: COLORS.primaryDark, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, backgroundColor: COLORS.overlay, alignItems: 'center', justifyContent: 'center', padding: 40 },
  modalBox: {
    backgroundColor: '#EBA9F2',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 22,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: { color: COLORS.white, fontWeight: '800', fontSize: 17, marginBottom: 8 },
  modalMsg: { color: COLORS.white, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  modalClose: { color: COLORS.white, fontWeight: '800', marginTop: 16, fontSize: 15 },
});
