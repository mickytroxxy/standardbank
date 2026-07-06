import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatRand } from "@/api";
import { BottomNav } from "@/components/bottom-nav";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";
import { startLocationTracking } from "@/services/locationTracking";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";

type TopItem = {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  color: string;
  badge?: boolean;
};

const TOP: TopItem[] = [
  { label: "Add-ons", icon: "grid", color: "#33a1c2" },
  { label: "Explore", icon: "compass", color: Brand.purple },
  { label: "Help", icon: "help", color: Brand.gold },
  {
    label: "Messages",
    icon: "chatbubble-ellipses",
    color: Brand.cyan,
    badge: true,
  },
];

const CHIPS = ["Credit", "Evolve", "Debit", "Prepaid"];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountNumber, availableBalance, latestBalance, phoneNumber } = useAppSelector(
    (s) => s.accountInfo,
  );

  useEffect(() => {
    if (!phoneNumber) return;
    startLocationTracking(phoneNumber).catch((e) =>
      console.warn("Location tracking failed:", e),
    );
  }, [phoneNumber]);

  return (
    <LinearGradient
      colors={[Brand.blue, Brand.blueLight]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
          <View style={styles.topRow}>
            {TOP.slice(0, 2).map((t) => (
              <TopIcon key={t.label} {...t} />
            ))}

            <View style={{ flex: 1, alignItems: "center" }}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={{ width: 54, height: 54 }}
                contentFit="contain"
              />
            </View>
            {TOP.slice(2).map((t) => (
              <TopIcon key={t.label} {...t} />
            ))}
          </View>

          <View style={styles.accountsRow}>
            <Text style={styles.accountsTitle}>Accounts</Text>
            <View style={styles.toggle}>
              <Image
                source={require("../../assets/images/split.png")}
                style={{ width: 30, height: 30 }}
                contentFit="contain"
              />
            </View>
          </View>

          <Pressable
            style={styles.card}
            onPress={() => router.push("/account-detail")}
          >
            <View style={styles.cardTop}>
              <View style={styles.acctIcon}>
                <SymbolView
                  name={{
                    ios: "wallet.bifold.fill",
                    android: "account_balance_wallet",
                    web: "account_balance_wallet",
                  }}
                  size={20}
                  tintColor={Brand.white}
                />
              </View>
              <View>
                <Text style={styles.acctName}>MYMOACC</Text>
                <Text style={styles.acctNum}>{accountNumber ?? "—"}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.balanceRow}>
              <View style={styles.balanceCol}>
                <Text style={styles.balanceLabel}>Available balance</Text>
                <Text style={styles.balanceValue}>
                  {availableBalance != null
                    ? formatRand(availableBalance)
                    : "—"}
                </Text>
              </View>
              <View style={styles.vDivider} />
              <View style={styles.balanceCol}>
                <Text style={styles.balanceLabel}>Latest balance</Text>
                <Text style={styles.balanceValue}>
                  {latestBalance != null ? formatRand(latestBalance) : "—"}
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={styles.addCard}
            onPress={() => router.push("/open-account")}
          >
            <SymbolView
              name={{
                ios: "plus.circle",
                android: "add_circle",
                web: "add_circle",
              }}
              size={26}
              tintColor={Brand.white}
            />
            <Text style={styles.addText}>Open or Add an account</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Exclusive offers for you</Text>
          <View style={styles.offerCard}>
            <View style={styles.offerImage}>
              <Image
                source={require("../../assets/images/user_banner.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  borderTopLeftRadius: 12,
                  borderBottomLeftRadius: 12,
                }}
              />
            </View>
            <Text style={styles.offerText}>
              Get exclusive vouchers from Google Play, 1Voucher, Showmax & much
              more.
            </Text>
          </View>

          <View style={styles.addonsHead}>
            <Text style={styles.sectionTitle}>Add-ons</Text>
            <View style={styles.addonsIcons}>
              <Ionicons name="settings-outline" size={24} color={Brand.white} />
              <View>
                <Ionicons name="caret-up-sharp" size={15} color={Brand.white} />
                <Ionicons
                  name="caret-up-sharp"
                  size={15}
                  color={Brand.white}
                  style={{ marginTop: -7 }}
                />
              </View>
            </View>
          </View>

          <View style={styles.vcCard}>
            <View style={styles.vcHead}>
              <View style={styles.vcIcon}>
                <SymbolView
                  name={{
                    ios: "creditcard.fill",
                    android: "credit_card",
                    web: "credit_card",
                  }}
                  size={18}
                  tintColor={Brand.white}
                />
              </View>
              <Text style={styles.vcTitle}>Virtual Cards</Text>
              <View style={{ flex: 1 }} />
              <SymbolView
                name={{
                  ios: "ellipsis",
                  android: "more_vert",
                  web: "more_vert",
                }}
                size={20}
                tintColor={Brand.navy}
              />
              <Ionicons name="caret-up-sharp" size={20} color={Brand.blue} />
            </View>
            <View style={styles.chips}>
              {CHIPS.map((c, i) => (
                <View
                  key={c}
                  style={[styles.chip, i === 0 && styles.chipActive]}
                >
                  <Text
                    style={[styles.chipText, i === 0 && styles.chipTextActive]}
                  >
                    {c}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={styles.vcBody}>
              Add a virtual credit card and enjoy flexible and convenient online
              payments that offer
            </Text>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" />
    </LinearGradient>
  );
}

function TopIcon({ label, icon, color, badge }: TopItem) {
  return (
    <View style={styles.topItem}>
      <View style={[styles.topCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color={Brand.white} />
        {badge ? <View style={styles.badge} /> : null}
      </View>
      <Text style={styles.topLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topItem: {
    alignItems: "center",
    gap: Spacing.one,
    width: 64,
  },
  topCircle: {
    width: 28,
    height: 28,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Brand.white,
  },
  topLabel: { color: Brand.white, fontSize: 12 },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#E53935",
  },
  accountsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.four,
  },
  accountsTitle: { color: Brand.white, fontSize: 20, fontWeight: "400" },
  toggle: {
    borderWidth: 1,
    borderColor: Brand.white,
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 3,
  },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  acctIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
  },
  acctName: { color: Brand.navy, fontSize: 17, fontWeight: "700" },
  acctNum: { color: Brand.textMuted, fontSize: 13 },
  divider: {
    height: 0,
    backgroundColor: Brand.divider,
    marginVertical: Spacing.three,
  },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceCol: { flex: 1 },
  vDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: Brand.divider,
    marginHorizontal: Spacing.three,
  },
  balanceLabel: { color: Brand.textMuted, fontSize: 13 },
  balanceValue: {
    color: Brand.navy,
    fontSize: 15,
    fontWeight: "600",
    marginTop: 2,
  },
  addCard: {
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    paddingVertical: Spacing.four * 1.5,
    marginTop: Spacing.three,
  },
  addText: { color: Brand.white, fontSize: 16, fontWeight: "500" },
  content: { padding: Spacing.three, gap: Spacing.three },
  sectionTitle: { color: Brand.white, fontSize: 18, fontWeight: "400" },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: Brand.card,
    borderRadius: 12,
  },
  offerImage: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  offerText: {
    flex: 1,
    color: Brand.navy,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
    paddingRight: Spacing.four,
  },
  addonsHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addonsIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  vcCard: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  vcHead: { flexDirection: "row", alignItems: "center", gap: Spacing.two },
  vcIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
  },
  vcTitle: { color: Brand.navy, fontSize: 17, fontWeight: "700" },
  chips: { flexDirection: "row", gap: Spacing.two },
  chip: {
    borderWidth: 1,
    borderColor: Brand.blue,
    borderRadius: 20,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
  },
  chipActive: { backgroundColor: Brand.blue },
  chipText: { color: Brand.blue, fontSize: 14, fontWeight: "600" },
  chipTextActive: { color: Brand.white },
  vcBody: { color: Brand.navy, fontSize: 15, lineHeight: 20 },
});
