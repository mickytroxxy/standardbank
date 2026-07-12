import type { Transaction } from "@/api";
import { sendSms, updateTransaction } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setProofSent } from "@/store/ui-slice";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import axios from "axios";
import { Asset } from "expo-asset";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { buildProofOfPaymentHtml } from "./transaction-details";

type Method = "Email - R 1.50" | "SMS - R 1.20";

const SEND_POP_ENDPOINT =
  "https://mrdocs-server-621707723909.europe-west1.run.app/api/send-standard-bank-pop";

function formatPopDate(dateStr?: string): string {
  if (!dateStr) return "—";
  if (dateStr.includes(" ")) return dateStr;
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const months = [
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
    return `${d} ${months[m]} ${y}`;
  }
  return dateStr;
}

export default function SendProofOfPaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const params = useLocalSearchParams<{ tx?: string }>();
  const holder = useAppSelector((s) => s.accountInfo);

  let tx: Transaction;
  try {
    tx = JSON.parse(params.tx ?? "{}");
  } catch {
    tx = {} as Transaction;
  }

  const [method, setMethod] = useState<Method>("Email - R 1.50");
  const [methodOpen, setMethodOpen] = useState(false);
  const [contactValue, setContactValue] = useState("");
  const [recipientName, setRecipientName] = useState(
    tx.beneficiaryName ?? tx.title ?? "",
  );
  const [sending, setSending] = useState(false);

  const amountNum = parseFloat(tx.amount ?? "0");
  const absAmount = Math.abs(amountNum).toFixed(2);
  const amountText = `R ${absAmount}`;

  const holderName = [holder.title, holder.firstName, holder.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const holderAccount = holder.accountNumber ?? "";
  const isImmediate = tx.sub?.toUpperCase() === "IMMEDIATE PAYMENT";

  const isEmailMode = method.startsWith("Email");
  const canSend = isEmailMode
    ? /.+@.+\..+/.test(contactValue.trim())
    : contactValue.replace(/[^0-9]/g, "").length >= 10;

  const createProofPdfUri = async () => {
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
      amountText: `R${absAmount}`,
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

  async function appendFileToFormData(formData: FormData, uri: string) {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const fileBlob = await response.blob();
      formData.append("file", fileBlob, "proof-of-payment.pdf");
    } else {
      formData.append("file", {
        uri,
        name: "PaymentConfirmation.pdf",
        type: "application/pdf",
      } as any);
    }
  }

  async function handleSend() {
    if (!canSend || sending) return;
    setSending(true);

    try {
      const { uri, reference } = await createProofPdfUri();
      const paymentDate = `${new Date(
        tx.fullDate ?? tx.date ?? new Date(),
      ).getTime()}`;

      const formData = new FormData();
      await appendFileToFormData(formData, uri);
      formData.append("notificationValue", contactValue.trim());
      formData.append("senderName", holderName || "Account holder");
      formData.append("amount", absAmount);
      formData.append("accountNumber", tx.account ?? holderAccount ?? "");
      formData.append("paymentReference", reference);
      formData.append("date", paymentDate);
      formData.append("bankName", "");
      formData.append("isImmediate", isImmediate ? "true" : "false");
      formData.append("notificationType", isEmailMode ? "email" : "sms");

      if (isEmailMode) {
        const response = await axios.post(SEND_POP_ENDPOINT, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          transformRequest: (data, headers) => {
            delete headers?.["Content-Type"];
            return data;
          },
        });

        if (response.status !== 200 && response.status !== 201) {
          throw new Error(response.data?.message || "Failed to send email.");
        }
      } else {
        const success = await sendSms(
          contactValue,
          `Payment of R ${absAmount} sent to ${recipientName}. Ref: ${reference}`,
        );
        if (!success) throw new Error("Failed to send SMS.");
      }

      dispatch(setProofSent());

      if (tx.id) {
        await updateTransaction(holder?.phoneNumber as any, tx.id, {
          notificationType: isEmailMode ? "Email" : "SMS",
          notificationValue: contactValue.trim(),
        });
      }

      Alert.alert("Success", "Proof of payment sent successfully.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Send failed", message);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header Container wraps the header and colors the status bar area blue */}
      <View style={{ backgroundColor: Brand.blue, paddingTop: insets.top }}>
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <MaterialDesignIcons
              name="arrow-left"
              size={24}
              color={Brand.white}
            />
          </Pressable>
          <Text style={styles.headerTitle}>Send Proof Of Payment</Text>
          <Pressable onPress={handleSend} disabled={!canSend || sending}>
            {sending ? (
              <ActivityIndicator size="small" color={Brand.white} />
            ) : (
              <Text style={[styles.sendText, !canSend && { opacity: 0.6 }]}>
                SEND
              </Text>
            )}
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Proof of Payment Details */}
          <Text style={styles.sectionTitle}>Proof of payment</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Beneficiary name</Text>
            <Text style={styles.detailValue}>
              {tx.beneficiaryName ?? tx.title ?? "—"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction date</Text>
            <Text style={styles.detailValue}>
              {formatPopDate(tx.fullDate ?? tx.date)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction time</Text>
            <Text style={styles.detailValue}>{tx.time ?? "—"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>My reference</Text>
            <Text style={styles.detailValue}>{tx.myRef || "—"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Their reference</Text>
            <Text style={styles.detailValue}>{tx.theirRef || "—"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>To account</Text>
            <Text style={styles.detailValue}>{tx.account ?? "—"}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction amount</Text>
            <Text style={styles.detailValue}>{amountText}</Text>
          </View>

          {/* Selector / Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Send using</Text>
            <Pressable
              style={styles.dropdownInput}
              onPress={() => setMethodOpen((v) => !v)}
            >
              <Text style={styles.dropdownInputValue}>{method}</Text>
              <MaterialDesignIcons
                name="menu-down"
                size={24}
                color={Brand.navy}
              />
            </Pressable>

            {methodOpen && (
              <View style={styles.dropdownMenu}>
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMethod("Email - R 1.50");
                    setMethodOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>Email - R 1.50</Text>
                </Pressable>
                <Pressable
                  style={styles.dropdownItem}
                  onPress={() => {
                    setMethod("SMS - R 1.20");
                    setMethodOpen(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>SMS - R 1.20</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Contact Input Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              {isEmailMode ? "Email" : "Cellphone number"}
            </Text>
            <View style={styles.textInputWrapper}>
              <TextInput
                value={contactValue}
                onChangeText={setContactValue}
                placeholder={
                  isEmailMode ? "Enter recipient email" : "e.g. 082 123 4567"
                }
                placeholderTextColor={Brand.textMuted}
                keyboardType={isEmailMode ? "email-address" : "phone-pad"}
                autoCapitalize="none"
                style={styles.textInput}
              />
              <Pressable style={styles.addIconBtn}>
                <MaterialDesignIcons
                  name="plus-circle-outline"
                  size={22}
                  color={Brand.blue}
                />
              </Pressable>
            </View>
          </View>

          {/* Recipient Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Their name</Text>
            <TextInput
              value={recipientName}
              onChangeText={setRecipientName}
              style={styles.textInput}
            />
          </View>

          {/* Warning / Disclaimer Card */}
          <View style={styles.warningCard}>
            <View style={styles.infoIconWrapper}>
              <MaterialDesignIcons
                name="information"
                size={20}
                color={Brand.navy}
              />
            </View>
            <Text style={styles.warningText}>
              Please ensure you insert the correct recipient details before you
              send the proof of payment. We are not responsible for any loss you
              may suffer as a result of you entering the wrong recipient
              details.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
  },
  backBtn: {
    padding: Spacing.one,
  },
  headerTitle: {
    color: Brand.white,
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    marginLeft: Spacing.two,
  },
  sendText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.six,
  },
  sectionTitle: {
    color: Brand.blueDeep,
    fontSize: 15,
    fontWeight: "700",
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.two - 1,
  },
  detailLabel: {
    color: Brand.textMuted,
    fontSize: 15,
    fontWeight: "400",
  },
  detailValue: {
    color: Brand.textDark,
    fontSize: 15,
    fontWeight: "500",
  },
  inputGroup: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  inputLabel: {
    color: Brand.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  dropdownInput: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1.2,
    borderBottomColor: Brand.divider,
    paddingVertical: Spacing.two,
  },
  dropdownInputValue: {
    color: Brand.textDark,
    fontSize: 16,
    fontWeight: "400",
  },
  dropdownMenu: {
    backgroundColor: Brand.white,
    borderWidth: 1,
    borderColor: Brand.divider,
    borderRadius: 6,
    marginTop: 4,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  dropdownItemText: {
    color: Brand.textDark,
    fontSize: 15,
  },
  textInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.2,
    borderBottomColor: Brand.divider,
  },
  textInput: {
    flex: 1,
    color: Brand.textDark,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  addIconBtn: {
    paddingHorizontal: Spacing.two,
  },
  warningCard: {
    flexDirection: "row",
    backgroundColor: "#F4F6F9",
    borderLeftWidth: 4,
    borderLeftColor: Brand.blueDeep,
    borderRadius: 8,
    padding: Spacing.three,
    marginTop: Spacing.five,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
  },
  infoIconWrapper: {
    marginRight: Spacing.two,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    color: Brand.textDark,
    fontSize: 13,
    lineHeight: 18,
  },
});
