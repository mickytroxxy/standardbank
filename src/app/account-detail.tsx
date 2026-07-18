import Ionicons from "@react-native-vector-icons/ionicons";
import { useFocusEffect, useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/typography";;
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fetchTransactions, formatRand, type Transaction } from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppSelector } from "@/store";

type Tab = "overview" | "transactions" | "documents" | "cards" | "details";
const TABS: { key: Tab; label: string; badge?: true }[] = [
  { key: "overview", label: "OVERVIEW" },
  { key: "transactions", label: "TRANSACTIONS" },
  { key: "documents", label: "DOCUMENTS", badge: true },
  { key: "cards", label: "CARDS" },
  { key: "details", label: "DETAILS" },
];
const TXS: Transaction[] = [
  {
    date: "6 Jun",
    title: "AP *JALAPENO 5196*6375 04 JUN",
    sub: "DEBIT CARD PURCHASE FROM",
    amount: "-27.00",
    fullDate: "6 June 2026",
    time: "10:24",
    runningBalance: "R 747 749.23",
    beneficiaryName: "Jalapeno",
    account: "Card ending 6375",
    myRef: "JALAPENO 04 JUN",
  },
  {
    date: "6 Jun",
    title: "AP *JALAPENO 5196*6375 04 JUN",
    sub: "DEBIT CARD PURCHASE FROM",
    amount: "-27.00",
    fullDate: "6 June 2026",
    time: "09:11",
    runningBalance: "R 747 776.23",
    beneficiaryName: "Jalapeno",
    account: "Card ending 6375",
    myRef: "JALAPENO 04 JUN",
  },
  {
    date: "5 Jun",
    title: "SEAN",
    sub: "MAGTAPE CREDIT",
    amount: "138.00",
    credit: true,
    fullDate: "5 June 2026",
    time: "17:02",
    runningBalance: "R 747 803.23",
  },
  {
    date: "5 Jun",
    title: "S2S*GREENT PRETORIA ZAF\n05-06-2026 14H36:25",
    sub: "OUTSTANDING CARD AUTHORISATION",
    amount: "-30.00",
    fullDate: "5 June 2026",
    time: "14:36",
    runningBalance: "R 747 665.23",
    beneficiaryName: "Greent Pretoria",
    account: "Card ending 6375",
    myRef: "GREENT 05 JUN",
  },
  {
    date: "5 Jun",
    title: "BENGU FAST SOSHANGUVE ZAF\n05-06-2026 14H34:10",
    sub: "OUTSTANDING CARD AUTHORISATION",
    amount: "-93.00",
    fullDate: "5 June 2026",
    time: "14:34",
    runningBalance: "R 747 695.23",
    beneficiaryName: "Bengu Fast Soshanguve",
    account: "Card ending 6375",
    myRef: "BENGU FAST 05 JUN",
  },
  {
    date: "5 Jun",
    title: "SASOL VIKING 5196*6375 03 JUN",
    sub: "DEBIT CARD PURCHASE FROM",
    amount: "-320.00",
    fullDate: "5 June 2026",
    time: "13:02",
    runningBalance: "R 747 788.23",
    beneficiaryName: "Sasol Viking",
    account: "Card ending 6375",
    myRef: "SASOL VIKING 03 JUN",
  },
  {
    date: "5 Jun",
    title: "AP *JALAPENO 5196*6375 03 JUN",
    sub: "DEBIT CARD PURCHASE FROM",
    amount: "-73.00",
    fullDate: "5 June 2026",
    time: "12:14",
    runningBalance: "R 748 108.23",
    beneficiaryName: "Jalapeno",
    account: "Card ending 6375",
    myRef: "JALAPENO 03 JUN",
  },
];
type Doc = { title: string; sub: string; detail: string };
const DOCS = {
  stamped: [
    {
      title: "3-Month statement",
      sub: "8 Mar 2026 - 6 Jun 2026",
      detail: "Official bank stamped PDF",
    },
    {
      title: "6-Month statement",
      sub: "8 Dec 2025 - 6 Jun 2026",
      detail: "Official bank stamped PDF",
    },
  ] as Doc[],
  letters: [
    {
      title: "Bank account confirmation letter",
      sub: "",
      detail: "Official bank account confirmation letter PDF",
    },
  ] as Doc[],
  prev: [
    {
      title: "16 May 2026",
      sub: "Statement No. 5(0)",
      detail: "Official bank statement PDF",
    },
    {
      title: "16 April 2026",
      sub: "Statement No. 4(0)",
      detail: "Official bank statement PDF",
    },
    {
      title: "16 March 2026",
      sub: "Statement No. 3(0)",
      detail: "Official bank statement PDF",
    },
  ] as Doc[],
};

