import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;

import { formatRand } from "@/api";
import { Brand, Spacing } from "@/constants/theme";

type Props = {
  name: string;
  accountNumber: string;
  availableBalance?: number | null;
  onPress?: () => void;
  showChevron?: boolean;
};

export function AccountCard({
  name,
  accountNumber,
  availableBalance,
  onPress,
  showChevron = true,
}: Props) {
  const content = (
    <>
      <View style={styles.icon}>
        <SymbolView
          name={{
            ios: "wallet.pass.fill",
            android: "account_balance_wallet",
            web: "account_balance_wallet",
          }}
          size={22}
          tintColor={Brand.white}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.accNum}>{accountNumber}</Text>
        <Text style={styles.avail}>
          Available balance{" "}
          <Text style={styles.availValue}>
            {availableBalance != null ? formatRand(availableBalance) : "—"}
          </Text>
        </Text>
      </View>
      {showChevron && (
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={20}
          tintColor={Brand.blue}
        />
      )}
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Brand.blueBright,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { color: Brand.textDark, fontSize: 15, fontWeight: "700" },
  accNum: { color: Brand.textDark, fontSize: 14, marginTop: 2 },
  avail: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
  availValue: { color: Brand.textDark, fontWeight: "700" },
});
