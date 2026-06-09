import Ionicons from "@react-native-vector-icons/ionicons";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Transaction } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearProofSent } from "@/store/ui-slice";

const SUPPORT_NUMBER = "0860 123 000";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildProofOfPaymentHtml(args: {
  tx: Transaction;
  amountText: string;
  holderName: string;
  accountNumber: string;
  generatedAt: string;
  reference: string;
}): string {
  const { tx, amountText, holderName, accountNumber, generatedAt, reference } =
    args;
  const e = escapeHtml;
  const row = (label: string, value: string) =>
    `<div class="row"><div class="row-label">${e(label)}</div><div class="row-value">${e(value)}</div></div>`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  @page { margin: 0; size: A4; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #0A1F44; margin: 0; }
  .header { background: #003ccd; color: #fff; padding: 28px 40px; }
  .brand { font-size: 22px; font-weight: bold; letter-spacing: 1px; }
  .title { font-size: 16px; margin-top: 4px; opacity: 0.9; }
  .container { padding: 28px 40px 40px; }
  .meta { display: flex; justify-content: space-between; color: #6B7280; font-size: 11px; margin-bottom: 8px; }
  .section-label { color: #003ccd; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.8px; margin: 20px 0 8px; }
  .card { border: 1px solid #E2E5EA; border-radius: 6px; padding: 14px 18px; }
  .name { font-size: 15px; font-weight: bold; }
  .num { color: #6B7280; font-size: 12px; margin-top: 2px; }
  .amount-strip { background: #003ccd; color: #fff; text-align: center; padding: 14px; border-radius: 6px; margin: 16px 0 4px; font-size: 22px; font-weight: bold; letter-spacing: 0.5px; }
  .row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #E2E5EA; font-size: 12px; }
  .row:last-child { border-bottom: none; }
  .row-label { color: #6B7280; }
  .row-value { color: #0A1F44; font-weight: 600; text-align: right; max-width: 60%; }
  .status { text-align: center; color: #1F9D55; font-weight: bold; margin: 22px 0 6px; font-size: 13px; }
  .footer { border-top: 1px solid #E2E5EA; margin-top: 28px; padding-top: 14px; font-size: 10px; color: #6B7280; line-height: 1.6; }
  .footer-brand { font-weight: bold; color: #003ccd; margin-top: 8px; font-size: 11px; }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Standard Bank</div>
    <div class="title">Proof of payment</div>
  </div>
  <div class="container">
    <div class="meta">
      <div>Generated: ${e(generatedAt)}</div>
      <div>Reference: ${e(reference)}</div>
    </div>

    <div class="section-label">From</div>
    <div class="card">
      <div class="name">${e(holderName)}</div>
      <div class="num">MYMOACC &middot; ${e(accountNumber)}</div>
    </div>

    <div class="amount-strip">${e(amountText)}</div>

    <div class="section-label">To</div>
    <div class="card">
      <div class="name">${e(tx.beneficiaryName ?? tx.title ?? "—")}</div>
      <div class="num">${e(tx.account ?? "—")}</div>
    </div>

    <div class="section-label">Transaction details</div>
    <div class="card">
      ${row("Transaction date", tx.fullDate ?? tx.date ?? "—")}
      ${tx.time ? row("Time", tx.time) : ""}
      ${row("My reference", tx.myRef ?? "—")}
      ${tx.theirRef ? row("Their reference", tx.theirRef) : ""}
      ${row("Running balance", tx.runningBalance ?? "—")}
    </div>

    <div class="status">&#10003; This payment was successfully processed</div>

    <div class="footer">
      For queries please call ${e(SUPPORT_NUMBER)}.<br/>
      This document was generated electronically and does not require a signature.
      <div class="footer-brand">Standard Bank &mdash; Moving Forward&trade;</div>
    </div>
  </div>
</body>
</html>`;
}

export default function TransactionDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ tx?: string }>();
  const proofSent = useAppSelector((s) => s.ui.proofSent);

  const [menuOpen, setMenuOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (!proofSent) return;
    setToastVisible(true);
    dispatch(clearProofSent());
    const t = setTimeout(() => setToastVisible(false), 3500);
    return () => clearTimeout(t);
  }, [proofSent, dispatch]);

  let tx: Transaction;
  try {
    tx = JSON.parse(params.tx ?? "{}");
  } catch {
    tx = {} as Transaction;
  }

  const amountNum = parseFloat(tx.amount ?? "0");
  const isCredit = !!tx.credit;
  const sign = isCredit ? "" : amountNum < 0 ? "-" : "";
  const absAmount = Math.abs(amountNum).toFixed(2);
  const amountText = `${sign}R ${absAmount}`;
  const hasProofOfPayment = !isCredit && !!tx.beneficiaryName;

  const holder = useAppSelector((s) => s.accountInfo);
  const holderName = [holder.title, holder.firstName, holder.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const holderAccount = holder.accountNumber ?? "";

  const handleDownload = async () => {
    setMenuOpen(false);
    if (typeof Print?.printToFileAsync !== "function") {
      Alert.alert(
        "PDF unavailable",
        "Rebuild the dev client (npx expo run:ios / run:android) so expo-print is linked.",
      );
      return;
    }
    try {
      const now = new Date();
      const generatedAt = now.toLocaleString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const reference = tx.myRef ?? `POP${now.getTime().toString().slice(-10)}`;
      const html = buildProofOfPaymentHtml({
        tx,
        amountText,
        holderName: holderName || "Account holder",
        accountNumber: holderAccount,
        generatedAt,
        reference,
      });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Proof of payment",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved", `Proof of payment created at:\n${uri}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Download failed", message);
    }
  };

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
        <Text style={styles.headerTitle}>Transaction Details</Text>
      </View>

      <Pressable
        style={styles.scrollWrap}
        onPress={() => menuOpen && setMenuOpen(false)}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: Spacing.six }}>
          <View style={styles.amountBlock}>
            <Text
              style={[
                styles.amount,
                isCredit ? styles.amountCredit : styles.amountDebit,
              ]}
            >
              {amountText}
            </Text>
            <Text style={styles.amountTitle}>{tx.title}</Text>
            <Text style={styles.amountSub}>{tx.sub}</Text>
          </View>

          <View style={styles.rows}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Running balance</Text>
              <Text style={styles.rowValue}>{tx.runningBalance ?? "—"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Transaction date</Text>
              <Text style={styles.rowValue}>{tx.fullDate ?? tx.date}</Text>
            </View>
            <View style={styles.divider} />
            <Text style={styles.queryLine}>
              <Text style={styles.rowLabel}>Query this transaction? Call </Text>
              <Text
                style={styles.callLink}
                onPress={() =>
                  Linking.openURL(`tel:${SUPPORT_NUMBER.replace(/\s/g, "")}`)
                }
              >
                {SUPPORT_NUMBER}
              </Text>
            </Text>
          </View>

          {hasProofOfPayment && (
            <View style={styles.proofBlock}>
              <Text style={styles.proofHeading}>Proof of payment</Text>
              <View style={styles.proofRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bnName}>{tx.beneficiaryName}</Text>
                  <Text style={styles.bnAccount}>{tx.account}</Text>
                  <Text style={styles.bnRef}>{tx.myRef ?? tx.title}</Text>
                </View>
                <Pressable
                  onPress={() => setMenuOpen((v) => !v)}
                  hitSlop={8}
                  style={styles.menuBtn}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color={Brand.blue}
                  />
                </Pressable>
              </View>
              {menuOpen && (
                <View style={styles.menu}>
                  <Pressable
                    style={styles.menuItem}
                    onPress={() => {
                      setMenuOpen(false);
                      router.push({
                        pathname: "/send-proof-of-payment",
                        params: { tx: JSON.stringify(tx) },
                      });
                    }}
                  >
                    <Text style={styles.menuText}>Send</Text>
                  </Pressable>
                  <Pressable style={styles.menuItem} onPress={handleDownload}>
                    <Text style={styles.menuText}>Download</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </Pressable>

      {toastVisible && (
        <View style={[styles.toast, { bottom: insets.bottom + Spacing.three }]}>
          <Text style={styles.toastText}>
            Proof of payment sent successfully
          </Text>
        </View>
      )}
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
  headerTitle: {
    flex: 1,
    color: Brand.white,
    fontSize: 22,
    fontWeight: "400",
  },
  scrollWrap: { flex: 1 },
  amountBlock: {
    alignItems: "center",
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  amount: { fontSize: 36, fontWeight: "400", marginBottom: Spacing.two },
  amountCredit: { color: Brand.green },
  amountDebit: { color: "#D32F2F" },
  amountTitle: {
    color: Brand.textDark,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  amountSub: {
    color: Brand.textMuted,
    fontSize: 14,
    marginTop: Spacing.one,
    letterSpacing: 0.5,
  },
  rows: { paddingHorizontal: Spacing.three },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two,
  },
  rowLabel: { color: Brand.textDark, fontSize: 15 },
  rowValue: { color: Brand.textDark, fontSize: 15, fontWeight: "600" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.divider,
    marginVertical: Spacing.two,
  },
  queryLine: {
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  callLink: { color: Brand.blue, fontSize: 15, fontWeight: "500" },
  proofBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
  },
  proofHeading: {
    color: Brand.blue,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: Spacing.three,
  },
  proofRow: { flexDirection: "row", alignItems: "flex-start" },
  bnName: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  bnAccount: {
    color: Brand.textDark,
    fontSize: 14,
    marginTop: 2,
  },
  bnRef: { color: Brand.textMuted, fontSize: 14, marginTop: 2 },
  menuBtn: { paddingHorizontal: Spacing.two, paddingTop: 2 },
  menu: {
    position: "absolute",
    right: Spacing.three,
    top: 40,
    backgroundColor: Brand.white,
    borderRadius: 4,
    paddingVertical: Spacing.one,
    minWidth: 160,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  menuItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  menuText: { color: Brand.textDark, fontSize: 16 },
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