function TxRow({
  item,
  i,
  onPress,
}: {
  item: Transaction;
  i: number;
  onPress: (item: Transaction) => void;
}) {
  return (
    <Pressable
      style={[styles.txRow, i % 2 === 1 && styles.txRowAlt]}
      onPress={() => onPress(item)}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.txDate}>{item.date}</Text>
        <Text style={styles.txTitle}>{item.title}</Text>
        <Text style={styles.txSub}>{item.sub}</Text>
      </View>
      <Text style={[styles.txAmt, item.credit ? styles.credit : styles.debit]}>
        {item.amount}
      </Text>
    </Pressable>
  );
}
function DocRow({ d }: { d: Doc }) {
  return (
    <View style={styles.docRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle}>{d.title}</Text>
        {d.sub ? <Text style={styles.docSub}>{d.sub}</Text> : null}
        <Text style={styles.docDetail}>{d.detail}</Text>
      </View>
      <SymbolView
        name={{ ios: "ellipsis", android: "more_vert", web: "more_vert" }}
        size={20}
        tintColor={Brand.navy}
      />
    </View>
  );
}
function Card({
  title,
  open,
  onToggle,
  accent,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  accent?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Pressable
        style={[styles.cardHead, accent && styles.cardHeadAccent]}
        onPress={onToggle}
      >
        <Text style={[styles.cardTitle, accent && styles.cardTitleAccent]}>
          {title}
        </Text>
        <Ionicons
          name={open ? "caret-up" : "caret-down"}
          size={20}
          color={accent ? Brand.white : Brand.blue}
        />
      </Pressable>
      {open && children}
    </View>
  );
}

