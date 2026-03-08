import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { apiFetch } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  const onRegister = async () => {
    setError(null);
  
    if (!username || !email || !pw || !confirmPw) {
      setError("All fields are required.");
      return;
    }
  
    if (!isValidUsername(username)) {
      setError(
        "Username must be 3–20 characters and contain only letters, numbers, or underscores."
      );
      return;
    }
  
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }
  
    if (!isValidPassword(pw)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }
  
    if (pw !== confirmPw) {
      setError("Passwords do not match.");
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
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.outer}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Register your{"\n"}account</Text>

            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                placeholderTextColor={COLORS.placeholder}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={pw}
                onChangeText={setPw}
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

            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color={COLORS.muted} />
              <TextInput
                value={confirmPw}
                onChangeText={setConfirmPw}
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

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable style={styles.primaryBtn} onPress={onRegister}>
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
    </KeyboardAvoidingView>
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
  page: {
    flex: 1,
    backgroundColor: COLORS.frameBg,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  outer: {
    width: "100%",
    maxWidth: 380,
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
    alignSelf: "center",
    width: "92%",
  },
  cardTitle: {
    color: COLORS.textOnDark,
    fontSize: 30,
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
});


// Make restrictions for login
// Make entire background white 