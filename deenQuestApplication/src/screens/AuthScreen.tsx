import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator, Image, ImageBackground, KeyboardAvoidingView,
  Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../lib/firebase';
import { COLORS, RADIUS, SHADOW } from '../theme';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please fill in all fields.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(cred.user, { displayName: name.trim() });
        await setDoc(doc(db, 'users', cred.user.uid), {
          name: name.trim(),
          email: email.trim(),
          xp: 0,
          streak: 0,
          tasksCompleted: 0,
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          goal: null,
          level: null,
          timePerDay: null,
          quranProgress: null,
          currentDay: 1,
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (e: any) {
      const msg: Record<string, string> = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
      };
      setError(msg[e.code] ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setName(''); setEmail(''); setPassword('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ImageBackground
        source={require('../../elementsApp/mainBg.png')}
        style={styles.bg}
        imageStyle={{ opacity: 0.07 }}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Image
                source={require('../../elementsApp/waving_onboarding-removebg-preview.png')}
                style={styles.char}
              />
              <Text style={styles.appName}>DeenQuest</Text>
              <Text style={styles.tagline}>
                {mode === 'signin' ? 'Welcome back 👋' : 'Create your account'}
              </Text>
            </View>

            {/* Card */}
            <View style={styles.card}>
              {mode === 'signup' && (
                <Field
                  icon={<User size={16} color={COLORS.textMuted} />}
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                />
              )}
              <Field
                icon={<Mail size={16} color={COLORS.textMuted} />}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <View style={styles.field}>
                <Lock size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={8}>
                  {showPw
                    ? <EyeOff size={16} color={COLORS.textMuted} />
                    : <Eye size={16} color={COLORS.textMuted} />}
                </Pressable>
              </View>

              {error !== '' && <Text style={styles.error}>{error}</Text>}

              <Pressable
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={COLORS.white} />
                  : <Text style={styles.submitText}>
                      {mode === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>}
              </Pressable>

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </Text>
                <Pressable onPress={switchMode} hitSlop={8}>
                  <Text style={styles.switchLink}>
                    {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

function Field({
  icon, placeholder, value, onChangeText, keyboardType, autoCapitalize,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View style={styles.field}>
      {icon}
      <TextInput
        style={styles.fieldInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textMuted}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  bg: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },

  header: { alignItems: 'center', gap: 8 },
  char: { width: 130, height: 130, resizeMode: 'contain' },
  appName: { color: COLORS.primaryDark, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline: { color: COLORS.textSub, fontSize: 16 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    padding: 20,
    gap: 14,
    ...SHADOW.strong,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldInput: { flex: 1, color: COLORS.text, fontSize: 15 },

  error: {
    color: COLORS.error,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOW.glow(COLORS.primary),
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },

  switchRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  switchLabel: { color: COLORS.textMuted, fontSize: 14 },
  switchLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
});
