import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveBeneficiary, type CellBeneficiary } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";

export default function BeneficiaryCellScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [myRef, setMyRef] = useState("");
  const [save, setSave] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canNext =
    phone.replace(/\s/g, "").length >= 9 && name.trim().length > 0;

  async function handleNext() {
    if (!canNext || submitting) return;
    if (save && phoneNumber) {
      setSubmitting(true);
      try {
        const payload: Omit<CellBeneficiary, "id"> = {
          type: "cell",
          name: name.trim(),
          surname: surname.trim(),
          phone: `+27 ${phone.trim()}`,
          myRef,
        };
        await saveBeneficiary(phoneNumber, payload);
      } catch {
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }
    router.back();
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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <SymbolView
              name={{ ios: "person.fill", android: "person", web: "person" }}
              size={48}
              tintColor={Brand.white}
            />
          </View>
        </View>
        <Text style={styles.question}>Who would you like to pay?</Text>

        <Text style={styles.sectionLabel}>Account details</Text>
        <Text style={styles.fieldLabel}>Cell phone number</Text>
        <View style={styles.phoneRow}>
          <TextInput
            style={styles.phoneInput}
            value={phone ? `+27 ${phone}` : "+27 "}
            onChangeText={(v) =>
              setPhone(v.startsWith("+27 ") ? v.slice(4) : v)
            }
            keyboardType="phone-pad"
          />
          <SymbolView
            name={{
              ios: "plus.circle",
              android: "add_circle",
              web: "add_circle",
            }}
            size={28}
            tintColor={Brand.blue}
          />
        </View>
        <Text style={styles.hint}>
          Please make sure you use the correct cellphone number, as any
          recipient with an Instant Money wallet will have immediate access to
          the funds.
        </Text>

        <TextInput
          style={styles.field}
          placeholder="Beneficiary name"
          placeholderTextColor={Brand.textMuted}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.fieldHint}>Enter beneficiary name/s</Text>

        <TextInput
          style={[styles.field, styles.fieldGap]}
          placeholder="Beneficiary surname"
          placeholderTextColor={Brand.textMuted}
          value={surname}
          onChangeText={setSurname}
        />
        <Text style={styles.fieldHint}>Enter beneficiary surname/s</Text>

        <Text style={[styles.sectionLabel, styles.sectionGap]}>
          Other details
        </Text>
        <TextInput
          style={styles.field}
          placeholder="My reference"
          placeholderTextColor={Brand.textMuted}
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
      </ScrollView>
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
  fieldLabel: {
    color: Brand.textMuted,
    fontSize: 14,
    marginBottom: Spacing.one,
  },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: Brand.divider,
    paddingBottom: Spacing.one,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    color: Brand.navy,
    paddingVertical: Spacing.one,
  },
  hint: {
    color: Brand.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: Brand.divider,
    fontSize: 17,
    color: Brand.navy,
    paddingVertical: Spacing.one,
  },
  fieldGap: { marginTop: Spacing.three },
  fieldHint: {
    color: Brand.textMuted,
    fontSize: 13,
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
  },
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
