import { Redirect, useRouter } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { displayName } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";

const RIPPLES = require("../../assets/images/ripples.png");
const { width, height } = Dimensions.get("window");

function CircleIcon({
  color,
  ios,
  android,
}: {
  color: string;
  ios: SFSymbol;
  android: AndroidSymbol;
}) {
  return (
    <View style={[styles.circleIcon, { backgroundColor: color }]}>
      <SymbolView
        name={{ ios, android, web: android }}
        size={18}
        tintColor={Brand.white}
      />
    </View>
  );
}

function Shortcut({
  label,
  ios,
  android,
}: {
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
}) {
  return (
    <View style={styles.shortcut}>
      <SymbolView
        name={{ ios, android, web: android }}
        size={26}
        tintColor={Brand.white}
      />
      <Text style={styles.shortcutLabel}>{label}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { firstName, lastName, title } = useAppSelector((s) => s.accountInfo);

  if (!firstName) return <Redirect href="/register" />;

  const greetingName = displayName({ firstName, lastName });

  return (
    <View style={styles.container}>
      {/* Rings flush with the very top — no padding */}
      <Image
        source={RIPPLES}
        style={{ width: width, height: height * 0.65, marginTop: -100 }}
        resizeMode="cover"
      />

      {/* Remaining content below the rings */}
      <View style={styles.hero}>
        <Text style={styles.version}>Version 3.79.2</Text>

        <View style={styles.circleRow}>
          <CircleIcon
            color={Brand.purple}
            ios="safari.fill"
            android="explore"
          />
          <CircleIcon color={Brand.gold} ios="questionmark" android="help" />
        </View>

        <View style={styles.greeting}>
          <Text style={styles.greetingText}>Hello again,</Text>
          <Text style={styles.greetingText}>{greetingName}</Text>
        </View>

        <Pressable
          style={styles.signIn}
          onPress={() => router.push("/app-code")}
        >
          <Text style={styles.signInText}>SIGN IN</Text>
        </Pressable>

        <Text style={styles.terms}>
          By signing in, I agree to the{" "}
          <Text style={styles.link}>Ts&amp;Cs</Text>
        </Text>
      </View>

      <SafeAreaView edges={["bottom"]} style={styles.shortcutSafeArea}>
        <View style={styles.shortcutRow}>
          <Shortcut label="Scan QR" ios="qrcode" android="qr_code_scanner" />
          <Shortcut
            label="Balances"
            ios="creditcard.fill"
            android="account_balance_wallet"
          />
          <Shortcut label="Forex" ios="chart.bar.fill" android="bar_chart" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.blue },
  hero: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.three,
    position: "absolute",
    width: "100%",
    marginTop: (height * 0.65) / 2,
  },
  version: { color: Brand.white, fontSize: 13, marginTop: -Spacing.two },
  circleRow: {
    flexDirection: "row",
    gap: Spacing.three + 10,
    marginTop: Spacing.two,
  },
  circleIcon: {
    width: 32,
    height: 32,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Brand.white,
  },
  greeting: { alignItems: "center", marginTop: Spacing.four },
  greetingText: {
    color: Brand.white,
    fontSize: 34,
    fontWeight: "400",
    lineHeight: 42,
  },
  signIn: {
    alignSelf: "stretch",
    backgroundColor: Brand.white,
    marginTop: Spacing.four,
    marginHorizontal: Spacing.four,
    borderRadius: 8,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  signInText: {
    color: Brand.blueDeep,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  terms: { color: Brand.white, fontSize: 14, marginTop: Spacing.three },
  link: { textDecorationLine: "underline", fontWeight: "600" },
  shortcutSafeArea: {
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  shortcutRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  shortcut: { alignItems: "center", gap: Spacing.one },
  shortcutLabel: { color: Brand.white, fontSize: 13, fontWeight: "600" },
});
