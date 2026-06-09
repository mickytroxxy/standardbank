import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    NETWORKS,
    NetworkLogo,
    type NetworkId,
} from "@/components/network-logo";
import { Brand, Spacing } from "@/constants/theme";

type Tab = "BUY" | "RECURRING";

const BUNDLES = [
  { label: "5 Airtime Bundle", value: 5 },
  { label: "10 Airtime Bundle", value: 10 },
  { label: "20 Airtime Bundle", value: 20 },
  { label: "30 Airtime Bundle", value: 30 },
  { label: "50 Airtime Bundle", value: 50 },
  { label: "100 Airtime Bundle", value: 100 },
  { label: "250 Airtime Bundle", value: 250 },
];

export default function AirtimeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>("BUY");
  const [network, setNetwork] = useState<NetworkId>("Telkom");

  function selectAmount(amount: number | null) {
    router.push({
      pathname: "/airtime-purchase",
      params: {
        network,
        amount: amount != null ? String(amount) : "",
      },
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={8}
        >
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
        <Text style={styles.headerTitle}>Airtime</Text>
      </View>

      <View style={styles.tabsBar}>
        {(["BUY", "RECURRING"] as Tab[]).map((t) => (
          <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "RECURRING" ? "RECURRING TOP-UP" : "BUY"}
            </Text>
            {tab === t && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Select a network</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.netScroll}
          contentContainerStyle={styles.netRow}
        >
          {NETWORKS.map((n) => {
            const selected = network === n.id;
            return (
              <Pressable
                key={n.id}
                style={styles.netTile}
                onPress={() => setNetwork(n.id)}
              >
                <View
                  style={[
                    styles.netBox,
                    selected && {
                      borderColor: Brand.blue,
                      borderWidth: 2,
                    },
                  ]}
                >
                  <NetworkLogo id={n.id} size={48} />
                </View>
                <Text style={styles.netLabel} numberOfLines={1}>
                  {n.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Pressable style={styles.ownRow} onPress={() => selectAmount(null)}>
          <Text style={styles.ownText}>Add own amount</Text>
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={20}
            tintColor={Brand.blue}
          />
        </Pressable>

        <Text style={styles.chooseTitle}>Choose airtime amount</Text>
        {BUNDLES.map((b) => (
          <Pressable
            key={b.value}
            style={styles.bundleRow}
            onPress={() => selectAmount(b.value)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.bundleLabel}>{b.label}</Text>
              <Text style={styles.bundleAmount}>R {b.value.toFixed(2)}</Text>
            </View>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={20}
              tintColor={Brand.blue}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  back: { paddingRight: Spacing.two },
  headerTitle: { flex: 1, color: Brand.white, fontSize: 22, fontWeight: "400" },
  tabsBar: { flexDirection: "row", backgroundColor: Brand.blue },
  tab: { flex: 1, alignItems: "center", paddingBottom: Spacing.two },
  tabText: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: "700",
    opacity: 0.7,
    letterSpacing: 0.5,
  },
  tabTextActive: { opacity: 1 },
  tabUnderline: {
    height: 3,
    backgroundColor: Brand.white,
    alignSelf: "stretch",
    marginTop: Spacing.two,
    marginHorizontal: Spacing.four,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  sectionTitle: {
    color: Brand.textDark,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: Spacing.three,
  },
  netScroll: { marginHorizontal: -Spacing.three },
  netRow: { paddingHorizontal: Spacing.three, gap: Spacing.three },
  netTile: { width: 84, alignItems: "center" },
  netBox: {
    width: 84,
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.one,
  },
  netLabel: { color: Brand.textDark, fontSize: 13, textAlign: "center" },
  ownRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
    marginTop: Spacing.three,
  },
  ownText: { flex: 1, color: Brand.textDark, fontSize: 16, fontWeight: "500" },
  chooseTitle: {
    color: Brand.textDark,
    fontSize: 17,
    fontWeight: "600",
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  bundleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  bundleLabel: { color: Brand.textDark, fontSize: 15, fontWeight: "600" },
  bundleAmount: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
});
