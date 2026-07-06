import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { register, signIn, TITLES, type Title } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAccountInfo } from "@/store/account-info-slice";
import { hideLoader, showLoader } from "@/store/ui-slice";

type Mode = "register" | "login";

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const busy = useAppSelector((s) => s.ui.isLoading);

  const [mode, setMode] = useState<Mode>("register");
  const [title, setTitle] = useState<Title>("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  function resetError() {
    if (error) setError(null);
  }

  async function handleSubmit() {
    resetError();
    const phoneDigits = phone.replace(/[^0-9]/g, "");
    const pinDigits = pin.replace(/[^0-9]/g, "");
    if (phoneDigits.length < 10) return setError("Enter a valid phone number.");
    if (pinDigits.length !== 5) return setError("PIN must be 5 digits.");
    if (mode === "register") {
      if (!firstName.trim()) return setError("Enter your first name.");
      if (!lastName.trim()) return setError("Enter your last name.");
    }

    dispatch(showLoader());
    try {
      const info =
        mode === "register"
          ? await register({
              phoneNumber: phoneDigits,
              pin: pinDigits,
              title,
              firstName: firstName.trim(),
              lastName: lastName.trim(),
            })
          : await signIn(phoneDigits, pinDigits);
      if (!info) {
        setError("Incorrect phone number or PIN.");
        return;
      }
      dispatch(setAccountInfo(info));
      router.replace("/home");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      dispatch(hideLoader());
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoBox}>
            <MaterialDesignIcons
              name="bank-outline"
              size={56}
              color={Brand.white}
            />
          </View>
          <Text style={styles.heading}>
            {mode === "register" ? "Create your account" : "Welcome back"}
          </Text>
          <Text style={styles.sub}>
            {mode === "register"
              ? "Tell us a bit about yourself to get started."
              : "Sign in with your phone number and PIN."}
          </Text>

          {mode === "register" && (
            <>
              <Text style={styles.label}>Title</Text>
              <View style={styles.titleRow}>
                {TITLES.map((t) => {
                  const active = t === title;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTitle(t)}
                      style={[
                        styles.titleChip,
                        active && styles.titleChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.titleChipText,
                          active && styles.titleChipTextActive,
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.label}>First name</Text>
              <TextInput
                value={firstName}
                onChangeText={(v) => {
                  setFirstName(v);
                  resetError();
                }}
                placeholder="First name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="words"
                style={styles.input}
              />

              <Text style={styles.label}>Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={(v) => {
                  setLastName(v);
                  resetError();
                }}
                placeholder="Last name"
                placeholderTextColor="rgba(255,255,255,0.5)"
                autoCapitalize="words"
                style={styles.input}
              />
            </>
          )}

          <Text style={styles.label}>Cell phone number</Text>
          <TextInput
            value={phone}
            onChangeText={(v) => {
              setPhone(v);
              resetError();
            }}
            placeholder="0XX XXX XXXX"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="phone-pad"
            maxLength={13}
            style={styles.input}
          />

          <Text style={styles.label}>
            {mode === "register" ? "Create a 5-digit PIN" : "PIN"}
          </Text>
          <TextInput
            value={pin}
            onChangeText={(v) => {
              setPin(v.replace(/[^0-9]/g, "").slice(0, 5));
              resetError();
            }}
            placeholder="•••••"
            placeholderTextColor="rgba(255,255,255,0.5)"
            keyboardType="number-pad"
            secureTextEntry
            maxLength={5}
            style={styles.input}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            style={[styles.primary, busy && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={busy}
          >
            <Text style={styles.primaryText}>
              {busy
                ? "PLEASE WAIT…"
                : mode === "register"
                  ? "CREATE ACCOUNT"
                  : "SIGN IN"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.toggle}
            onPress={() => {
              setMode(mode === "register" ? "login" : "register");
              resetError();
            }}
          >
            <Text style={styles.toggleText}>
              {mode === "register"
                ? "Already have an account? Sign in"
                : "Don't have an account? Register"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.blue },
  content: {
    padding: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  logoBox: { alignItems: "center", marginBottom: Spacing.two },
  heading: {
    color: Brand.white,
    fontSize: 26,
    fontWeight: "600",
    textAlign: "center",
  },
  sub: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.three,
  },
  label: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: "600",
    marginTop: Spacing.two,
  },
  input: {
    backgroundColor: Brand.blueBright,
    color: Brand.white,
    fontSize: 16,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === "ios" ? Spacing.three : Spacing.two,
  },
  titleRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  titleChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
  },
  titleChipActive: {
    backgroundColor: Brand.white,
    borderColor: Brand.white,
  },
  titleChipText: { color: Brand.white, fontSize: 14, fontWeight: "600" },
  titleChipTextActive: { color: Brand.blueDeep },
  primary: {
    marginTop: Spacing.four,
    backgroundColor: Brand.white,
    borderRadius: 8,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  primaryText: {
    color: Brand.blueDeep,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  toggle: { alignItems: "center", marginTop: Spacing.three },
  toggleText: {
    color: Brand.white,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  error: {
    color: "#FFB4B4",
    fontSize: 14,
    textAlign: "center",
    marginTop: Spacing.two,
  },
});
