import Ionicons from "@react-native-vector-icons/ionicons";
import { Asset } from "expo-asset";
import { cacheDirectory, copyAsync } from "expo-file-system/legacy";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
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
const SEND_POP_ENDPOINT =
  "https://mrdocs-server-621707723909.europe-west1.run.app/api/send-standard-bank-pop";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function maskAccountNumber(account: string): string {
  if (!account || account === "—") return account;
  const tail = account.slice(-4);
  if (!/\d{4}$/.test(tail)) return account;
  return `${"X".repeat(Math.max(0, account.length - 4))}${tail}`;
}

function formatPaymentTime(time: string): string {
  if (time.match(/^\d{2}:\d{2}$/)) {
    return time.replace(":", "h");
  }
  return time;
}

function formatPaymentDate(date: string): string {
  if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return date;
  }
  return date;
}

async function fetchLocalFileAsBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error(`Unable to read PDF file for upload: ${response.status}`);
  }
  if (typeof response.blob !== "function") {
    throw new Error("Browser does not support response.blob().");
  }
  const blob = await response.blob();
  if (!(blob instanceof Blob)) {
    throw new Error("Failed to create Blob from PDF URI.");
  }
  return blob;
}

async function appendFileToFormData(formData: FormData, uri: string) {
  if (Platform.OS === "web") {
    const fileBlob = await fetchLocalFileAsBlob(uri);
    formData.append("file", fileBlob, "proof-of-payment.pdf");
  } else {
    formData.append("file", {
      uri,
      name: "PaymentConfirmation.pdf",
      type: "application/pdf",
    } as any);
  }
}

