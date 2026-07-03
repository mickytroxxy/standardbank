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

import {
    addTransaction,
    formatRand,
    formatVoucherNumber,
    saveVoucher,
    sendSms,
    updateBalances,
} from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setBalances } from "@/store/account-info-slice";
import type { ProofMethod } from "./beneficiary-account";

type Beneficiary = {
  type?: "bank" | "cell";
  holderName?: string;
  bank?: string;
  branchName?: string;
  branchCode?: string;
  accountNumber?: string;
  theirRef?: string;
  myRef?: string;
  proof?: ProofMethod;
  save?: boolean;
  name?: string;
  surname?: string;
  phone?: string;
};
export type Payment = {
  beneficiary: Beneficiary;
  amount: number;
  immediate: boolean;
  myRef: string;
  theirRef: string;
  proof: ProofMethod;
  proofContact: string;
  theirName: string;
  pin?: string;
};

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

function buildPaymentReference(date: Date, existingReference?: string): string {
  if (existingReference?.trim()) {
    return existingReference.trim();
  }

  const yymmdd = `${String(date.getFullYear()).slice(-2)}${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const refId = Array.from({ length: 8 }, () =>
    Math.floor(Math.random() * 10),
  ).join("");
  return `${yymmdd}SBGRPP${refId}C${refId}`;
}

export function proofContactLabel(p: ProofMethod): string {
  if (p === "Email") return "Email";
  if (p === "Fax") return "Fax";
  return "Cellphone";
}

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

export default function ReviewDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ payment?: string }>();
  const {
    phoneNumber,
    accountNumber,
    availableBalance,
    latestBalance,
    firstName,
    lastName,
  } = useAppSelector((s) => s.accountInfo);
  const allowStandardBankTransfers = useAppSelector(
    (s) => s.ui.allowStandardBankTransfers,
  );
  const [submitting, setSubmitting] = useState(false);

  let payment: Payment;
  try {
    payment = JSON.parse(params.payment ?? "{}");
  } catch {
    payment = {} as Payment;
  }
  const ben = payment.beneficiary ?? ({} as Beneficiary);
  const isCell = ben.type === "cell";
  const displayName = isCell
    ? [ben.name, ben.surname].filter(Boolean).join(" ")
    : (ben.holderName ?? "");
  const displaySub = isCell ? (ben.phone ?? "") : (ben.accountNumber ?? "");
  const initial = isCell
    ? `${(ben.name ?? "").charAt(0)}${(ben.surname ?? "").charAt(0)}`.toUpperCase()
    : displayName.trim().charAt(0).toUpperCase();

  async function handleConfirm() {
    if (
      submitting ||
      !phoneNumber ||
      availableBalance == null ||
      latestBalance == null
    )
      return;

    // ── Location gate ─────────────────────────────────────────────────────────
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

    // If beneficiary is a bank and it's Standard Bank and transfers are disabled, block
    const isStandardBank = (ben.bank ?? "")
      .toLowerCase()
      .includes("standard bank");
    if (!isCell && isStandardBank && !allowStandardBankTransfers) {
      Alert.alert(
        "Transaction could not be processed",
        "Transaction could not be processed, please go to your nearest branch.",
      );
      return;
    }
    setSubmitting(true);
    const newAvailable = availableBalance - payment.amount;
    const newLatest = latestBalance - payment.amount;
    const d = new Date();
    const date = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
    const fullDate = `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    const voucherDate = `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const voucherNumber = isCell
      ? Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join(
          "",
        )
      : "";
    const transactionReference = buildPaymentReference(d, payment.myRef);
    const paymentWithReference = { ...payment, myRef: transactionReference };
    try {
      await addTransaction(phoneNumber, {
        date,
        fullDate,
        time,
        title: displayName.toUpperCase() || "PAYMENT",
        sub: isCell ? "INSTANT MONEY" : "IMMEDIATE PAYMENT",
        amount: `-${payment.amount.toFixed(2)}`,
        beneficiaryName: displayName,
        account: displaySub,
        myRef: transactionReference,
        theirRef: payment.theirRef ?? "",
        runningBalance: formatRand(newLatest),
        latitude,
        longitude,
      });
      if (isCell) {
        await saveVoucher(phoneNumber, {
          phone: ben.phone ?? "",
          amount: payment.amount,
          voucherNumber,
          pin: payment.pin ?? "",
          myRef: transactionReference,
          beneficiaryName: displayName,
          date: voucherDate,
        });
        const smsBody = `Standard Bank: IM Voucher ${formatVoucherNumber(voucherNumber)}, R${payment.amount.toFixed(0)}. Download Instant Money App to redeem in Wallet or at PEP, Checkers, Shoprite. Ts&Cs apply. 0860466639`;
        sendSms(ben.phone ?? "", smsBody).catch(() => {});
      } else if (payment.proof === "SMS" && payment.proofContact) {
        const senderName = [firstName, lastName]
          .filter(Boolean)
          .join(" ")
          .toUpperCase();
        const acctTail = (ben.accountNumber ?? "").slice(-4);
        const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const smsTime = `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
        const ref = buildPaymentReference(d, payment.myRef);
        const smsBody = `Standard Bank - Payment from ${senderName} to Account: **${acctTail}. Amount R${payment.amount.toFixed(2)} on ${isoDate} at ${smsTime}. Ref ${ref}. Please check your account.`;
        sendSms(payment.proofContact, smsBody).catch(() => {});
      }
      await updateBalances(phoneNumber, newAvailable, newLatest);
      dispatch(
        setBalances({
          availableBalance: newAvailable,
          latestBalance: newLatest,
        }),
      );
      router.replace({
        pathname: "/confirmation",
        params: {
          payment: JSON.stringify(paymentWithReference),
          newAvailable: String(newAvailable),
          voucherNumber,
        },
      });
    } catch (e) {
      setSubmitting(false);
      Alert.alert("Payment failed", e instanceof Error ? e.message : String(e));
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
        <Pressable onPress={handleConfirm} disabled={submitting} hitSlop={8}>
          <Text style={[styles.action, submitting && { opacity: 0.5 }]}>
            CONFIRM
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: Spacing.three,
          paddingBottom: Spacing.six,
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
          <View style={styles.amountStrip}>
            <Text style={styles.amountStripText}>
              {formatRand(payment.amount ?? 0)}
            </Text>
          </View>
          <View style={styles.rowsBlock}>
            <Row
              label="Available balance"
              value={
                availableBalance != null ? formatRand(availableBalance) : "—"
              }
              last={isCell}
            />
            {!isCell && (
              <Row label="My reference" value={payment.myRef || "—"} last />
            )}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.four }]}>
          To
        </Text>
        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.benAvatar}>
              <Text style={styles.benAvatarText}>{initial || "?"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.benName}>{displayName || "—"}</Text>
              <Text style={styles.benNum}>{displaySub || "—"}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowsBlock}>
            <Row label="Amount" value={formatRand(payment.amount ?? 0)} />
            {isCell ? (
              <>
                <Row label="Cash collection PIN" value={payment.pin || "—"} />
                <Row label="My reference" value={payment.myRef || "—"} last />
              </>
            ) : (
              <>
                <Row
                  label="Bank details"
                  lines={
                    [ben.bank, ben.branchName, ben.branchCode].filter(
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
              </>
            )}
          </View>
        </View>
      </ScrollView>
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
  amountStrip: {
    backgroundColor: "#E8EAED",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  amountStripText: { color: Brand.textDark, fontSize: 22, fontWeight: "400" },
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
  benAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  benAvatarText: { color: Brand.white, fontSize: 18, fontWeight: "600" },
  benName: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  benNum: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.divider,
    marginHorizontal: Spacing.three,
  },
});
