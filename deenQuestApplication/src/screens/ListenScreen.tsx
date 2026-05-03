import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, RADIUS } from '../theme';

export default function ListenScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Image source={require('../../elementsApp/listening-removebg-preview.png')} style={styles.character} />
        <Text style={styles.title}>Listen</Text>
        <Text style={styles.sub}>Full surah playback with word-by-word highlighting.</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Coming soon</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  character: { width: 140, height: 140, resizeMode: 'contain', marginBottom: 8 },
  title: { color: COLORS.text, fontSize: 26, fontWeight: '800' },
  sub: { color: COLORS.textSub, fontSize: 15, textAlign: 'center', paddingHorizontal: 40 },
  badge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    marginTop: 4,
  },
  badgeText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});
