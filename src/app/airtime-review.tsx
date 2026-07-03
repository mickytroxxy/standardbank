import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import * as Location from "expo-location";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { addTransaction, formatRand, updateBalances } from "@/api";
import {
    NetworkLogo,
    networkDisplay,
    type NetworkId,
} from "@/components/network-logo";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setBalances } from "@/store/account-info-slice";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function AirtimeReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{
    network?: string;
    amount?: string;
    phone?: string;
  }>();
  const network = (params.network as NetworkId) ?? "Vodacom";
  const amount = parseFloat(params.amount ?? "0") || 0;
  const phone = params.phone ?? "";

  const { phoneNumber, accountNumber, availableBalance, latestBalance } =
    useAppSelector((s) => s.accountInfo);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    if (
      submitting ||
      !phoneNumber ||
      availableBalance == null ||
      latestBalance == null
    )
      return;

    // ── Location gate ────────────────────────────────────────────────────────
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== Location.PermissionStatus.GRANTED) {
      Alert.alert(
        "Location Required",
        "Standard Bank requires your location to process transactions. Please enable Location Services and try again.",
        [{ text: "OK" }],
      );
      return;
    }
    let latitude: number | undefined;
    let longitude: number | undefined;
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      latitude = pos.coords.latitude;
      longitude = pos.coords.longitude;
    } catch {
      Alert.alert(
        "Location Unavailable",
        "Could not retrieve your location. Please check your Location Services and try again.",
      );
      return;
    }
    // ─────────────────────────────────────────────────────────────────────────

    setSubmitting(true);
    const newAvailable = availableBalance - amount;
    const newLatest = latestBalance - amount;
    const d = new Date();
    const date = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    const fullDate = `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    try {
      await addTransaction(phoneNumber, {
        date,
        fullDate,
        time,
        title: `${networkDisplay(network).toUpperCase()} AIRTIME`,
        sub: "AIRTIME PURCHASE",
        amount: `-${amount.toFixed(2)}`,
        beneficiaryName: phone,
        runningBalance: formatRand(newLatest),
        latitude,
        longitude,
      });
      await updateBalances(phoneNumber, newAvailable, newLatest);
      dispatch(
        setBalances({
          availableBalance: newAvailable,
          latestBalance: newLatest,
        }),
      );
      router.replace({
        pathname: "/airtime-confirmation",
        params: { network, amount: String(amount), phone },
      });
    } catch (e) {
      setSubmitting(false);
      Alert.alert(
        "Purchase failed",
        e instanceof Error ? e.message : String(e),
      );
    }
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
        <Text style={styles.headerTitle}>Review Details</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.three,
          paddingBottom: Spacing.six,
        }}
      >
        <Text style={styles.sectionLabel}>Pay from</Text>
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
          <View style={styles.amountStrip}>
            <Text style={styles.amountStripText}>{formatRand(amount)}</Text>
          </View>
          <View style={styles.rowsBlock}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Available Balance</Text>
              <Text style={styles.rowValue}>
                {availableBalance != null ? formatRand(availableBalance) : "—"}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.four }]}>
          To
        </Text>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <NetworkLogo id={network} size={40} />
            <View style={{ flex: 1, marginLeft: Spacing.three }}>
              <Text style={styles.fromName}>{networkDisplay(network)}</Text>
              <Text style={styles.fromNum}>Airtime</Text>
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
        <Pressable
          style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          <Text style={styles.confirmText}>CONFIRM</Text>
        </Pressable>
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
  back: { paddingRight: Spacing.two },
  headerTitle: { flex: 1, color: Brand.white, fontSize: 22, fontWeight: "400" },
  sectionLabel: {
    color: Brand.textDark,
    fontSize: 17,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  card: {
    backgroundColor: Brand.white,
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
  walletIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.three,
  },
  fromName: { color: Brand.textDark, fontSize: 16, fontWeight: "700" },
  fromNum: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  amountStrip: {
    backgroundColor: "#E8EAED",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  amountStripText: { color: Brand.textDark, fontSize: 22, fontWeight: "400" },
  rowsBlock: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.three,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  rowLabel: { color: Brand.textMuted, fontSize: 15 },
  rowValue: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.divider,
    marginHorizontal: Spacing.three,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
    backgroundColor: Brand.white,
  },
  confirmBtn: {
    backgroundColor: Brand.blue,
    borderRadius: 4,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  confirmText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
