import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';

type Row = { title: string; sub: string };

const NEW_ACCOUNTS: Row[] = [
  { title: 'Everyday Banking', sub: 'Find the account for you' },
  { title: 'Personal Lending', sub: "Let's see how much you can get" },
  { title: 'Savings and Investment', sub: 'See how you can grow your money' },
  { title: 'Share Trading Investment', sub: 'Grow your money through the stock markets' },
  { title: 'Credit Cards', sub: 'Enjoy rewards and get access to instant funds with one of our credit cards' },
  { title: 'Insurance', sub: 'Ensure that your possessions are covered and that your family is financially protected' },
  { title: 'Vehicle Finance', sub: 'Apply for vehicle finance with flexible repayments and personalised interest rates' },
];

const EXISTING_ACCOUNTS: Row[] = [
  { title: 'Home loan', sub: 'Add your house to your dashboard' },
];

function ListRow({ title, sub }: Row) {
  return (
    <Pressable style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={22} tintColor={Brand.blue} />
    </Pressable>
  );
}

export default function OpenAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.two }]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <SymbolView name={{ ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' }} size={24} tintColor={Brand.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Open or Add an Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Open a new account</Text>
        {NEW_ACCOUNTS.map((r) => (
          <ListRow key={r.title} {...r} />
        ))}

        <Text style={[styles.sectionTitle, styles.sectionGap]}>Add an existing account</Text>
        {EXISTING_ACCOUNTS.map((r) => (
          <ListRow key={r.title} {...r} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Brand.blue,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  back: { paddingVertical: Spacing.one },
  headerTitle: { color: Brand.white, fontSize: 22, fontWeight: '600' },
  content: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.five },
  sectionTitle: { color: Brand.blue, fontSize: 18, fontWeight: '700', marginTop: Spacing.three, marginBottom: Spacing.one },
  sectionGap: { marginTop: Spacing.four },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Brand.divider,
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: Brand.navy, fontSize: 17, fontWeight: '600' },
  rowSub: { color: Brand.textMuted, fontSize: 14, lineHeight: 19 },
});
