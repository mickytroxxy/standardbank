import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { formatRand } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";
import { proofContactLabel, type Payment } from "./review-details";

function Row({
  label,
  value,
  lines,
  last,
}: {
  label: string;
  value?: string;
  lines?: string[];
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueCol}>
        {lines ? (
          lines.map((v, i) => (
            <Text key={i} style={styles.rowValue}>
              {v}
            </Text>
          ))
        ) : (
          <Text style={styles.rowValue}>{value ?? "—"}</Text>
        )}
      </View>
    </View>
  );
}

export default function ConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    payment?: string;
    newAvailable?: string;
  }>();
  const { accountNumber } = useAppSelector((s) => s.accountInfo);

  let payment: Payment;
  try {
    payment = JSON.parse(params.payment ?? "{}");
  } catch {
    payment = {} as Payment;
  }
  const ben = payment.beneficiary;
  const newAvailable = parseFloat(params.newAvailable ?? "0");

  function handleDone() {
    if (router.canDismiss()) router.dismissAll();
    router.replace("/home");
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Text style={styles.headerTitle}>Confirmation</Text>
        <Pressable onPress={handleDone} hitSlop={8}>
          <Text style={styles.action}>DONE</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.three,
          paddingBottom: Spacing.six * 2,
        }}
      >
        <Text style={styles.sectionLabel}>From</Text>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.walletIcon}>
              <SymbolView
                name={{
                  ios: "wallet.pass.fill",
                  android: "account_balance_wallet",
                  web: "account_balance_wallet",
                }}
                size={22}
                tintColor={Brand.white}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fromName}>MYMOACC</Text>
              <Text style={styles.fromNum}>{accountNumber ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.amountStripBlue}>
            <Text style={styles.amountStripBlueText}>
              {formatRand(payment.amount ?? 0)}
            </Text>
          </View>
          <View style={styles.rowsBlock}>
            <Row label="Available balance" value={formatRand(newAvailable)} />
            <Row label="My reference" value={payment.myRef || "—"} last />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.four }]}>
          To
        </Text>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.successAvatar}>
              <SymbolView
                name={{ ios: "checkmark", android: "check", web: "check" }}
                size={22}
                tintColor={Brand.white}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benName}>{ben?.holderName ?? "—"}</Text>
              <Text style={styles.benNum}>{ben?.accountNumber ?? "—"}</Text>
            </View>
            <SymbolView
              name={{
                ios: "square.and.arrow.up",
                android: "share",
                web: "share",
              }}
              size={22}
              tintColor={Brand.blue}
            />
          </View>
          <View style={styles.divider} />
          <Text style={styles.successLine}>
            Transaction was successfully processed.
          </Text>
          <View style={styles.divider} />
          <View style={styles.rowsBlock}>
            <Row label="Amount" value={formatRand(payment.amount ?? 0)} />
            <Row
              label="Bank details"
              lines={
                [ben?.bank, ben?.branchName, ben?.branchCode].filter(
                  Boolean,
                ) as string[]
              }
            />
            <Row
              label="Their reference"
              value={payment.theirRef || "—"}
              last={payment.proof === "None"}
            />
            {payment.proof !== "None" && (
              <>
                <Row label="Proof of payment" value={payment.proof} />
                <Row label="Their name" value={payment.theirName || "—"} />
                <Row
                  label={proofContactLabel(payment.proof)}
                  value={payment.proofContact || "—"}
                  last
                />
              </>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.toast, { bottom: insets.bottom + Spacing.three }]}>
        <Text style={styles.toastText}>
          {payment.immediate ? "Immediate payment" : "Payment"} submitted
          successfully
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.screen },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerTitle: { flex: 1, color: Brand.white, fontSize: 22, fontWeight: "400" },
  action: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  sectionLabel: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: Brand.white,
    borderRadius: 4,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    padding: Spacing.three,
  },
  walletIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
  },
  fromName: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  fromNum: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  amountStripBlue: {
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  amountStripBlueText: { color: Brand.white, fontSize: 22, fontWeight: "400" },
  rowsBlock: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
    gap: Spacing.three,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  rowLabel: { color: Brand.textMuted, fontSize: 15, flex: 1 },
  rowValueCol: { alignItems: "flex-end", flexShrink: 1 },
  rowValue: { color: Brand.textDark, fontSize: 15, textAlign: "right" },
  successAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.green,
    alignItems: "center",
    justifyContent: "center",
  },
  benName: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  benNum: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.divider,
    marginHorizontal: Spacing.three,
  },
  successLine: {
    color: Brand.textDark,
    fontSize: 14,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  toast: {
    position: "absolute",
    left: Spacing.three,
    right: Spacing.three,
    backgroundColor: "#1B7E3A",
    borderRadius: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three + 2,
  },
  toastText: { color: Brand.white, fontSize: 15 },
});
