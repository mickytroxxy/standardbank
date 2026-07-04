import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MenuItem = {
  icon: string;
  label: string;
  sub: string;
  route: string;
  adminOnly?: boolean;
  accent?: string;
};

const MENU_ITEMS: MenuItem[] = [
  {
    icon: "cog-outline",
    label: "Settings",
    sub: "App preferences & account settings",
    route: "/settings",
    accent: Brand.blue,
  },
  {
    icon: "account-group-outline",
    label: "User Management",
    sub: "Admin tools — view & manage all users",
    route: "/settings/users",
    adminOnly: true,
    accent: Brand.purple,
  },
];

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phoneNumber, firstName, lastName } = useAppSelector(
    (s) => s.accountInfo,
  );
  const isAdmin = (phoneNumber ?? "").replace(/\s/g, "") === "0658016132";
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || "User";
  const initials =
    `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "U";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.replace("/home")}
          hitSlop={8}
        >
          <SymbolView
            name={{
              ios: "arrow.left",
              android: "arrow_back",
              web: "arrow_back",
            }}
            size={22}
            tintColor={Brand.white}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Menu</Text>
        {/* Spacer to balance back button */}
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.six },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Banner */}
        <View style={styles.profileBanner}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profilePhone}>{phoneNumber ?? "—"}</Text>
            {isAdmin && (
              <View style={styles.adminBadge}>
                <MaterialDesignIcons
                  name={"shield-account" as any}
                  size={12}
                  color={Brand.white}
                />
                <Text style={styles.adminBadgeText}>Administrator</Text>
              </View>
            )}
          </View>
        </View>

        {/* Section Label */}
        <Text style={styles.sectionLabel}>QUICK ACCESS</Text>

        {/* Menu Items */}
        {MENU_ITEMS.filter((m) => !m.adminOnly || isAdmin).map((item) => (
          <Pressable
            key={item.route}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push(item.route as any)}
          >
            <View
              style={[styles.iconBox, { backgroundColor: `${item.accent}18` }]}
            >
              <MaterialDesignIcons
                name={item.icon as any}
                size={26}
                color={item.accent ?? Brand.blue}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.cardLabel}>{item.label}</Text>
              <Text style={styles.cardSub}>{item.sub}</Text>
            </View>
            <MaterialDesignIcons
              name={"chevron-right" as any}
              size={22}
              color={Brand.textMuted}
            />
          </Pressable>
        ))}

        {/* Divider */}
        <View style={styles.divider} />

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Standard Bank Mobile Banking</Text>
          <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.screen,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    backgroundColor: Brand.blue,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: Brand.white,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  /* ── Scroll content ── */
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.two,
  },

  /* ── Profile Banner ── */
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    shadowColor: Brand.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Brand.white,
    fontSize: 20,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  profileName: {
    color: Brand.textDark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  profilePhone: {
    color: Brand.textMuted,
    fontSize: 13,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.purple,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 6,
    alignSelf: "flex-start",
    gap: 4,
  },
  adminBadgeText: {
    color: Brand.white,
    fontSize: 11,
    fontWeight: "700",
  },

  /* ── Section label ── */
  sectionLabel: {
    color: Brand.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: Spacing.one,
    marginTop: Spacing.two,
    paddingHorizontal: 4,
  },

  /* ── Menu cards ── */
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Brand.card,
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    shadowColor: Brand.navy,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
    gap: Spacing.three,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.985 }],
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    color: Brand.textDark,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  cardSub: {
    color: Brand.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },

  /* ── Footer ── */
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Brand.divider,
    marginVertical: Spacing.four,
  },
  appInfo: {
    alignItems: "center",
    gap: 4,
  },
  appInfoText: {
    color: Brand.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  appInfoVersion: {
    color: Brand.textMuted,
    fontSize: 11,
  },
});
