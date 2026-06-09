import { useLocalSearchParams, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
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
  holderName: string;
  bank: string;
  branchName: string;
  branchCode: string;
  accountNumber: string;
  theirRef: string;
  myRef: string;
  proof: ProofMethod;
  save: boolean;
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

  const [amount, setAmount] = useState("0.00");
  const [amountTouched, setAmountTouched] = useState(false);
  const [immediate, setImmediate] = useState(false);
  const [myRef, setMyRef] = useState(ben.myRef ?? "");
  const [theirRef, setTheirRef] = useState(ben.theirRef ?? "");
  const [proof, setProof] = useState<ProofMethod>(ben.proof ?? "SMS");
  const [proofOpen, setProofOpen] = useState(false);
  const [proofContact, setProofContact] = useState("");
  const [theirName, setTheirName] = useState(ben.holderName ?? "");

  const initial = (ben.holderName ?? "").trim().charAt(0).toUpperCase();
  const amountNum = parseFloat(amount.replace(/[^0-9.]/g, "")) || 0;
  const exceedsBalance = amountNum > (availableBalance ?? 0);
  const canReview = amountNum > 0 && !exceedsBalance;
  const errorText = exceedsBalance
    ? "Exceeds available balance"
    : amountTouched && amountNum === 0
      ? "Please enter an amount"
      : null;

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
              <Text style={styles.eapLabel}>Remaining EAP limit</Text>
              <Text style={styles.eapValue}>R 49 980.00</Text>
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
                <Text style={styles.benName}>{ben.holderName ?? "—"}</Text>
                <Text style={styles.benAcc}>{ben.accountNumber ?? "—"}</Text>
                <Text style={styles.benBank}>{ben.bank ?? "—"}</Text>
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
                    style={[styles.field, { flex: 1, borderBottomWidth: 0 }]}
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
});