export default function AccountDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { phoneNumber, accountNumber, availableBalance, latestBalance } =
    useAppSelector((s) => s.accountInfo);
  const [tab, setTab] = useState<Tab>("overview");
  const [vc, setVc] = useState(true);
  const [txOpen, setTxOpen] = useState(true);
  const [docsOpen, setDocsOpen] = useState(true);
  const [eap, setEap] = useState(true);
  const [remoteTxs, setRemoteTxs] = useState<Transaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!phoneNumber) return;
      let active = true;
      fetchTransactions(phoneNumber)
        .then((txs) => {
          if (active) setRemoteTxs(txs);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [phoneNumber]),
  );

  const allTxs: Transaction[] = [...remoteTxs, ...TXS];

  function openTransaction(item: Transaction) {
    router.push({
      pathname: "/transaction-details",
      params: { tx: JSON.stringify(item) },
    });
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()}>
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
          <View style={{ flex: 1, marginLeft: Spacing.two }}>
            <Text style={styles.accName}>MYMOACC</Text>
            <Text style={styles.accNum}>{accountNumber ?? "—"}</Text>
          </View>
          {tab === "documents" && (
            <SymbolView
              name={{ ios: "line.3.horizontal", android: "menu", web: "menu" }}
              size={24}
              tintColor={Brand.white}
            />
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((t) => (
            <Pressable
              key={t.key}
              style={styles.tabItem}
              onPress={() => setTab(t.key)}
            >
              {/* {t.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>NEW</Text>
                </View>
              )} */}
              <Text
                style={[styles.tabLabel, tab === t.key && styles.tabActive]}
              >
                {t.label}
              </Text>
              {tab === t.key && <View style={styles.tabLine} />}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {tab === "overview" && (
        <ScrollView style={styles.scroll}>
          <View style={styles.balSection}>
            <View style={styles.walletIcon}>
              <SymbolView
                name={{
                  ios: "wallet.pass.fill",
                  android: "account_balance_wallet",
                  web: "account_balance_wallet",
                }}
                size={32}
                tintColor={Brand.white}
              />
            </View>
            <Text style={styles.balLabel}>Available balance</Text>
            <Text style={styles.balAmt}>
              {availableBalance != null ? formatRand(availableBalance) : "—"}
            </Text>
            <Text style={styles.latLabel}>Latest balance</Text>
            <Text style={styles.latAmt}>
              {latestBalance != null ? formatRand(latestBalance) : "—"}
            </Text>
            <Pressable
              style={styles.payBtn}
              onPress={() => router.push("/pay")}
            >
              <SymbolView
                name={{
                  ios: "hand.tap.fill",
                  android: "touch_app",
                  web: "touch_app",
                }}
                size={20}
                tintColor={Brand.blue}
              />
              <Text style={styles.payText}>PAY</Text>
            </Pressable>
          </View>
          <View style={styles.cards}>
            <Card
              title="Virtual Card"
              open={vc}
              onToggle={() => setVc(!vc)}
              accent={vc}
            >
              <Text style={styles.cardBody}>
                Enjoy simple online payments with an extra layer of protection
                against fraud.
              </Text>
              <Pressable style={styles.showAll}>
                <Text style={styles.showAllText}>ADD &amp; VIEW</Text>
              </Pressable>
            </Card>
            <Card
              title="Recent transactions"
              open={txOpen}
              onToggle={() => setTxOpen(!txOpen)}
            >
              {allTxs.slice(0, 3).map((t, i) => (
                <TxRow key={i} item={t} i={i} onPress={openTransaction} />
              ))}
              <Pressable
                style={styles.showAll}
                onPress={() => setTab("transactions")}
              >
                <Text style={styles.showAllText}>SHOW ALL</Text>
              </Pressable>
            </Card>
            <Card
              title="Your documents"
              open={docsOpen}
              onToggle={() => setDocsOpen(!docsOpen)}
            >
              <Text style={styles.cardBody}>
                Get account statements, IT3(b) tax certificates and a bank
                account confirmation letter
              </Text>
              <Pressable style={styles.showAll}>
                <Text style={styles.showAllText}>VIEW</Text>
              </Pressable>
            </Card>
            <Card title="EAP Limit" open={eap} onToggle={() => setEap(!eap)}>
              <View style={styles.eap}>
                <Text style={styles.eapAmt}>R 50 000.00</Text>
                <View style={styles.eapBar}>
                  <View style={styles.eapFill} />
                </View>
                <View style={styles.eapRow}>
                  <View>
                    <Text style={styles.eapLabel}>Available</Text>
                    <Text style={styles.eapVal}>R 50 000.00</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.eapLabel}>Used</Text>
                    <Text style={styles.eapVal}>R 0.00</Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        </ScrollView>
      )}
      {tab === "transactions" && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchBar}>
            <SymbolView
              name={{
                ios: "magnifyingglass",
                android: "search",
                web: "search",
              }}
              size={18}
              tintColor={Brand.textMuted}
            />
            <Text style={styles.searchPlaceholder}>Search</Text>
          </View>
          <View style={styles.filters}>
            {["IN/OUT", "TRANSACTION TYPE", "DATE RANGE"].map((f) => (
              <Pressable key={f} style={styles.filterChip}>
                <Text style={styles.filterText}>{f}</Text>
              </Pressable>
            ))}
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {allTxs.map((t, i) => (
              <TxRow key={i} item={t} i={i} onPress={openTransaction} />
            ))}
          </ScrollView>
        </View>
      )}

      {tab === "documents" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.docsContent}
        >
          <View style={styles.card}>
            <Text style={styles.docSection}>Stamped statements</Text>
            {DOCS.stamped.map((d) => (
              <DocRow key={d.title} d={d} />
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.docSection}>Bank letters</Text>
            {DOCS.letters.map((d) => (
              <DocRow key={d.title} d={d} />
            ))}
          </View>
          <View style={styles.card}>
            <Text style={styles.docSection}>Previous statements</Text>
            {DOCS.prev.map((d) => (
              <DocRow key={d.title} d={d} />
            ))}
            <Pressable style={styles.showAll}>
              <Text style={styles.showAllText}>SHOW ALL</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {(tab === "cards" || tab === "details") && (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ color: Brand.textMuted, fontSize: 16 }}>
            Coming soon
          </Text>
        </View>
      )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.screen },
  // ── Header ──────────────────────────────────────────────────────────────────
  header: { backgroundColor: Brand.blue },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  accName: { color: Brand.white, fontSize: 18, fontWeight: "700" },
  accNum: { color: "rgba(255,255,255,0.75)", fontSize: 13 },
  tabBar: { paddingHorizontal: Spacing.two, paddingBottom: 0 },
  tabItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: "center",
    position: "relative",
  },
  tabLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  tabActive: { color: Brand.white },
  tabLine: {
    position: "absolute",
    bottom: 0,
    left: Spacing.three,
    right: Spacing.three,
    height: 3,
    backgroundColor: Brand.white,
    borderRadius: 2,
  },
  badge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: Brand.green,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    zIndex: 1,
  },
  badgeText: { color: Brand.white, fontSize: 9, fontWeight: "700" },
  // ── Scroll / Balance ─────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  balSection: {
    backgroundColor: Brand.white,
    alignItems: "center",
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
  },
  walletIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Brand.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.three,
  },
  balLabel: { color: Brand.textMuted, fontSize: 15, marginBottom: Spacing.one },
  balAmt: {
    color: Brand.navy,
    fontSize: 30,
    fontWeight: "500",
    marginBottom: Spacing.two,
  },
  latLabel: { color: Brand.textMuted, fontSize: 14 },
  latAmt: {
    color: Brand.navy,
    fontSize: 24,
    fontWeight: "500",
    marginBottom: Spacing.four,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    borderWidth: 1.5,
    borderColor: Brand.blue,
    borderRadius: 10,
    paddingHorizontal: Spacing.four + 4,
    paddingVertical: Spacing.two + 4,
  },
  payText: {
    color: Brand.blue,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1,
  },
  // ── Cards ────────────────────────────────────────────────────────────────────
  cards: { padding: Spacing.two * 2, gap: Spacing.two * 2 },
  card: {
    backgroundColor: Brand.white,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: Brand.white,
  },
  cardHeadAccent: { backgroundColor: Brand.blue },
  cardTitle: { color: Brand.navy, fontSize: 16, fontWeight: "600" },
  cardTitleAccent: { color: Brand.white },
  cardBody: {
    color: Brand.textMuted,
    fontSize: 14,
    lineHeight: 20,
    padding: Spacing.three,
  },
  showAll: {
    alignItems: "flex-end",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.divider,
  },
  showAllText: {
    color: Brand.blue,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // ── EAP ──────────────────────────────────────────────────────────────────────
  eap: { padding: Spacing.three },
  eapAmt: {
    color: Brand.navy,
    fontSize: 24,
    fontWeight: "400",
    textAlign: "center",
    marginBottom: Spacing.three,
  },
  eapBar: {
    height: 10,
    backgroundColor: Brand.divider,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: Spacing.two,
  },
  eapFill: { width: "100%", height: "100%", backgroundColor: Brand.blue },
  eapRow: { flexDirection: "row", justifyContent: "space-between" },
  eapLabel: { color: Brand.textMuted, fontSize: 13 },
  eapVal: { color: Brand.navy, fontSize: 14, fontWeight: "600" },
  // ── Transactions ─────────────────────────────────────────────────────────────
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: Brand.white,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  searchPlaceholder: { color: Brand.textMuted, fontSize: 16 },
  filters: {
    flexDirection: "row",
    gap: Spacing.two,
    padding: Spacing.two,
    backgroundColor: Brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: Brand.blue,
    borderRadius: 20,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
  },
  filterText: { color: Brand.blue, fontSize: 12, fontWeight: "600" },
  txRow: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: Brand.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  txRowAlt: { backgroundColor: Brand.screen },
  txDate: { color: Brand.textMuted, fontSize: 12, marginBottom: 2 },
  txTitle: { color: Brand.navy, fontSize: 14, fontWeight: "700" },
  txSub: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "700", marginLeft: Spacing.two },
  credit: { color: Brand.green },
  debit: { color: "#D32F2F" },
  // ── Documents ────────────────────────────────────────────────────────────────
  docsContent: { padding: Spacing.two, gap: Spacing.two },
  docSection: {
    color: Brand.navy,
    fontSize: 16,
    fontWeight: "700",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  docTitle: {
    color: Brand.navy,
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  docSub: { color: Brand.textMuted, fontSize: 13, marginBottom: 2 },
  docDetail: { color: Brand.textMuted, fontSize: 13 },
});
