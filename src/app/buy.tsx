import { useRouter, type Href } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNav } from "@/components/bottom-nav";
import { NetworkLogo, type NetworkId } from "@/components/network-logo";
import { Brand, Spacing } from "@/constants/theme";

type BuyItem = {
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
  href?: Href;
};

const ITEMS: BuyItem[] = [
  { label: "Airtime", ios: "iphone", android: "smartphone", href: "/airtime" },
  { label: "SMS", ios: "message", android: "chat" },
  { label: "Data", ios: "antenna.radiowaves.left.and.right", android: "wifi" },
  { label: "Electricity", ios: "lightbulb", android: "lightbulb" },
  { label: "Vouchers", ios: "gift", android: "card_giftcard" },
  { label: "Water", ios: "drop", android: "water_drop" },
  { label: "LOTTO", ios: "circle.grid.cross", android: "casino" },
];

type Recent = { network: NetworkId; phone: string; amount: string; date: string };
const RECENTS: Recent[] = [
  { network: "MTN", phone: "0733494836", amount: "R 30.00", date: "03 June 2026" },
  { network: "MTN", phone: "0733494836", amount: "R 30.00", date: "24 May 2026" },
];

type Voucher = { label: string; color: string };
const VOUCHERS: Voucher[] = [
  { label: "Gaming", color: "#5B6B8C" },
  { label: "Food & Travel", color: "#C76A4A" },
  { label: "Streaming", color: "#3F6B8C" },
];

export default function BuyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Text style={styles.headerTitle}>Buy</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>What would you like to buy?</Text>
        <View style={styles.grid}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.label}
              style={styles.tile}
              onPress={() => item.href && router.push(item.href)}
            >
              <View style={styles.tileBox}>
                <SymbolView
                  name={{ ios: item.ios, android: item.android, web: item.android }}
                  size={36}
                  tintColor={Brand.blue}
                />
              </View>
              <Text style={styles.tileLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.subHead}>
          <Text style={styles.subTitle}>Buy this again</Text>
          <SymbolView
            name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
            size={18}
            tintColor={Brand.blue}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
          {RECENTS.map((r, i) => (
            <View key={i} style={styles.recentCard}>
              <NetworkLogo id={r.network} size={36} />
              <View style={{ flex: 1, marginLeft: Spacing.three }}>
                <Text style={styles.recentPhone}>{r.phone}</Text>
                <Text style={styles.recentLine}>AIRTIME | {r.amount}</Text>
                <Text style={styles.recentDate}>{r.date}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.subHead}>
          <Text style={styles.subTitle}>Vouchers for your every need</Text>
          <SymbolView
            name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }}
            size={18}
            tintColor={Brand.blue}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voucherScroll}>
          {VOUCHERS.map((v) => (
            <View key={v.label} style={[styles.voucherCard, { backgroundColor: v.color }]}>
              <View style={styles.voucherTag}>
                <Text style={styles.voucherTagText}>{v.label}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <BottomNav active="buy" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  header: {
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerTitle: { color: Brand.white, fontSize: 26, fontWeight: "400" },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  sectionTitle: { color: Brand.textDark, fontSize: 17, fontWeight: "600", marginBottom: Spacing.three },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.three },
  tile: { width: "22%", alignItems: "center" },
  tileBox: {
    width: "100%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.one,
  },
  tileLabel: { color: Brand.textDark, fontSize: 13, textAlign: "center" },
  subHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  subTitle: { color: Brand.textDark, fontSize: 17, fontWeight: "600" },
  recentScroll: { marginHorizontal: -Spacing.three },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    width: 280,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: 8,
    padding: Spacing.three,
    marginLeft: Spacing.three,
  },
  recentPhone: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  recentLine: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  recentDate: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  voucherScroll: { marginHorizontal: -Spacing.three },
  voucherCard: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginLeft: Spacing.three,
    justifyContent: "flex-start",
    padding: Spacing.two,
  },
  voucherTag: {
    alignSelf: "flex-start",
    backgroundColor: Brand.blue,
    borderRadius: 16,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
  },
  voucherTagText: { color: Brand.white, fontSize: 12, fontWeight: "700" },
});
