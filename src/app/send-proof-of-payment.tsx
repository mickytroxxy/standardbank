import axios from "axios";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { Asset } from "expo-asset";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Sharing from "expo-sharing";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { sendSms } from "@/api";
import type { Transaction } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setProofSent } from "@/store/ui-slice";

type Method = "Email" | "SMS";
const METHODS: Method[] = ["Email", "SMS"];

const SEND_POP_ENDPOINT =
  "http://192.168.0.117:1337/api/send-standard-bank-pop";

const SUPPORT_NUMBER = "0860 123 000";

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

  const [method, setMethod] = useState<Method>("Email");
  const [methodOpen, setMethodOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [smsNumber, setSmsNumber] = useState("");
  const [sending, setSending] = useState(false);

  const amountNum = parseFloat(tx.amount ?? "0");
  const absAmount = Math.abs(amountNum).toFixed(2);
  const amountText = `-R ${absAmount}`;

  const holderName = [holder.title, holder.firstName, holder.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const holderAccount = holder.accountNumber ?? "";
  const isImmediate = tx.sub?.toUpperCase() === "IMMEDIATE PAYMENT";

  const canSend =
    method === "Email"
      ? /.+@.+\..+/.test(email.trim())
      : smsNumber.replace(/[^0-9]/g, "").length >= 10;

  const createProofPdfUri = async () => {
    const now = new Date();
    const generatedAt = now.toLocaleString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const reference = tx.myRef?.trim()
      ? tx.myRef.trim()
      : `POP${now.getTime().toString().slice(-10)}`;
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

  async function appendFileToFormData(formData: FormData, uri: string) {
    if (Platform.OS === "web") {
      const response = await fetch(uri);
      const fileBlob = await response.blob();
      formData.append("file", fileBlob, "proof-of-payment.pdf");
    } else {
      formData.append("file", {
        uri,
        name: "proof-of-payment.pdf",
        type: "application/pdf",
      } as any);
    }
  }

  async function handleSend() {
    if (!canSend) return;
    setSending(true);

    try {
      const { uri, reference } = await createProofPdfUri();
      const paymentDate = `${new Date(
        tx.fullDate ?? tx.date ?? new Date(),
      ).getTime()}`;

      const formData = new FormData();
      await appendFileToFormData(formData, uri);
      formData.append("notificationValue", method === "Email" ? email.trim() : smsNumber);
      formData.append("senderName", holderName || "Account holder");
      formData.append("amount", absAmount);
      formData.append("accountNumber", tx.account ?? holderAccount ?? "");
      formData.append("paymentReference", reference);
      formData.append("date", paymentDate);
      formData.append("bankName", "");
      formData.append("isImmediate", isImmediate ? "true" : "false");
      formData.append("notificationType", method.toLowerCase());

      if (method === "Email") {
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
        const success = await sendSms(smsNumber, `Payment of ${amountText} sent to ${tx.beneficiaryName ?? tx.title}. Ref: ${reference}`);
        if (!success) throw new Error("Failed to send SMS.");
      }

      dispatch(setProofSent());
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert("Send failed", message);
    } finally {
      setSending(false);
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
        <Text style={styles.headerTitle}>SEND</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: Spacing.six }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.summary}>
            <Text style={styles.summaryAmount}>{amountText}</Text>
            <Text style={styles.summaryTitle}>
              {tx.beneficiaryName ?? tx.title}
            </Text>
            <Text style={styles.summarySub}>{tx.fullDate ?? tx.date}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.fieldLabel}>Proof of payment method</Text>
            <Pressable
              style={styles.dropdown}
              onPress={() => setMethodOpen((v) => !v)}
            >
              <Text style={styles.dropdownText}>{method}</Text>
              <SymbolView
                name={
                  methodOpen
                    ? {
                        ios: "chevron.up",
                        android: "keyboard_arrow_up",
                        web: "keyboard_arrow_up",
                      }
                    : {
                        ios: "chevron.down",
                        android: "keyboard_arrow_down",
                        web: "keyboard_arrow_down",
                      }
                }
                size={20}
                tintColor={Brand.blue}
              />
            </Pressable>
            {methodOpen && (
              <View style={styles.dropdownList}>
                {METHODS.map((m) => (
                  <Pressable
                    key={m}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setMethod(m);
                      setMethodOpen(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{m}</Text>
                    {m === method && (
                      <SymbolView
                        name={{
                          ios: "checkmark",
                          android: "check",
                          web: "check",
                        }}
                        size={18}
                        tintColor={Brand.blue}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            {method === "Email" ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: Spacing.four }]}>
                  Email address
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@example.com"
                  placeholderTextColor={Brand.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { marginTop: Spacing.four }]}>
                  Cell phone number
                </Text>
                <TextInput
                  value={smsNumber}
                  onChangeText={setSmsNumber}
                  placeholder="0XX XXX XXXX"
                  placeholderTextColor={Brand.textMuted}
                  keyboardType="phone-pad"
                  maxLength={13}
                  style={styles.input}
                />
              </>
            )}

            <View style={styles.info}>
              <MaterialDesignIcons
                name="information-outline"
                size={20}
                color={Brand.blue}
              />
              <Text style={styles.infoText}>
                Standard data and SMS charges apply.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + Spacing.three },
        ]}
      >
        <Pressable
          style={[styles.sendBtn, !canSend && { opacity: 0.5 }]}
          disabled={!canSend}
          onPress={handleSend}
        >
          <Text style={styles.sendText}>SEND</Text>
        </Pressable>
      </View>
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
    fontWeight: "700",
    letterSpacing: 1,
  },
  summary: {
    alignItems: "center",
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  summaryAmount: {
    color: "#D32F2F",
    fontSize: 32,
    fontWeight: "400",
    marginBottom: Spacing.two,
  },
  summaryTitle: {
    color: Brand.textDark,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  summarySub: {
    color: Brand.textMuted,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  section: { padding: Spacing.three },
  fieldLabel: {
    color: Brand.textMuted,
    fontSize: 13,
    marginBottom: Spacing.two,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Brand.blue,
    paddingVertical: Spacing.two,
  },
  dropdownText: {
    color: Brand.textDark,
    fontSize: 16,
    fontWeight: "500",
  },
  dropdownList: {
    backgroundColor: Brand.white,
    borderRadius: 4,
    marginTop: Spacing.one,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.divider,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dropdownItemText: { color: Brand.textDark, fontSize: 16 },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: Brand.blue,
    paddingVertical: Spacing.two,
    color: Brand.textDark,
    fontSize: 16,
  },
  info: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.two,
    marginTop: Spacing.four,
    padding: Spacing.three,
    backgroundColor: "#EAF2FF",
    borderRadius: 6,
  },
  infoText: {
    flex: 1,
    color: Brand.textDark,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  sendBtn: {
    backgroundColor: Brand.blue,
    borderRadius: 6,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  sendText: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
