import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../components/AuthProvider";

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    if (isSignUp && !name.trim()) { setError("Please enter your name."); return; }
    setLoading(true);
    try {
      if (isSignUp) await signUp(email.trim(), password, name.trim());
      else await signIn(email.trim(), password);
    } catch (e: any) {
      setError(e.message?.replace("Firebase: ", "") || "Authentication failed.");
    }
    setLoading(false);
  }

  return (
    <LinearGradient colors={["#0F1639", "#15173D", "#1a0a2e"]} style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.flex}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo area */}
          <View style={s.hero}>
            <View style={s.logoBox}>
              <Text style={s.logoEmoji}>🕌</Text>
            </View>
            <Text style={s.appName}>DeenQuest</Text>
            <Text style={s.tagline}>Your Journey Back to the Quran</Text>
          </View>

          {/* Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{isSignUp ? "Create Account" : "Welcome Back"}</Text>

            {isSignUp && (
              <View style={s.inputWrapper}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            )}

            <View style={s.inputWrapper}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={s.inputWrapper}>
              <Text style={s.label}>Password</Text>
              <TextInput
                style={s.input}
                placeholder="Min. 6 characters"
                placeholderTextColor="rgba(255,255,255,0.35)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? <Text style={s.error}>{error}</Text> : null}

            <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
              <LinearGradient colors={["#982598", "#7a1e7a"]} style={s.btnGrad}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnText}>{isSignUp ? "Create Account" : "Sign In"}</Text>}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setError(""); }} style={s.switchRow}>
              <Text style={s.switchText}>
                {isSignUp ? "Already have an account? " : "Don't have an account? "}
                <Text style={s.switchLink}>{isSignUp ? "Sign In" : "Sign Up"}</Text>
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  hero: { alignItems: "center", marginBottom: 36 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: "#982598", alignItems: "center", justifyContent: "center", marginBottom: 16, shadowColor: "#982598", shadowOpacity: 0.5, shadowRadius: 20, elevation: 10 },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 32, fontWeight: "700", color: "#fff", letterSpacing: 1 },
  tagline: { fontSize: 14, color: "rgba(255,255,255,0.6)", marginTop: 6 },
  card: { backgroundColor: "rgba(20,20,40,0.7)", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  cardTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 20 },
  inputWrapper: { marginBottom: 16 },
  label: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: "600", letterSpacing: 0.5 },
  input: { backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 13, color: "#fff", fontSize: 15 },
  error: { color: "#f87171", fontSize: 13, marginBottom: 12, textAlign: "center" },
  btn: { borderRadius: 14, overflow: "hidden", marginTop: 4 },
  btnGrad: { paddingVertical: 15, alignItems: "center", borderRadius: 14 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchRow: { marginTop: 20, alignItems: "center" },
  switchText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },
  switchLink: { color: "#E491C9", fontWeight: "600" },
});