export function buildProofOfPaymentHtml(args: {
  tx: Transaction;
  amountText: string;
  holderName: string;
  accountNumber: string;
  generatedAt: string;
  reference: string;
  logoUri: string;
  isImmediate: boolean;
}): string {
  const { tx, amountText, holderName, reference, logoUri, isImmediate } = args;
  const e = escapeHtml;
  const paymentDate = formatPaymentDate(tx.date ?? tx.fullDate ?? "—");
  const paymentTime = formatPaymentTime(tx.time ?? "");
  const paymentDateTime = paymentTime
    ? `${paymentDate} ${paymentTime}`
    : paymentDate;
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
  body { font-family: Arial, Helvetica, sans-serif; color: #000000ff; margin: 0; background: #fff; }
  .page { padding: 40px 48px 36px; position: relative; min-height: 100vh; }
  .top-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand-block { display: flex; align-items: center; gap: 12px; }
  .logo-img { width: 80px; height: auto; }
  .brand-name { font-size: 28px; font-weight: 700; color: #003ccd; margin: 0; }
  .address { text-align: right; font-size: 11px; line-height: 1.5; color: #333; max-width: 320px; }
  .content { padding-top: 8px; padding-bottom: 140px; }
  h1 { font-size: 20px; margin: 0 0 18px; color: #000000ff; }
  p { margin: 0 0 8px; line-height: 1.6; font-size: 13px; color: #000; }
  .field-list { margin: 14px 0 0; padding: 0; }
  .row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 13px; }
  .row-label { color: #000; width: 45%; font-weight: 700; }
  .row-value { color: #000; font-weight: 500; text-align: left; width: 50%; }
  .group { margin-top: 24px; }
  .group strong { font-weight: 700; }
  .signature { margin-top: 30px; }
  .signature p { margin-bottom: 2px; }
  .footer { position: fixed; bottom: 0; left: 48px; right: 48px; padding-top: 14px; border-top: 1px solid #dfe3e8; font-size: 11px; color: #575d68ff; line-height: 1.5; margin: 0; background: #fff; }
</style>
</head>
<body>
  <div class="page">
    <div class="top-row">
      <div class="brand-block">
        <img class="logo-img" src="${e(logoUri)}" alt="Standard Bank logo" />
        <div>
          <p class="brand-name">Standard Bank</p>
        </div>
      </div>
      <div class="address">
        <div>Internet Banking</div>
        <div>Standard Bank Centre</div>
        <div>5 Simmonds Street, Johannesburg, 2001</div>
        <div>P.O. Box 7725, Johannesburg, 2000</div>
        <div>Telephone: 0860 123 000</div>
        <div>International: +27 11 299 4701</div>
        <div>Fax: +27 11 631 8550</div>
        <div>Website: www.standardbank.co.za</div>
      </div>
    </div>

    <div class="content">
      <p>Dear ${e(tx.beneficiaryName ?? tx.title ?? "Customer")},</p>
      <p>${isImmediate ? "Immediate Payment Confirmation" : "Payment Confirmation"}</p>

      <div class="field-list">
        ${row("Reference number", reference)}
        ${row("Beneficiary name", tx.beneficiaryName ?? tx.title ?? "—")}
        ${row("Bank name", tx.bankName ?? "FIRST NATIONAL BANK")}
        ${row("Beneficiary account number", maskAccountNumber(tx.account ?? "—"))}
        ${row("Beneficiary branch number", tx.branchCode ?? "—")}
        ${row("Beneficiary reference", tx.theirRef ?? tx.title ?? "—")}
        ${row("Amount", amountText)}
        ${row("Payment date and time", paymentDateTime || "—")}
      </div>

      <div class="group">
        <div>If you need more information or have any questions about this payment, please contact:</div>
        <div style="margin-top: 8px;"><strong>${e(holderName)}</strong></div>
      </div>

      <div class="group">
        <div>Immediate payments may take a few hours.</div>
        <div style="margin-top: 5px;">Non-immediate payments to Standard Bank accounts may take up to 24 hours.</div>
        <div style="margin-top: 5px;">Non-immediate payments to other banks may take up to three business days.</div>
      </div>

      <div class="group">
        <p>Please check your account to confirm you have received this payment.</p>
      </div>

      <div class="signature">
        <p>Yours sincerely,</p>
        <p>The Internet Banking Team</p>
      </div>
    </div>

    <div class="footer">
      <b>The Standard Bank of South Africa Limited (Reg. No. 1962/000738/06) Authorised financial services provider and registered credit provider (NCRCP15).</b>
      <br />
      Directors: N Nyembezi (Chairman) DWP Hodnett* (Chief Executive Officer) LL Bam HJ Berrange PLH Cook A Daehnke* OA David-Borah* GJ Fraser-Moleketi GMB Keneally BJ Kruger Li Li2 JH Maree NNA Matyumza RN Ogega5 Fenglil TanZ SK Tshabalala*.
      <br />
      Company Secretary: K Kroneman - 2025/10/10.
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
  const absAmount = Math.abs(amountNum).toFixed(2);
  const amountText = `R${absAmount}`;
  const hasProofOfPayment = !isCredit && !!tx.beneficiaryName;

  const holder = useAppSelector((s) => s.accountInfo);
  const holderName = [holder.title, holder.firstName, holder.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const holderAccount = holder.accountNumber ?? "";
  const isImmediate = tx.sub?.toUpperCase() === "IMMEDIATE PAYMENT";

  const createProofPdfUri = async () => {
    if (typeof Print?.printToFileAsync !== "function") {
      throw new Error(
        "Rebuild the dev client (npx expo run:ios / run:android) so expo-print is linked.",
      );
    }

    const now = new Date();
    const generatedAt = now.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const reference = tx.referenceNumber?.trim()
      ? tx.referenceNumber.trim()
      : tx.myRef?.trim()
        ? tx.myRef.trim()
        : (() => {
            const yy = String(now.getFullYear()).slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, "0");
            const dd = String(now.getDate()).padStart(2, "0");
            const refId = Array.from({ length: 8 }, () =>
              Math.floor(Math.random() * 10),
            ).join("");
            return `${yy}${mm}${dd}SBGRPP${refId}C${refId}`;
          })();
    const logoAsset = Asset.fromModule(
      require("../../assets/images/logo.png") as number,
    );
    await logoAsset.downloadAsync();
    const html = buildProofOfPaymentHtml({
      tx,
      amountText,
      holderName: holderName || "Account holder",
      accountNumber: holderAccount,
      generatedAt,
      reference,
      logoUri: logoAsset.uri,
      isImmediate,
    });
    const { uri } = await Print.printToFileAsync({ html });
    return { uri, reference };
  };

  const handleDownload = async () => {
    setMenuOpen(false);
    try {
      const { uri } = await createProofPdfUri();
      const newPath = `${cacheDirectory}PaymentConfirmation.pdf`;
      await copyAsync({
        from: uri,
        to: newPath,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newPath, {
          mimeType: "application/pdf",
          dialogTitle: "Proof of payment",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Saved", `Proof of payment created at:\n${newPath}`);
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
              <Text style={styles.rowValue}>
                {formatPaymentDate(tx.date ?? tx.fullDate ?? "—")}
              </Text>
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
  notificationInfo: {
    color: Brand.blue,
    fontSize: 14,
    marginTop: 2,
    fontWeight: "600",
  },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    padding: Spacing.three,
  },
  modalCard: {
    backgroundColor: Brand.white,
    borderRadius: 10,
    padding: Spacing.three,
  },
  modalTitle: {
    color: Brand.textDark,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: Spacing.one,
  },
  modalText: {
    color: Brand.textMuted,
    fontSize: 14,
    marginBottom: Spacing.three,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Brand.divider,
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    color: Brand.textDark,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  modalCancelText: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "600",
  },
  modalSendBtn: {
    backgroundColor: Brand.blue,
    borderRadius: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  modalSendText: {
    color: Brand.white,
    fontSize: 15,
    fontWeight: "600",
  },
});
