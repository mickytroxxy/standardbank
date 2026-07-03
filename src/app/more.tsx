import { Brand, Spacing } from "@/constants/theme";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppSelector } from "@/store";

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);
  const isAdmin = (phoneNumber ?? "").replace(/\s/g, "") === "0658016132";

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}> 
      <Text style={styles.title}>More</Text>
      <ScrollView contentContainerStyle={{ padding: Spacing.three }}>
        <Pressable style={styles.item} onPress={() => router.push("/settings")}>
          <Text style={styles.itemText}>Settings</Text>
        </Pressable>
        {isAdmin && (
          <Pressable style={styles.item} onPress={() => router.push("/settings/users")}>
            <Text style={styles.itemText}>Users</Text>
            <Text style={styles.itemSub}>Admin user management</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.screen },
  title: {
    color: Brand.textDark,
    fontSize: 22,
    fontWeight: "700",
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.two,
  },
  item: {
    paddingVertical: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.cardBorder,
    paddingHorizontal: Spacing.three,
    backgroundColor: Brand.white,
    borderRadius: 12,
    marginBottom: Spacing.two,
  },
  itemText: { fontSize: 16, color: Brand.textDark, fontWeight: "700" },
  itemSub: { fontSize: 13, color: Brand.textMuted, marginTop: 4 },
});
