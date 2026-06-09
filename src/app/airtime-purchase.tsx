import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountCard } from "@/components/account-card";
import {
    NetworkLogo,
    networkDisplay,
    type NetworkId,
} from "@/components/network-logo";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";

export default function AirtimePurchaseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ network?: string; amount?: string }>();
  const network = (params.network as NetworkId) ?? "Vodacom";
  const initialAmount = params.amount ?? "";

  const { accountNumber, availableBalance } = useAppSelector(
    (s) => s.accountInfo,
  );
  const [amount, setAmount] = useState(initialAmount);
  const [phone, setPhone] = useState("");

  const amountNum = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
  const phoneDigits = phone.replace(/\D/g, "");
  const canNext =
    amountNum > 0 &&
    phoneDigits.length >= 9 &&
    amountNum <= (availableBalance ?? 0);

  function handleNext() {
    if (!canNext) return;
    router.push({
      pathname: "/airtime-review",
      params: {
        network,
        amount: String(amountNum),
        phone: `+27${phoneDigits}`,
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
        <Text style={styles.headerTitle}>Purchase details</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.six }}>
          <View style={styles.fromBlock}>
            <Text style={styles.fromLabel}>Pay from</Text>
            <AccountCard
              name="MYMOACC"
              accountNumber={accountNumber ?? "—"}
              availableBalance={availableBalance}
            />
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>
                Remaining daily withdrawal limit
              </Text>
              <Text style={styles.limitValue}>R 10 000.00</Text>
            </View>
          </View>

          <View style={styles.toBlock}>
            <Text style={styles.toLabel}>To</Text>
            <View style={styles.toCard}>
              <View style={styles.toHead}>
                <NetworkLogo id={network} size={40} />
                <View style={{ flex: 1, marginLeft: Spacing.three }}>
                  <Text style={styles.netName}>{networkDisplay(network)}</Text>
                  <Text style={styles.netSub}>Airtime top-up</Text>
                  <Text style={styles.netHint}>Own amount, up to R500.00</Text>
                </View>
              </View>
              <View style={styles.amountStrip}>
                <Text style={styles.amountR}>R</Text>
                <View style={styles.amountDivider} />
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Brand.white}
                  selectTextOnFocus
                />
              </View>
            </View>

            <Text style={styles.cellTitle}>
              Enter cellphone number to top-up
            </Text>
            <View style={styles.cellWrap}>
              <Text style={styles.cellLabel}>Cellphone number</Text>
              <View style={styles.cellRow}>
                <TextInput
                  style={styles.cellInput}
                  value={phone ? `+27 ${phone}` : "+27"}
                  onChangeText={(v) =>
                    setPhone(v.startsWith("+27") ? v.slice(3).trimStart() : v)
                  }
                  keyboardType="phone-pad"
                />
                <SymbolView
                  name={{
                    ios: "plus.circle",
                    android: "add_circle",
                    web: "add_circle",
                  }}
                  size={26}
                  tintColor={Brand.blue}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + Spacing.two },
          ]}
        >
          <Pressable
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canNext}
          >
            <Text
              style={[
                styles.nextBtnText,
                !canNext && styles.nextBtnTextDisabled,
              ]}
            >
              NEXT
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  fromBlock: {
    backgroundColor: Brand.screen,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  fromLabel: {
    color: Brand.textDark,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.three,
  },
  limitLabel: { color: Brand.textMuted, fontSize: 14 },
  limitValue: { color: Brand.textDark, fontSize: 14, fontWeight: "700" },
  toBlock: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  toLabel: {
    color: Brand.textDark,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  toCard: {
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: 4,
    overflow: "hidden",
  },
  toHead: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
  },
  netName: { color: Brand.textDark, fontSize: 16, fontWeight: "700" },
  netSub: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  netHint: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  amountStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  amountR: { color: Brand.white, fontSize: 22, fontWeight: "400" },
  amountDivider: {
    width: 1,
    height: 24,
    backgroundColor: Brand.white,
    marginHorizontal: Spacing.three,
    opacity: 0.5,
  },
  amountInput: {
    flex: 1,
    color: Brand.white,
    fontSize: 22,
    textAlign: "right",
    padding: 0,
  },
  cellTitle: {
    color: Brand.textDark,
    fontSize: 17,
    fontWeight: "600",
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  cellWrap: {
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    borderRadius: 4,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  cellLabel: { color: Brand.textMuted, fontSize: 12 },
  cellRow: { flexDirection: "row", alignItems: "center" },
  cellInput: {
    flex: 1,
    color: Brand.textDark,
    fontSize: 17,
    paddingVertical: Spacing.one,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
    backgroundColor: Brand.white,
  },
  nextBtn: {
    backgroundColor: Brand.blue,
    borderRadius: 4,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  nextBtnDisabled: { backgroundColor: "#E2E5EA" },
  nextBtnText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  nextBtnTextDisabled: { color: Brand.textMuted },
});
