import { useFocusEffect, useRouter, type Href } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchBeneficiaries, type SavedBeneficiary } from "@/api";
import { BottomNav } from "@/components/bottom-nav";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";

const PAY_ITEMS: {
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
  badge?: string;
  href?: Href;
}[] = [
  {
    label: "Somebody new",
    ios: "person",
    android: "person",
    href: "/beneficiary-account",
  },
  { label: "Business directory", ios: "building.2", android: "business" },
  {
    label: "Instant Money",
    ios: "banknote",
    android: "payments",
    href: "/send",
  },
  { label: "Overseas payment", ios: "globe", android: "public" },
  { label: "Traffic Fines", ios: "car", android: "directions_car" },
  { label: "PayShap", ios: "circle.hexagongrid.fill", android: "grain" },
  { label: "Bills", ios: "doc.text", android: "receipt_long", badge: "NEW" },
];

function displayFor(ben: SavedBeneficiary): {
  name: string;
  sub: string;
  initials: string;
} {
  if (ben.type === "cell") {
    const name = [ben.name, ben.surname].filter(Boolean).join(" ");
    return {
      name,
      sub: ben.phone ?? "",
      initials:
        `${(ben.name ?? "").charAt(0)}${(ben.surname ?? "").charAt(0)}`.toUpperCase(),
    };
  }
  return {
    name: ben.holderName,
    sub: ben.myRef ? `Ref: ${ben.myRef}` : (ben.bank ?? ""),
    initials: (ben.holderName ?? "").trim().charAt(0).toUpperCase(),
  };
}

export default function PayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);
  const [bens, setBens] = useState<SavedBeneficiary[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!phoneNumber) return;
      let active = true;
      fetchBeneficiaries(phoneNumber)
        .then((list) => {
          if (active) setBens(list);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [phoneNumber]),
  );

  function payBen(ben: SavedBeneficiary) {
    router.push({
      pathname: "/payment-details",
      params: { beneficiary: JSON.stringify(ben) },
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Text style={styles.headerTitle}>Pay</Text>
        <View style={styles.headerIcons}>
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search", web: "search" }}
            size={24}
            tintColor={Brand.white}
          />
          <TouchableOpacity onPress={() => router.push("/beneficiary-account")}>
            <SymbolView
              name={{ ios: "plus", android: "add", web: "add" }}
              size={24}
              tintColor={Brand.white}
            />
          </TouchableOpacity>
          <SymbolView
            name={{ ios: "ellipsis", android: "more_vert", web: "more_vert" }}
            size={24}
            tintColor={Brand.white}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Make a once-off payment</Text>
          <View style={styles.grid}>
            {PAY_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                style={styles.gridItem}
                onPress={() => item.href && router.push(item.href)}
              >
                <View style={styles.gridIcon}>
                  {item.badge ? (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <SymbolView
                    name={{
                      ios: item.ios,
                      android: item.android,
                      web: item.android,
                    }}
                    size={28}
                    tintColor={Brand.banner}
                  />
                </View>
                <Text style={styles.gridLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.recentHead}>
          <Text style={styles.sectionTitle}>Recently paid</Text>
          <SymbolView
            name={{ ios: "slider.horizontal.3", android: "tune", web: "tune" }}
            size={22}
            tintColor={Brand.blueLight}
          />
        </View>

        <Pressable
          style={styles.addBen}
          onPress={() => router.push("/beneficiary-account")}
        >
          <SymbolView
            name={{
              ios: "plus.circle",
              android: "add_circle",
              web: "add_circle",
            }}
            size={26}
            tintColor={Brand.banner}
          />
          <Text style={styles.addBenText}>Add a beneficiary</Text>
        </Pressable>

        {bens.length === 0 ? (
          <Text style={styles.empty}>No beneficiaries saved yet.</Text>
        ) : (
          bens.map((ben) => {
            const d = displayFor(ben);
            return (
              <Pressable
                key={ben.id ?? d.name}
                style={styles.benCard}
                onPress={() => payBen(ben)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{d.initials}</Text>
                </View>
                <View style={styles.benInfo}>
                  <Text style={styles.benName}>{d.name}</Text>
                  <Text style={styles.benSub}>{d.sub}</Text>
                </View>
                <Pressable style={styles.payBtn} onPress={() => payBen(ben)}>
                  <Text style={styles.payBtnText}>PAY</Text>
                </Pressable>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <BottomNav active="transact" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.screen },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerTitle: { color: Brand.white, fontSize: 22, fontWeight: "600" },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, gap: Spacing.three },
  card: {
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: Spacing.three,
  },
  cardTitle: {
    color: Brand.banner,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: Spacing.three,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: Spacing.four },
  gridItem: { width: "25%", alignItems: "center", gap: Spacing.one },
  gridIcon: { height: 32, justifyContent: "center" },
  gridLabel: { color: Brand.navy, fontSize: 12, textAlign: "center" },
  newBadge: {
    position: "absolute",
    top: -14,
    alignSelf: "center",
    zIndex: 1,
    backgroundColor: Brand.green,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  newBadgeText: { color: Brand.white, fontSize: 9, fontWeight: "700" },
  recentHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { color: Brand.navy, fontSize: 18, fontWeight: "700" },
  addBen: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: Spacing.three,
  },
  addBenText: { color: Brand.banner, fontSize: 16, fontWeight: "500" },
  month: {
    color: Brand.blueDeep,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.two,
  },
  benCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: Brand.card,
    borderRadius: 12,
    padding: Spacing.three,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Brand.blueDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Brand.blueDeep, fontSize: 15, fontWeight: "700" },
  benInfo: { flex: 1, gap: 2 },
  benName: { color: Brand.navy, fontSize: 16, fontWeight: "700" },
  benSub: { color: Brand.textMuted, fontSize: 13 },
  payBtn: {
    borderWidth: 1,
    borderColor: Brand.blue,
    borderRadius: 8,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  payBtnText: { color: Brand.blue, fontSize: 14, fontWeight: "700" },
  empty: {
    textAlign: "center",
    color: Brand.textMuted,
    fontSize: 14,
    paddingVertical: Spacing.three,
  },
});
