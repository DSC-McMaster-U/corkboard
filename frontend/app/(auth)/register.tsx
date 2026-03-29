import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { apiFetch } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";

const isValidUsername = (username: string) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const isValidPassword = (password: string) => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
};

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track "touched" so we only show messages after the user interacts
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    pw: false,
    confirmPw: false,
  });

  const pwRules = useMemo(
    () => ({
      length: pw.length >= 8,
      upper: /[A-Z]/.test(pw),
      lower: /[a-z]/.test(pw),
      number: /[0-9]/.test(pw),
    }),
    [pw]
  );

  const usernameMsg = useMemo(() => {
    if (!username) return "3-20 characters. Letters, numbers, underscores.";
    return isValidUsername(username)
      ? null
      : "Must be 3-20 characters (A-Z,a-z,0-9,_).";
  }, [username]);

  const emailMsg = useMemo(() => {
    if (!email) return "Use a valid email like name@example.com.";
    return isValidEmail(email) ? null : "That email format looks wrong.";
  }, [email]);

  const pwMsg = useMemo(() => {
    if (!pw) return "Use 8+ characters with upper/lowercase and a number.";
    return isValidPassword(pw)
      ? null
      : "Your password still needs one or more requirements below.";
  }, [pw]);

  const confirmMsg = useMemo(() => {
    if (!confirmPw) return "Re-type your password.";
    return confirmPw === pw ? null : "Passwords don't match.";
  }, [confirmPw, pw]);

  const canSubmit = useMemo(() => {
    return (
      isValidUsername(username) &&
      isValidEmail(email) &&
      isValidPassword(pw) &&
      pw === confirmPw
    );
  }, [username, email, pw, confirmPw]);

  const onRegister = async () => {
    setError(null);
  
    if (!canSubmit) {
      setError("Please fix the highlighted fields.");
      return;
    }
  
    // Passed all checks — call backend here (POST /api/users)
    try {
      const data = await apiFetch<{ jwt?: string; success?: boolean; error?: string }>('api/users', {
        method: 'POST',
        body: JSON.stringify({ email, password: pw, name: username, username }),
      });

      if (!data || data?.success === false) {
        setError(data?.error || 'Registration failed');
        return;
      }

      if (data?.jwt) {
        await AsyncStorage.setItem('authToken', data.jwt);
        router.replace('/');
      } else {
        // No token returned (e.g., email confirmation required) — send user to login
        router.replace('/(auth)/login');
      }
    } catch (err) {
      setError('Network or server error during registration');
    }
  };
  
  return (
    <SafeAreaView className="flex-1 bg-black" edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
      />
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.outer}>

        <View style={styles.header}>
          <Image
            source={require('../../assets/images/corkboard-logo-transparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brandTitle}>Corkboard</Text>
          <Text style={styles.brandSubtitle}>Discover live music near you</Text>
        </View>

        <View style={styles.card}>
            <Text style={styles.cardTitle}>Register your{"\n"}account</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  setTouched((t) => ({ ...t, username: true }));
                }}
                placeholder="Username"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
            {touched.username && usernameMsg && (
              <Text style={styles.helperText}>{usernameMsg}</Text>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setTouched((t) => ({ ...t, email: true }));
                }}
                placeholder="Email Address"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {touched.email && emailMsg && (
              <Text style={styles.helperText}>{emailMsg}</Text>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={pw}
                onChangeText={(text) => {
                  setPw(text);
                  setTouched((t) => ({ ...t, pw: true }));
                }}
                placeholder="Password"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                secureTextEntry={!showPw}
              />
              <Pressable
                onPress={() => setShowPw((v) => !v)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>
            {touched.pw && pwMsg && (
              <Text style={styles.helperText}>{pwMsg}</Text>
            )}

            {touched.pw && (
              <View style={{ marginLeft: 6, marginTop: 6 }}>
                <Text style={styles.helperText}>
                  {pwRules.length ? "✓" : "•"} At least 8 characters
                </Text>
                <Text style={styles.helperText}>
                  {pwRules.upper ? "✓" : "•"} One uppercase letter
                </Text>
                <Text style={styles.helperText}>
                  {pwRules.lower ? "✓" : "•"} One lowercase letter
                </Text>
                <Text style={styles.helperText}>
                  {pwRules.number ? "✓" : "•"} One number
                </Text>
              </View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={confirmPw}
                onChangeText={(text) => {
                  setConfirmPw(text);
                  setTouched((t) => ({ ...t, confirmPw: true }));
                }}
                placeholder="Confirm Password"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                secureTextEntry={!showConfirmPw}
              />
              <Pressable
                onPress={() => setShowConfirmPw((v) => !v)}
                hitSlop={10}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showConfirmPw ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={COLORS.muted}
                />
              </Pressable>
            </View>
            {touched.confirmPw && confirmMsg && (
              <Text style={styles.helperText}>{confirmMsg}</Text>
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.primaryBtn, !canSubmit && { opacity: 0.6 }]}
              onPress={onRegister}
              disabled={!canSubmit}
            >
              <Text style={styles.primaryBtnText}>Register</Text>
            </Pressable>

            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Link href="/(auth)/login" style={styles.footerLink}>
                Login
              </Link>
            </Text>
          </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const COLORS = {
  pageBg: "#1f1f1f",
  frameBg: "#f6e8dc",
  cardBg: "#4b0000",
  inputBg: "#ffffff",
  placeholder: "#411900",
  muted: "#411900",
  button: "#e2942c",
  textOnDark: "#ffffff",
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000000", // black status bar area
  },
  page: {
    flex: 1,
    backgroundColor: COLORS.frameBg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  outer: {
    width: "100%",
    maxWidth: 380,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
    width: "100%",
    marginBottom: 24,
  },
  cardTitle: {
    color: COLORS.textOnDark,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 34,
  },
  inputWrap: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
  },
  input: {
    flex: 1,
    color: "#411900",
    fontSize: 16,
  },
  eyeBtn: {
    paddingLeft: 6,
  },
  primaryBtn: {
    backgroundColor: COLORS.button,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 18,
  },
  footerText: {
    color: "#f1dfd6",
    textAlign: "center",
    marginTop: 14,
    fontSize: 13,
  },
  footerLink: {
    color: "#ffffff",
    textDecorationLine: "underline",
    fontWeight: "700",
  },
  errorText: {
    color: "#ffd6d6",
    backgroundColor: "#7a1f1f",
    padding: 10,
    borderRadius: 8,
    marginTop: 12,
    textAlign: "center",
    fontSize: 13,
  },
  helperText: {
    color: "#f1dfd6",
    marginTop: 6,
    marginLeft: 6,
    fontSize: 12,
    lineHeight: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#411900",
    marginBottom: 4,
  },
  brandSubtitle: {
    fontSize: 16,
    color: "#4b0000",
    textAlign: "center",
  },
});