import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import {
    setAllowImmediatePayment,
    setAllowStandardBankTransfers,
} from "@/store/ui-slice";
import { useRouter } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { allowImmediatePayment, allowStandardBankTransfers } = useAppSelector(
    (s) => s.ui,
  );
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);

  const isAdmin = (phoneNumber ?? "").replace(/\s/g, "") === "0658016132";

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Allow immediate payment</Text>
          <Text style={styles.rowSub}>
            Enable or disable immediate payments
          </Text>
        </View>
        <Switch
          value={allowImmediatePayment}
          onValueChange={(v) => dispatch(setAllowImmediatePayment(v))}
          trackColor={{ false: Brand.divider, true: Brand.blue }}
          thumbColor={Brand.white}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Allow Standard Bank transfers</Text>
          <Text style={styles.rowSub}>
            Allow sending payments to Standard Bank accounts
          </Text>
        </View>
        <Switch
          value={allowStandardBankTransfers}
          onValueChange={(v) => dispatch(setAllowStandardBankTransfers(v))}
          trackColor={{ false: Brand.divider, true: Brand.blue }}
          thumbColor={Brand.white}
        />
      </View>
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
    marginBottom: Spacing.four,
  },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.cardBorder,
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitle: { color: Brand.textDark, fontSize: 16, fontWeight: "600" },
  rowSub: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
});
