import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { signIn } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setAccountInfo } from "@/store/account-info-slice";
import { hideLoader, showLoader } from "@/store/ui-slice";

const CODE_LENGTH = 5;

export default function AppCodeScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  async function handleChange(value: string) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (error) setError(null);
    if (digits.length !== CODE_LENGTH) return;

    if (!phoneNumber) {
      setError("Missing phone number. Please go back and enter it.");
      return;
    }

    dispatch(showLoader());
    try {
      router.back();
      const info = await signIn(phoneNumber, digits);
      if (!info) {
        setError("Incorrect app code. Please try again.");
        setCode("");
        inputRef.current?.focus();
        return;
      }
      dispatch(setAccountInfo(info));
      router.replace("/home");
    } catch {
      setError("Could not sign in. Check your connection and try again.");
      setCode("");
    } finally {
      dispatch(hideLoader());
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <SymbolView
            name={{
              ios: "arrow.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            size={24}
            tintColor={Brand.white}
          />
        </Pressable>
      </SafeAreaView>

      <View style={styles.content}>
        <MaterialDesignIcons
          name="shield-lock-outline"
          size={48}
          color={Brand.white}
        />

        <Text style={styles.title}>Enter your app code</Text>

        <Pressable
          style={styles.boxes}
          onPress={() => inputRef.current?.focus()}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, index) => (
            <View key={index} style={styles.box}>
              <Text style={styles.dot}>{code[index] ? "\u2022" : ""}</Text>
            </View>
          ))}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.forgot}>Forgot your app code?</Text>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          style={styles.hiddenInput}
          caretHidden
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.blue },
  back: { padding: Spacing.three },
  content: { alignItems: "center", paddingTop: Spacing.six, gap: Spacing.four },
  title: { color: Brand.white, fontSize: 26, fontWeight: "400" },
  boxes: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.two },
  box: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: { color: Brand.white, fontSize: 28, fontWeight: "700" },
  forgot: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: Spacing.three,
  },
  hiddenInput: { position: "absolute", opacity: 0, height: 1, width: 1 },
  error: {
    color: "#FFB4B4",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: Spacing.three,
  },
});
