import { Text } from "@/components/typography";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveBeneficiary, type CellBeneficiary } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { hideLoader, showLoader } from "@/store/ui-slice";

import { FloatingLabelInput } from "@/components/floating-input";
export default function BeneficiaryCellScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [myRef, setMyRef] = useState("");
  const [save, setSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const trimmedName = name.trim();
  const trimmedSurname = surname.trim();
  const fullName = [trimmedName, trimmedSurname].filter(Boolean).join(" ");
  const initials =
    `${trimmedName.charAt(0)}${trimmedSurname.charAt(0)}`.toUpperCase();

  const canNext =
    phone.replace(/\s/g, "").length >= 9 && trimmedName.length > 0;

  async function handleNext() {
    if (!canNext || submitting) return;
    const payload: Omit<CellBeneficiary, "id"> = {
      type: "cell",
      name: trimmedName,
      surname: trimmedSurname,
      phone: `+27 ${phone.trim()}`,
      myRef,
    };
    if (save && phoneNumber) {
      setSubmitting(true);
      dispatch(showLoader());
      try {
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
      params: { beneficiary: JSON.stringify({ ...payload, save }) },
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable onPress={() => router.back()} style={styles.back}>
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
        <Pressable
          onPress={handleNext}
          disabled={!canNext || submitting}
          hitSlop={8}
        >
          <Text
            style={[styles.next, (!canNext || submitting) && { opacity: 0.5 }]}
          >
            NEXT
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        bottomOffset={62}
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            {initials ? (
              <Text style={styles.avatarInitials}>{initials}</Text>
            ) : (
              <SymbolView
                name={{ ios: "person.fill", android: "person", web: "person" }}
                size={48}
                tintColor={Brand.white}
              />
            )}
          </View>
        </View>
        <Text style={styles.question}>
          {fullName || "Who would you like to pay?"}
        </Text>

        <Text style={styles.sectionLabel}>Account details</Text>
        <FloatingLabelInput
          label="Cell phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          prefix="+27"
          hint="Please make sure you use the correct cellphone number, as any recipient with an Instant Money wallet will have immediate access to the funds."
          rightAccessory={
            <SymbolView
              name={{
                ios: "plus.circle",
                android: "add_circle",
                web: "add_circle",
              }}
              size={28}
              tintColor={Brand.blue}
            />
          }
        />

        <FloatingLabelInput
          label="Beneficiary name"
          value={name}
          onChangeText={setName}
          hint="Enter beneficiary name/s"
        />

        <FloatingLabelInput
          label="Beneficiary surname"
          value={surname}
          onChangeText={setSurname}
          hint="Enter beneficiary surname/s"
        />

        <Text style={[styles.sectionLabel, styles.sectionGap]}>
          Other details
        </Text>
        <FloatingLabelInput
          label="My reference"
          value={myRef}
          onChangeText={setMyRef}
        />

        <View style={styles.saveRow}>
          <Text style={styles.saveLabel}>Save this beneficiary</Text>
          <Switch
            value={save}
            onValueChange={setSave}
            trackColor={{ false: Brand.divider, true: Brand.blue }}
            thumbColor={Brand.white}
          />
        </View>
      </KeyboardAwareScrollView>
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
  next: { color: Brand.white, fontSize: 16, fontWeight: "700" },
  scroll: { flex: 1 },
  content: { padding: Spacing.three, paddingBottom: 60 },
  avatarWrap: { alignItems: "center", marginVertical: Spacing.four },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { color: Brand.white, fontSize: 32, fontWeight: "600" },
  question: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "400",
    color: Brand.navy,
    marginBottom: Spacing.four,
  },
  sectionLabel: {
    color: Brand.blue,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: Spacing.two,
  },
  sectionGap: { marginTop: Spacing.four },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.four,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  saveLabel: { color: Brand.navy, fontSize: 16 },
});
