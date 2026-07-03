import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AccountCard } from "@/components/account-card";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";
import type { ProofMethod } from "./beneficiary-account";

const PROOF_METHODS: ProofMethod[] = ["None", "SMS", "Email", "Fax"];

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

export default function PaymentDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ beneficiary?: string }>();
  const { accountNumber, availableBalance } = useAppSelector(
    (s) => s.accountInfo,
  );

  let ben: Beneficiary;
  try {
    ben = JSON.parse(params.beneficiary ?? "{}");
  } catch {
    ben = {} as Beneficiary;
  }

  const isCell = ben.type === "cell";
  const displayName = isCell
    ? [ben.name, ben.surname].filter(Boolean).join(" ")
    : (ben.holderName ?? "");
  const displaySub = isCell ? (ben.phone ?? "") : (ben.accountNumber ?? "");
  const displayBank = isCell ? "Instant Money" : (ben.bank ?? "");

  const [amount, setAmount] = useState("0.00");
  const [amountTouched, setAmountTouched] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const allowImmediatePayment = useAppSelector(
    (s) => s.ui.allowImmediatePayment,
  );
  const [myRef, setMyRef] = useState(() => {
    if (ben.myRef?.trim()) {
      return ben.myRef.trim();
    }
    const date = new Date();
    const yymmdd = `${String(date.getFullYear()).slice(-2)}${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const refId = Array.from({ length: 8 }, () =>
      Math.floor(Math.random() * 10),
    ).join("");
    return `${yymmdd}SBGRPP${refId}C${refId}`;
  });
  const [theirRef, setTheirRef] = useState(ben.theirRef ?? "");
  const [proof, setProof] = useState<ProofMethod>(ben.proof ?? "SMS");
  const [proofOpen, setProofOpen] = useState(false);
  const [proofContact, setProofContact] = useState(
    isCell ? (ben.phone ?? "") : "",
  );
  const [theirName, setTheirName] = useState(displayName);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [acceptedTcs, setAcceptedTcs] = useState(false);
  const pinRefs = useRef<Array<TextInput | null>>([null, null, null, null]);

  const initial = isCell
    ? `${(ben.name ?? "").charAt(0)}${(ben.surname ?? "").charAt(0)}`.toUpperCase()
    : displayName.trim().charAt(0).toUpperCase();
  const amountNum = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
  const exceedsBalance = amountNum > (availableBalance ?? 0);
  const pinComplete = pin.every((d) => d.length === 1);
  const cellAmountValid =
    amountNum >= 50 && amountNum <= 5000 && amountNum % 10 === 0;
  const canReview = isCell
    ? cellAmountValid && !exceedsBalance && pinComplete && acceptedTcs
    : amountNum > 0 && !exceedsBalance;
  const errorText = exceedsBalance
    ? "Exceeds available balance"
    : amountTouched && amountNum === 0
      ? "Please enter an amount"
      : isCell && amountTouched && !cellAmountValid
        ? "Amount must be between R 50.00 and R 5 000.00 in denominations of R 10.00"
        : null;

  function setPinDigit(i: number, v: string) {
    const digit = v.replace(/[^0-9]/g, "").slice(-1);
    setPin((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 3) pinRefs.current[i + 1]?.focus();
  }

  function generatePin() {
    let digits: number[] = [];
    while (true) {
      digits = Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
      const consecutive = digits.every(
        (d, i) => i === 0 || d === digits[i - 1] + 1,
      );
      const reverseConsecutive = digits.every(
        (d, i) => i === 0 || d === digits[i - 1] - 1,
      );
      const hasRepeats = digits.some((d, i) => i > 0 && d === digits[i - 1]);
      if (!consecutive && !reverseConsecutive && !hasRepeats) break;
    }
    setPin(digits.map(String));
    pinRefs.current[3]?.blur();
  }

  function handleReview() {
    if (!canReview) {
      setAmountTouched(true);
      return;
    }
    router.push({
      pathname: "/review-details",
      params: {
        payment: JSON.stringify({
          beneficiary: ben,
          amount: amountNum,
          immediate,
          myRef,
          theirRef,
          proof,
          proofContact,
          theirName,
          pin: isCell ? pin.join("") : undefined,
        }),
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
        <Text style={styles.headerTitle}>Payment Details</Text>
        <Pressable onPress={handleReview} disabled={!canReview} hitSlop={8}>
          <Text style={[styles.review, !canReview && { opacity: 0.5 }]}>
            REVIEW
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: Spacing.six }}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => proofOpen && setProofOpen(false)}
        >
          <View style={styles.fromBlock}>
            <Text style={styles.fromLabel}>From</Text>
            <AccountCard
              name="MYMOACC"
              accountNumber={accountNumber ?? "—"}
              availableBalance={availableBalance}
            />
            <View style={styles.eapRow}>
              <Text style={styles.eapLabel}>
                {isCell
                  ? "Remaining daily withdrawal limit"
                  : "Remaining EAP limit"}
              </Text>
              <Text style={styles.eapValue}>
                {isCell ? "R 10 000.00" : "R 49 980.00"}
              </Text>
            </View>
          </View>

          <View style={styles.notch} />

          <View style={styles.toBlock}>
            <Text style={styles.toLabel}>To</Text>
            <View style={styles.benCard}>
              <View style={styles.benAvatar}>
                <Text style={styles.benAvatarText}>{initial || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.benName}>{displayName || "—"}</Text>
                <Text style={styles.benAcc}>{displaySub || "—"}</Text>
                <Text style={styles.benBank}>{displayBank || "—"}</Text>
              </View>
            </View>

            <View style={styles.amountRow}>
              <View style={styles.amountCurrency}>
                <Text style={styles.amountCurrencyText}>R</Text>
              </View>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={(v) => {
                  setAmount(v);
                  setAmountTouched(true);
                }}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
            </View>
            {errorText && <Text style={styles.errorText}>{errorText}</Text>}

            {isCell ? (
              <>
                <Text style={styles.denomHint}>
                  R 50.00 to R 5 000.00 in denominations of R 10.00
                </Text>

                <View style={styles.pinCard}>
                  <View style={styles.pinHeader}>
                    <Text style={styles.pinTitle}>Cash Collection Pin</Text>
                    <View style={styles.infoDot}>
                      <Text style={styles.infoDotText}>i</Text>
                    </View>
                  </View>
                  <Text style={styles.pinSub}>
                    Select a PIN or generate it (Remember to send the PIN if
                    you&apos;re paying someone)
                  </Text>
                  <View style={styles.pinRow}>
                    {pin.map((d, i) => (
                      <TextInput
                        key={i}
                        ref={(r) => {
                          pinRefs.current[i] = r;
                        }}
                        style={styles.pinInput}
                        value={d}
                        onChangeText={(v) => setPinDigit(i, v)}
                        onKeyPress={({ nativeEvent }) => {
                          if (
                            nativeEvent.key === "Backspace" &&
                            !pin[i] &&
                            i > 0
                          ) {
                            pinRefs.current[i - 1]?.focus();
                          }
                        }}
                        keyboardType="number-pad"
                        maxLength={1}
                        selectTextOnFocus
                      />
                    ))}
                  </View>
                  <View style={styles.pinFooter}>
                    <Text style={styles.pinHint}>
                      Avoid using consecutive numbers (1 2 3 4) or repeating
                      numbers (1 2 2 4)
                    </Text>
                    <Pressable style={styles.generateBtn} onPress={generatePin}>
                      <Text style={styles.generateBtnText}>GENERATE PIN</Text>
                    </Pressable>
                  </View>
                  <View style={styles.tcsRow}>
                    <Text style={styles.tcsText}>
                      I accept the{" "}
                      <Text style={styles.tcsLink}>terms &amp; conditions</Text>
                    </Text>
                    <Switch
                      value={acceptedTcs}
                      onValueChange={setAcceptedTcs}
                      trackColor={{ false: Brand.divider, true: Brand.blue }}
                      thumbColor={Brand.white}
                    />
                  </View>
                </View>

                <Text style={styles.otherDetailsLabel}>Other details</Text>
                <Text style={styles.fieldLabel}>My reference</Text>
                <TextInput
                  style={styles.field}
                  value={myRef}
                  onChangeText={setMyRef}
                />
              </>
            ) : (
              <>
                {allowImmediatePayment && (
                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.toggleTitle}>Immediate payment</Text>
                      <Text style={styles.toggleSub}>
                        You&apos;ll be charged a fee based on the payment amount
                      </Text>
                    </View>
                    <View style={styles.infoDot}>
                      <Text style={styles.infoDotText}>i</Text>
                    </View>
                    <Switch
                      value={immediate}
                      onValueChange={setImmediate}
                      trackColor={{ false: Brand.divider, true: Brand.blue }}
                      thumbColor={Brand.white}
                      style={{ marginLeft: Spacing.two }}
                    />
                  </View>
                )}

                <Text style={styles.fieldLabel}>My reference</Text>
                <TextInput
                  style={styles.field}
                  value={myRef}
                  onChangeText={setMyRef}
                />

                <Text style={styles.fieldLabel}>Their reference</Text>
                <TextInput
                  style={styles.field}
                  value={theirRef}
                  onChangeText={setTheirRef}
                />

                <Text style={styles.fieldLabel}>Proof of payment</Text>
                <View>
                  <Pressable
                    style={styles.dropdownRow}
                    onPress={() => setProofOpen((v) => !v)}
                  >
                    <Text style={styles.dropdownValue}>{proof}</Text>
                    <SymbolView
                      name={
                        proofOpen
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
                  {proofOpen && (
                    <View style={styles.dropdownMenu}>
                      {PROOF_METHODS.map((m) => (
                        <Pressable
                          key={m}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setProof(m);
                            setProofOpen(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{m}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>

                {proof === "SMS" && (
                  <>
                    <Text style={styles.fieldLabel}>Cell phone number</Text>
                    <View style={styles.contactRow}>
                      <TextInput
                        style={[
                          styles.field,
                          { flex: 1, borderBottomWidth: 0 },
                        ]}
                        value={proofContact}
                        onChangeText={setProofContact}
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
                  </>
                )}
                {proof === "Email" && (
                  <>
                    <Text style={styles.fieldLabel}>Email address</Text>
                    <TextInput
                      style={styles.field}
                      value={proofContact}
                      onChangeText={setProofContact}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </>
                )}
                {proof === "Fax" && (
                  <>
                    <Text style={styles.fieldLabel}>Fax number</Text>
                    <TextInput
                      style={styles.field}
                      value={proofContact}
                      onChangeText={setProofContact}
                      keyboardType="phone-pad"
                    />
                  </>
                )}

                {proof !== "None" && (
                  <>
                    <Text style={styles.fieldLabel}>Their name</Text>
                    <TextInput
                      style={styles.field}
                      value={theirName}
                      onChangeText={setTheirName}
                    />
                  </>
                )}
              </>
            )}
          </View>
        </ScrollView>
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
  review: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  fromBlock: {
    backgroundColor: Brand.screen,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
  },
  fromLabel: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: Spacing.two,
  },
  eapRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.three,
  },
  eapLabel: { color: Brand.blue, fontSize: 14, fontWeight: "500" },
  eapValue: { color: Brand.blue, fontSize: 14, fontWeight: "500" },
  notch: {
    width: 24,
    height: 12,
    backgroundColor: Brand.screen,
    alignSelf: "center",
    transform: [{ rotate: "45deg" }],
    marginTop: -6,
  },
  toBlock: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  toLabel: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "500",
    marginBottom: Spacing.two,
  },
  benCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.divider,
    borderRadius: 4,
    padding: Spacing.three,
  },
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
  benAcc: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  benBank: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
  amountRow: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: Brand.blue,
    marginTop: -1,
  },
  amountCurrency: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.three,
  },
  amountCurrencyText: {
    color: Brand.white,
    fontSize: 22,
    fontWeight: "400",
  },
  amountInput: {
    flex: 1,
    color: Brand.white,
    fontSize: 22,
    paddingHorizontal: Spacing.three,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: "rgba(255,255,255,0.4)",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  toggleTitle: { color: Brand.textDark, fontSize: 15, fontWeight: "600" },
  toggleSub: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
  infoDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.two,
  },
  infoDotText: {
    color: Brand.white,
    fontSize: 13,
    fontWeight: "700",
    fontStyle: "italic",
  },
  fieldLabel: {
    color: Brand.textMuted,
    fontSize: 13,
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
  },
  field: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.textMuted,
    fontSize: 17,
    color: Brand.textDark,
    paddingVertical: Spacing.one,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.textMuted,
    paddingVertical: Spacing.two,
  },
  dropdownValue: { flex: 1, fontSize: 17, color: Brand.textDark },
  dropdownMenu: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 48,
    backgroundColor: Brand.white,
    borderRadius: 4,
    paddingVertical: Spacing.one,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  dropdownItemText: { color: Brand.textDark, fontSize: 16 },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.textMuted,
    paddingVertical: Spacing.one,
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 13,
    marginTop: Spacing.one,
  },
  denomHint: {
    color: Brand.textMuted,
    fontSize: 13,
    marginTop: Spacing.two,
  },
  pinCard: {
    backgroundColor: "#F1F3F6",
    borderRadius: 6,
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pinTitle: { color: Brand.textDark, fontSize: 17, fontWeight: "500" },
  pinSub: {
    color: Brand.textDark,
    fontSize: 13,
    marginTop: Spacing.two,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.four,
    marginTop: Spacing.three,
    marginBottom: Spacing.three,
  },
  pinInput: {
    width: 32,
    fontSize: 28,
    color: Brand.textDark,
    textAlign: "center",
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: Brand.textMuted,
    fontWeight: "700",
  },
  pinFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  pinHint: { flex: 1, color: Brand.textDark, fontSize: 13 },
  generateBtn: {
    borderWidth: 1,
    borderColor: Brand.blue,
    borderRadius: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  generateBtnText: {
    color: Brand.blue,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tcsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.three,
  },
  tcsText: { flex: 1, color: Brand.textDark, fontSize: 14 },
  tcsLink: { color: Brand.blue },
  otherDetailsLabel: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "500",
    marginTop: Spacing.four,
  },
});
