import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveBeneficiary, type BankBeneficiary } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { clearSelectedBank, hideLoader, showLoader } from "@/store/ui-slice";

export type ProofMethod = "None" | "SMS" | "Email" | "Fax";
const PROOF_METHODS: ProofMethod[] = ["None", "SMS", "Email", "Fax"];

const BANK_DEFAULTS: Record<
  string,
  { branchName: string; branchCode: string }
> = {
  "GOTYME BANK": { branchName: "GOTYME BANK ROSEBANK", branchCode: "67891000" },
  "STANDARD BANK": {
    branchName: "STANDARD BANK SOUTH AFRICA",
    branchCode: "051001",
  },
  "ABSA BANK": { branchName: "ABSA BANK SOUTH AFRICA", branchCode: "632005" },
  "CAPITEC BANK LIMITED": { branchName: "CAPITEC BANK", branchCode: "470010" },
  "FIRST NATIONAL BANK": { branchName: "FNB UNIVERSAL", branchCode: "250655" },
  "NEDBANK LIMITED": {
    branchName: "NEDBANK SOUTH AFRICA",
    branchCode: "198765",
  },
  TYMEBANK: { branchName: "TYMEBANK", branchCode: "678910" },
};

function bankDefaults(bank: string) {
  return BANK_DEFAULTS[bank] ?? { branchName: "", branchCode: "" };
}

