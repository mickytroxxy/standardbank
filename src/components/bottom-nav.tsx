import { useRouter, type Href } from "expo-router";
import { SymbolView, type AndroidSymbol, type SFSymbol } from "expo-symbols";
import { useState } from "react";
import {
    Dimensions, Modal, Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { Text } from "@/components/typography";;
import { SafeAreaView } from "react-native-safe-area-context";

import { Brand, Spacing } from "@/constants/theme";
import Ionicons from "@react-native-vector-icons/ionicons";

const { width } = Dimensions.get("window");
const HALF = width / 2;

type NavKey = "home" | "accounts" | "transact" | "buy" | "more";

type Item = {
  key: NavKey;
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
  href?: Href;
};

const ITEMS: Item[] = [
  {
    key: "home",
    label: "Home",
    ios: "house.fill",
    android: "home",
    href: "/home",
  },
  {
    key: "accounts",
    label: "Accounts",
    ios: "creditcard.fill",
    android: "account_balance_wallet",
  },
  {
    key: "transact",
    label: "Transact",
    ios: "banknote.fill",
    android: "payments",
  },
  {
    key: "buy",
    label: "Buy",
    ios: "cart.fill",
    android: "shopping_cart",
    href: "/buy",
  },
  {
    key: "more",
    label: "More",
    ios: "line.3.horizontal",
    android: "menu",
    href: "/more",
  },
];

export function BottomNav({ active }: { active: NavKey }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: Href) => {
    setMenuOpen(false);
    router.replace(href);
  };

  return (
    <>
      <NavBar
        active={active}
        menuOpen={false}
        onTransact={() => setMenuOpen(true)}
        onNavigate={go}
      />

      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setMenuOpen(false)} />

        <View style={styles.menu} pointerEvents="box-none">
          <ActionButton
            label="Transfer"
            ios="arrow.left.arrow.right"
            android="swap_horiz"
            style={styles.transferPos}
            onPress={() => setMenuOpen(false)}
          />
          <ActionButton
            label="Pay"
            ios="hand.tap.fill"
            android="touch_app"
            style={styles.payPos}
            onPress={() => go("/pay")}
          />
          <ActionButton
            label="Send"
            ios="banknote.fill"
            android="send_to_mobile"
            style={styles.sendPos}
            onPress={() => go("/send")}
          />
        </View>

        <View style={styles.navOnTop}>
          <NavBar
            active={active}
            menuOpen
            onTransact={() => setMenuOpen(false)}
            onNavigate={go}
          />
        </View>
      </Modal>
    </>
  );
}

function NavBar({
  active,
  menuOpen,
  onTransact,
  onNavigate,
}: {
  active: NavKey;
  menuOpen: boolean;
  onTransact: () => void;
  onNavigate: (href: Href) => void;
}) {
  return (
    <View style={styles.wrapper}>
      <SafeAreaView edges={["bottom"]}>
        <View style={styles.row}>
          {ITEMS.map((item) => {
            const isActive = item.key === active;

            if (item.key === "transact") {
              return (
                <Pressable
                  key={item.key}
                  style={styles.item}
                  onPress={onTransact}
                >
                  <View style={[styles.fab, menuOpen && styles.fabOpen]}>
                    {/* <SymbolView
                      name={
                        menuOpen
                          ? { ios: "xmark", android: "close", web: "close" }
                          : {
                              ios: item.ios,
                              android: item.android,
                              web: item.android,
                            }
                      }
                      size={26}
                      tintColor={Brand.white}
                    /> */}
                    <Ionicons
                      name={menuOpen ? "close" : "cash-outline"}
                      size={26}
                      color={Brand.white}
                      style={{ position: "absolute" }}
                    />
                  </View>
                  <Text style={[styles.label, isActive && styles.labelActive]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            }

            return (
              <Pressable
                key={item.key}
                style={styles.item}
                onPress={() => item.href && onNavigate(item.href)}
              >
                <SymbolView
                  name={{
                    ios: item.ios,
                    android: item.android,
                    web: item.android,
                  }}
                  size={24}
                  tintColor={isActive ? Brand.blue : Brand.navy}
                />
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

function ActionButton({
  label,
  ios,
  android,
  onPress,
  style,
}: {
  label: string;
  ios: SFSymbol;
  android: AndroidSymbol;
  onPress: () => void;
  style: ViewStyle;
}) {
  return (
    <Pressable style={[styles.action, style]} onPress={onPress}>
      <View style={styles.actionCircle}>
        <SymbolView
          name={{ ios, android, web: android }}
          size={26}
          tintColor={Brand.blue}
        />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Brand.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.cardBorder,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.one,
  },
  item: { flex: 1, alignItems: "center", gap: Spacing.one },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 100,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
  },
  fabOpen: { backgroundColor: Brand.blueDeep },
  label: { fontSize: 12, fontWeight: "600", color: Brand.navy },
  labelActive: { color: Brand.blue },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(8, 18, 40, 0.6)",
  },
  menu: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  navOnTop: { position: "absolute", left: 0, right: 0, bottom: 0 },
  action: { position: "absolute", alignItems: "center", width: 80 },
  actionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Brand.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  actionLabel: {
    color: Brand.white,
    fontSize: 14,
    fontWeight: "700",
    marginTop: Spacing.one,
  },
  transferPos: { bottom: 200, left: HALF - 40 },
  payPos: { bottom: 120, left: HALF - 40 - 92 },
  sendPos: { bottom: 120, left: HALF - 40 + 92 },
});
