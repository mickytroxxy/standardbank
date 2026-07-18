import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatRand } from "@/api";
import { networkDisplay, type NetworkId } from "@/components/network-logo";
import { Brand, Spacing } from "@/constants/theme";

export default function AirtimeConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    network?: string;
    amount?: string;
    phone?: string;
  }>();
  const network = (params.network as NetworkId) ?? "Vodacom";
  const amount = parseFloat(params.amount ?? "0") || 0;
  const phone = params.phone ?? "";

  function handleDone() {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/home");
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Text style={styles.headerTitle}>Confirmation</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.three,
          paddingBottom: Spacing.six,
        }}
      >
        <View style={styles.successWrap}>
          <View style={styles.successOuter}>
            <View style={styles.successInner}>
              <SymbolView
                name={{ ios: "checkmark", android: "check", web: "check" }}
                size={44}
                tintColor={Brand.green}
              />
            </View>
          </View>
          <Text style={styles.successText}>Airtime purchase successful</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.checkCircle}>
              <SymbolView
                name={{ ios: "checkmark", android: "check", web: "check" }}
                size={20}
                tintColor={Brand.green}
              />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.three }}>
              <Text style={styles.netName}>{networkDisplay(network)}</Text>
              <Text style={styles.netSub}>Airtime</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowsBlock}>
            <View style={[styles.row, styles.rowDivider]}>
              <Text style={styles.rowLabel}>Amount</Text>
              <Text style={styles.rowValue}>{formatRand(amount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Cellphone number</Text>
              <Text style={styles.rowValue}>{phone}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two }]}
      >
        <Pressable style={styles.doneBtn} onPress={handleDone}>
          <Text style={styles.doneText}>DONE</Text>
        </Pressable>
      </View>
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
  successWrap: { alignItems: "center", marginVertical: Spacing.four },
  successOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#DCEFE0",
    alignItems: "center",
    justifyContent: "center",
  },
  successInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Brand.white,
    borderWidth: 2,
    borderColor: Brand.green,
    alignItems: "center",
    justifyContent: "center",
  },
  successText: {
    marginTop: Spacing.three,
    color: Brand.textDark,
    fontSize: 18,
    fontWeight: "400",
  },
  card: {
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: 4,
    overflow: "hidden",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
  },
  checkCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Brand.green,
    alignItems: "center",
    justifyContent: "center",
  },
  netName: { color: Brand.textDark, fontSize: 16, fontWeight: "700" },
  netSub: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Brand.divider },
  rowsBlock: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  rowLabel: { color: Brand.textMuted, fontSize: 15 },
  rowValue: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  doneBtn: {
    backgroundColor: Brand.blue,
    borderRadius: 4,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  doneText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
