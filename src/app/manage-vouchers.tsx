import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useState } from "react";
import {
    Alert, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
    deleteVoucherDoc,
    fetchVouchers,
    formatRand,
    formatVoucherNumber,
    type Voucher,
} from "@/api";
import { ChangePinModal } from "@/components/change-pin-modal";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch, useAppSelector } from "@/store";
import { hideLoader, showLoader } from "@/store/ui-slice";

type Tab = "beneficiary" | "your";

function localPhone(p: string): string {
  return p.replace(/^\+27\s*/, "0").replace(/\s/g, "");
}

export default function ManageVouchersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const phoneNumber = useAppSelector((s) => s.accountInfo.phoneNumber);
  const [tab, setTab] = useState<Tab>("beneficiary");
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [editing, setEditing] = useState<Voucher | null>(null);

  const load = useCallback(async () => {
    if (!phoneNumber) return;
    dispatch(showLoader());
    try {
      const list = await fetchVouchers(phoneNumber);
      setVouchers(list);
    } finally {
      dispatch(hideLoader());
    }
  }, [phoneNumber, dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  function confirmDelete(v: Voucher) {
    if (!v.id || !phoneNumber) return;
    Alert.alert(
      "Delete voucher",
      `Are you sure you want to delete the voucher for ${localPhone(v.phone)}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteVoucherDoc(phoneNumber, v.id as string);
            load();
          },
        },
      ],
    );
  }

  function renderVoucher({ item }: { item: Voucher }) {
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardPhone}>{localPhone(item.phone)}</Text>
            <Text style={styles.cardAmount}>{formatRand(item.amount)}</Text>
            <Text style={styles.cardDate}>{item.date}</Text>
          </View>
          <SymbolView
            name={{
              ios: "square.and.arrow.up",
              android: "share",
              web: "share",
            }}
            size={22}
            tintColor={Brand.blue}
          />
        </View>
        <View style={styles.cardMid}>
          <Text style={styles.cardMidLabel}>Voucher number</Text>
          <Text style={styles.cardMidValue}>
            {formatVoucherNumber(item.voucherNumber)}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
            <Text style={styles.cardAction}>DELETE</Text>
          </Pressable>
          <Pressable onPress={() => setEditing(item)} hitSlop={8}>
            <Text style={styles.cardAction}>CHANGE PIN</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const data = tab === "beneficiary" ? vouchers : [];

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
        <Text style={styles.headerTitle}>Manage Vouchers</Text>
        <Pressable onPress={() => router.push("/beneficiary-cell")} hitSlop={8}>
          <SymbolView
            name={{ ios: "plus", android: "add", web: "add" }}
            size={24}
            tintColor={Brand.white}
          />
        </Pressable>
      </View>

      <View style={styles.tabBar}>
        {(["beneficiary", "your"] as Tab[]).map((t) => (
          <Pressable key={t} style={styles.tab} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "beneficiary" ? "BENEFICIARY VOUCHERS" : "YOUR VOUCHERS"}
            </Text>
            {tab === t ? <View style={styles.tabUnderline} /> : null}
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.payNewRow}
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
        <Text style={styles.payNewText}>Pay a new cell phone number</Text>
      </Pressable>

      <FlatList
        data={data}
        keyExtractor={(v) => v.id ?? v.voucherNumber}
        renderItem={renderVoucher}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {tab === "beneficiary"
              ? "No beneficiary vouchers yet."
              : "No vouchers issued to you yet."}
          </Text>
        }
      />

      <ChangePinModal
        visible={editing != null}
        currentPin={editing?.pin ?? ""}
        onCancel={() => setEditing(null)}
        onSave={async (newPin) => {
          if (editing?.id && phoneNumber) {
            const { updateVoucherPin } = await import("@/api");
            await updateVoucherPin(phoneNumber, editing.id, newPin);
            setEditing(null);
            load();
          }
        }}
      />
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
  tabBar: {
    flexDirection: "row",
    backgroundColor: Brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  tabText: {
    color: Brand.textMuted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tabTextActive: { color: Brand.blue },
  tabUnderline: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: Brand.blue,
  },
  payNewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  payNewText: { color: Brand.blue, fontSize: 16, fontWeight: "500" },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.six },
  empty: {
    textAlign: "center",
    color: Brand.textMuted,
    fontSize: 14,
    marginTop: Spacing.four,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.divider,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: Spacing.three,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing.three,
  },
  cardPhone: { color: Brand.textDark, fontSize: 16, fontWeight: "700" },
  cardAmount: {
    color: Brand.textDark,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  cardDate: { color: Brand.textMuted, fontSize: 13, marginTop: 2 },
  cardMid: {
    backgroundColor: "#F1F3F6",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  cardMidLabel: { color: Brand.textMuted, fontSize: 13 },
  cardMidValue: {
    color: Brand.textDark,
    fontSize: 17,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.four,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  cardAction: {
    color: Brand.blue,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