export default function BeneficiaryAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const selectedBank = useAppSelector((s) => s.ui.selectedBank);
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);

  const [holderName, setHolderName] = useState("");
  const [bank, setBank] = useState("GOTYME BANK");
  const [accountNum, setAccountNum] = useState("");
  const [theirRef, setTheirRef] = useState("");
  const [myRef, setMyRef] = useState("");
  const [proof, setProof] = useState<ProofMethod>("None");
  const [proofOpen, setProofOpen] = useState(false);
  const [save, setSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedBank && selectedBank !== bank) setBank(selectedBank);
    if (selectedBank) dispatch(clearSelectedBank());
  }, [selectedBank, bank, dispatch]);

  const defaults = bankDefaults(bank);
  const initial = holderName.trim().charAt(0).toUpperCase();
  const canNext =
    holderName.trim().length > 0 && accountNum.replace(/\s/g, "").length >= 7;

  async function handleNext() {
    if (!canNext || submitting) return;
    const ben = {
      holderName: holderName.trim(),
      bank,
      branchName: defaults.branchName,
      branchCode: defaults.branchCode,
      accountNumber: accountNum.trim(),
      theirRef,
      myRef,
      proof,
      save,
    };
    if (save && phoneNumber) {
      setSubmitting(true);
      dispatch(showLoader());
      try {
        const payload: Omit<BankBeneficiary, "id"> = {
          type: "bank",
          holderName: ben.holderName,
          bank: ben.bank,
          branchName: ben.branchName,
          branchCode: ben.branchCode,
          accountNumber: ben.accountNumber,
          theirRef: ben.theirRef,
          myRef: ben.myRef,
          proof: ben.proof,
        };
        await saveBeneficiary(phoneNumber, payload);
      } catch {
        dispatch(hideLoader());
        setSubmitting(false);
        return;
      }
      dispatch(hideLoader());
      setSubmitting(false);
    }
    router.push({
      pathname: "/payment-details",
      params: { beneficiary: JSON.stringify(ben) },
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
        <Text style={styles.headerTitle}>Beneficiary Details</Text>
        <Pressable onPress={handleNext} disabled={!canNext} hitSlop={8}>
          <Text style={[styles.next, !canNext && { opacity: 0.5 }]}>NEXT</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={() => proofOpen && setProofOpen(false)}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {initial ? (
                <Text style={styles.avatarText}>{initial}</Text>
              ) : (
                <SymbolView
                  name={{
                    ios: "person.fill",
                    android: "person",
                    web: "person",
                  }}
                  size={40}
                  tintColor={Brand.white}
                />
              )}
            </View>
            {holderName.trim() ? (
              <Text style={styles.avatarName}>{holderName.trim()}</Text>
            ) : null}
          </View>

          <Text style={styles.sectionLabel}>Account details</Text>

          <Text style={styles.fieldLabel}>Account holder name</Text>
          <TextInput
            style={styles.field}
            value={holderName}
            onChangeText={setHolderName}
            placeholderTextColor={Brand.textMuted}
          />
          <Text style={styles.fieldHint}>Enter account holder name/s</Text>

          <Text style={styles.fieldLabel}>Bank</Text>
          <Pressable
            style={styles.pickerRow}
            onPress={() => router.push("/choose-bank")}
          >
            <Text style={styles.pickerValue}>{bank}</Text>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={20}
              tintColor={Brand.blue}
            />
          </Pressable>

          <Text style={styles.fieldLabel}>Branch name</Text>
          <Pressable style={styles.pickerRow}>
            <Text style={[styles.pickerValue, styles.placeholderText]}>
              {defaults.branchName}
            </Text>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={20}
              tintColor={Brand.blue}
            />
          </Pressable>

          <Text style={styles.fieldLabel}>Branch code</Text>
          <View style={styles.pickerRow}>
            <Text style={[styles.pickerValue, styles.placeholderText]}>
              {defaults.branchCode}
            </Text>
          </View>

          <Text style={styles.fieldLabel}>Account number</Text>
          <TextInput
            style={styles.field}
            value={accountNum}
            onChangeText={setAccountNum}
            keyboardType="number-pad"
          />

          <Text style={styles.verifyText}>VERIFY ACCOUNT</Text>

          <View style={styles.tncBox}>
            <Text style={styles.tncText}>
              By verifying the account details, you agree to the{" "}
              <Text style={styles.tncLink}>T&Cs</Text>
            </Text>
          </View>

          <Text style={[styles.sectionLabel, styles.sectionGap]}>
            Other details
          </Text>

          <Text style={styles.fieldLabel}>Their reference</Text>
          <TextInput
            style={styles.field}
            value={theirRef}
            onChangeText={setTheirRef}
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.three }]}>
            My reference
          </Text>
          <TextInput
            style={styles.field}
            value={myRef}
            onChangeText={setMyRef}
          />

          <Text style={[styles.fieldLabel, { marginTop: Spacing.three }]}>
            Proof of payment
          </Text>
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

          <View style={styles.saveRow}>
            <Text style={styles.saveLabel}>Save this beneficiary</Text>
            <Switch
              value={save}
              onValueChange={setSave}
              trackColor={{ false: Brand.divider, true: Brand.blue }}
              thumbColor={Brand.white}
            />
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
  next: {
    color: Brand.white,
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: Spacing.six },
  avatarWrap: {
    alignItems: "center",
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: Brand.white, fontSize: 32, fontWeight: "600" },
  avatarName: {
    marginTop: Spacing.two,
    color: Brand.textDark,
    fontSize: 18,
    fontWeight: "400",
  },
  sectionLabel: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  sectionGap: { marginTop: Spacing.four },
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
  fieldHint: {
    color: Brand.textMuted,
    fontSize: 13,
    marginTop: Spacing.one,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.textMuted,
    paddingVertical: Spacing.two,
  },
  pickerValue: { flex: 1, fontSize: 17, color: Brand.textDark },
  placeholderText: { color: Brand.textMuted },
  verifyText: {
    color: Brand.textMuted,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "right",
    marginTop: Spacing.four,
  },
  tncBox: {
    backgroundColor: "#E8EAED",
    borderRadius: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.three,
  },
  tncText: { color: Brand.textDark, fontSize: 13 },
  tncLink: { color: Brand.blue },
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
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  saveLabel: { color: Brand.textDark, fontSize: 15 },
});
