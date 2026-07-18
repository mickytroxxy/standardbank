import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Pressable, SectionList, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { setSelectedBank } from "@/store/ui-slice";

type BankSection = { title: string; data: string[] };

const TOP_BANKS = [
  "STANDARD BANK",
  "ABSA BANK",
  "CAPITEC BANK LIMITED",
  "FIRST NATIONAL BANK",
  "NEDBANK LIMITED",
];

const SECTIONS: BankSection[] = [
  { title: "", data: TOP_BANKS },
  {
    title: "A",
    data: [
      "ABSA BANK",
      "ACCESS BANK",
      "AFRICAN BANK",
      "AFRICAN BANK BUSINESS",
      "AFRICAN BANK INCORP. UBANK",
      "ALBARAKA BANK",
    ],
  },
  {
    title: "B",
    data: ["BANK OF CHINA", "BANK ZERO", "BIDVEST BANK", "BNP PARIBAS"],
  },
  {
    title: "C",
    data: ["CAPITEC BANK LIMITED", "CITIBANK", "COMMONWEALTH BANK"],
  },
  {
    title: "D",
    data: ["DEUTSCHE BANK", "DISCOVERY BANK"],
  },
  {
    title: "F",
    data: ["FINBOND MUTUAL BANK", "FIRST NATIONAL BANK", "FIRST RAND BANK"],
  },
  {
    title: "G",
    data: ["GRINDROD BANK"],
  },
  {
    title: "H",
    data: ["HABIB OVERSEAS BANK", "HBZ BANK"],
  },
  {
    title: "I",
    data: ["INVESTEC BANK"],
  },
  {
    title: "J",
    data: ["JP MORGAN CHASE BANK"],
  },
  {
    title: "M",
    data: ["MERCANTILE BANK", "MPESA", "MTN MOBILE MONEY"],
  },
  {
    title: "N",
    data: ["NEDBANK LIMITED", "NEDBANK PRIVATE WEALTH"],
  },
  {
    title: "O",
    data: ["OLD MUTUAL BANK"],
  },
  {
    title: "P",
    data: ["PEOPLES BANK", "POSTBANK"],
  },
  {
    title: "R",
    data: ["RAND MERCHANT BANK"],
  },
  {
    title: "S",
    data: ["SASFIN BANK", "STANDARD BANK", "STATE BANK OF INDIA"],
  },
  {
    title: "T",
    data: ["TYME BANK"],
  },
  {
    title: "U",
    data: ["UBANK", "UNIBANK"],
  },
];

function RadioIcon({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
      {selected && <View style={styles.radioInner} />}
    </View>
  );
}

export default function ChooseBankScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const currentBank = useAppSelector((s) => s.ui.selectedBank);
  const [selected, setSelected] = useState(currentBank ?? "STANDARD BANK");

  const handleSelect = (bank: string) => {
    setSelected(bank);
    dispatch(setSelectedBank(bank));
    setTimeout(() => router.back(), 250);
  };

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
        <Text style={styles.headerTitle}>Choose a Bank</Text>
        <SymbolView
          name={{ ios: "magnifyingglass", android: "search", web: "search" }}
          size={24}
          tintColor={Brand.white}
        />
      </View>

      <SectionList
        sections={SECTIONS}
        keyExtractor={(item, idx) => `${item}-${idx}`}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) =>
          section.title ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLetter}>{section.title}</Text>
              <View style={styles.sectionLine} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => handleSelect(item)}>
            <Text style={styles.bankName}>{item}</Text>
            <RadioIcon selected={selected === item} />
          </Pressable>
        )}
      />
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
  headerTitle: { flex: 1, color: Brand.white, fontSize: 22, fontWeight: "600" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  sectionLetter: {
    color: Brand.blue,
    fontSize: 16,
    fontWeight: "700",
    marginRight: Spacing.two,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.divider,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  bankName: {
    flex: 1,
    color: Brand.navy,
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Brand.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOuterSelected: { borderColor: Brand.blue },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Brand.blue,
  },
});
