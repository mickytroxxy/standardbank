import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, SectionList, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomNav } from "@/components/bottom-nav";
import { Brand, Spacing } from "@/constants/theme";
import MaterialDesignIcons from "@react-native-vector-icons/material-design-icons";

type Contact = { name: string; initials: string; ref?: string };
type ContactSection = { title: string; data: Contact[] };

const CONTACTS: ContactSection[] = [
  {
    title: "B",
    data: [
      { name: "Baba", initials: "B", ref: "" },
      { name: "Baba Benj", initials: "BB", ref: "" },
      { name: "Baba Portia", initials: "BP", ref: "" },
      { name: "Baba Rumbi", initials: "BR", ref: "" },
      { name: "Baba portia 2", initials: "B2", ref: "" },
      { name: "Baba portia ext", initials: "BE", ref: "" },
      { name: "Bb", initials: "B", ref: "" },
      { name: "Bee Strip", initials: "BS", ref: "" },
    ],
  },
  {
    title: "C",
    data: [
      { name: "Calvin Mokoena", initials: "CM", ref: "" },
      { name: "Cindy Dlamini", initials: "CD", ref: "" },
    ],
  },
  {
    title: "D",
    data: [
      { name: "David Nkosi", initials: "DN", ref: "" },
      { name: "Dineo Molefe", initials: "DM", ref: "" },
    ],
  },
];

function ContactAvatar({ initials }: { initials: string }) {
  return (
    <View style={styles.avatarWrap}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.avatarBadge}>
        <MaterialDesignIcons name="cellphone" size={10} color={Brand.white} />
      </View>
    </View>
  );
}

export default function SendScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
        <Text style={styles.headerTitle}>Send Instant Money</Text>
        <View style={styles.headerIcons}>
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            size={24}
            tintColor={Brand.white}
          />
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search", web: "search" }}
            size={24}
            tintColor={Brand.white}
          />
        </View>
      </View>

      <SectionList
        sections={CONTACTS}
        keyExtractor={(item) => item.name}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <Pressable
            style={styles.newPayRow}
            onPress={() => router.push("/beneficiary-cell")}
          >
            <SymbolView
              name={{
                ios: "plus.circle",
                android: "add_circle",
                web: "add_circle",
              }}
              size={24}
              tintColor={Brand.blue}
            />
            <Text style={styles.newPayText}>Pay a new cell phone number</Text>
          </Pressable>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLetter}>{section.title}</Text>
            <View style={styles.sectionLine} />
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable style={styles.contactRow}>
            <ContactAvatar initials={item.initials} />
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactRef}>Ref: {item.ref}</Text>
            </View>
            <SymbolView
              name={{
                ios: "chevron.right",
                android: "chevron_right",
                web: "chevron_right",
              }}
              size={18}
              tintColor={Brand.textMuted}
            />
          </Pressable>
        )}
      />

      <BottomNav active="transact" />
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
  headerIcons: { flexDirection: "row", gap: Spacing.three },
  newPayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  newPayText: { color: Brand.blue, fontSize: 16, fontWeight: "500" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    backgroundColor: Brand.white,
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
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  avatarWrap: { width: 48, height: 48 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Brand.white,
  },
  avatarText: { color: Brand.blue, fontSize: 14, fontWeight: "700" },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Brand.white,
  },
  contactInfo: { flex: 1 },
  contactName: { color: Brand.navy, fontSize: 16, fontWeight: "600" },
  contactRef: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
});
