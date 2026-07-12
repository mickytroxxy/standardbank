import {
  deleteAccount,
  deleteTransaction,
  fetchAllAccounts,
  fetchTransactions,
  formatRand,
  onAccountsUpdate,
  setAccountActive,
  topUpUserAccount,
  updateTransaction,
} from "@/api";
import { Brand, Spacing } from "@/constants/theme";
import { useAppDispatch } from "@/store";
import { hideLoader, showLoader } from "@/store/ui-slice";
import { MaterialDesignIcons } from "@react-native-vector-icons/material-design-icons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function isEmail(val?: string): boolean {
  if (!val) return false;
  return val.includes("@");
}

function formatLocationAccuracy(accuracy?: number | null): string {
  if (accuracy == null) return "—";
  return `±${accuracy.toFixed(1)} m`;
}

function formatLocationTime(timestamp?: number | null): string {
  if (timestamp == null) return "No update yet";
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return `${Math.floor(diff / 86400000)} days ago`;
}

function generateTopUpReference(): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  const rand1 = Math.floor(10000000 + Math.random() * 90000000).toString();
  const rand2 = Math.floor(10000000 + Math.random() * 90000000).toString();

  return `${yy}${mm}${dd}SBGRPP${rand1}C${rand2}`;
}

export default function UsersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [txUser, setTxUser] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("0.00");
  const [topUpRef, setTopUpRef] = useState("");
  const [topUpPending, setTopUpPending] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [editTxModalOpen, setEditTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editFullDate, setEditFullDate] = useState("");

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    dispatch(showLoader());
    try {
      const all = await fetchAllAccounts();
      setUsers(all);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
      dispatch(hideLoader());
    }
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      await Promise.resolve();
      if (active) {
        await loadInitial();
      }
    };
    run();
    const unsubscribe = onAccountsUpdate(
      (accounts) => {
        if (active) {
          setUsers(accounts);
        }
      },
      (error) => {
        if (active) {
          Alert.alert("Error", error.message);
        }
      },
    );
    unsubscribeRef.current = unsubscribe;
    return () => {
      active = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [loadInitial]);

  async function handleDelete(phone: string) {
    Alert.alert("Delete user", "Are you sure? This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAccount(phone);
            loadInitial();
          } catch (e) {
            Alert.alert(
              "Delete failed",
              e instanceof Error ? e.message : String(e),
            );
          }
        },
      },
    ]);
  }

  async function handleToggleActive(
    phone: string,
    current: boolean | undefined,
  ) {
    try {
      await setAccountActive(phone, !current);
      loadInitial();
    } catch (e) {
      Alert.alert("Update failed", e instanceof Error ? e.message : String(e));
    }
  }

  function handleLoadAccount(u: any) {
    setSelectedUser(u);
    setTopUpAmount("0.00");
    setTopUpRef(generateTopUpReference());
    setTopUpModalOpen(true);
  }

  async function handleSubmitTopUp() {
    if (!selectedUser) return;
    const amount = parseFloat(topUpAmount.replace(/[^0-9.]/g, "")) || 0;
    if (amount <= 0) {
      Alert.alert("Invalid amount", "Please enter a top-up amount.");
      return;
    }
    if (!topUpRef.trim()) {
      Alert.alert("Missing reference", "Please enter a reference.");
      return;
    }
    setTopUpPending(true);
    try {
      await topUpUserAccount(
        "0658016132",
        selectedUser.phoneNumber,
        amount,
        topUpRef.trim(),
      );
      setTopUpModalOpen(false);
      setSelectedUser(null);
      loadInitial();
      Alert.alert("Success", "User account has been topped up.");
    } catch (e) {
      Alert.alert("Top-up failed", e instanceof Error ? e.message : String(e));
    } finally {
      setTopUpPending(false);
    }
  }

  async function handleShowTransactions(phone: string) {
    try {
      const tx = await fetchTransactions(phone);
      setTxs(tx as any[]);
      setTxUser(phone);
      setTxModalOpen(true);
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : String(e));
    }
  }

  function handleOpenEditTx(t: any) {
    setEditingTx(t);
    setEditDate(t.date || "");
    setEditTime(t.time || "");
    setEditFullDate(t.fullDate || "");
    setEditTxModalOpen(true);
  }

  async function handleSaveEditTx() {
    if (!txUser || !editingTx?.id) return;
    try {
      await updateTransaction(txUser, editingTx.id, {
        date: editDate,
        time: editTime,
        fullDate: editFullDate,
      });
      setEditTxModalOpen(false);
      setEditingTx(null);
      const tx = await fetchTransactions(txUser);
      setTxs(tx as any[]);
    } catch (e) {
      Alert.alert("Update failed", e instanceof Error ? e.message : String(e));
    }
  }

  function handleDeleteTx(t: any) {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!txUser || !t.id) return;
            try {
              await deleteTransaction(txUser, t.id);
              const tx = await fetchTransactions(txUser);
              setTxs(tx as any[]);
            } catch (e) {
              Alert.alert(
                "Delete failed",
                e instanceof Error ? e.message : String(e),
              );
            }
          },
        },
      ],
    );
  }

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${clean}`).catch((err) =>
      Alert.alert("Error", "Could not open dialer: " + err.message),
    );
  };

  const handleWhatsApp = (phone: string) => {
    let clean = phone.replace(/[^\d+]/g, "");
    if (clean.startsWith("0")) {
      clean = "27" + clean.slice(1);
    } else if (clean.startsWith("+")) {
      clean = clean.slice(1);
    }
    Linking.openURL(`https://wa.me/${clean}`).catch((err) =>
      Alert.alert("Error", "Could not open WhatsApp: " + err.message),
    );
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email.trim()}`).catch((err) =>
      Alert.alert("Error", "Could not open email client: " + err.message),
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      {/* Premium Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialDesignIcons
            name="arrow-left"
            size={24}
            color={Brand.textDark}
          />
        </Pressable>
        <Text style={styles.headerTitle}>User Management</Text>
        <Pressable
          style={styles.refreshButton}
          onPress={loadInitial}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={Brand.blue} />
          ) : (
            <MaterialDesignIcons
              name="refresh"
              size={22}
              color={Brand.textDark}
            />
          )}
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {users.map((u) => {
          const initials =
            `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
          const isActive = u.active !== false;

          return (
            <View key={u.phoneNumber} style={styles.userCard}>
              {/* Card Header: Avatar & Info */}
              <View style={styles.cardHeader}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>
                    {u.firstName} {u.lastName}
                  </Text>
                  <Text style={styles.userSubText}>Acc: {u.accountNumber}</Text>
                  <Text style={styles.userSubText}>Phone: {u.phoneNumber}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    isActive ? styles.statusActive : styles.statusInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      isActive
                        ? styles.statusActiveText
                        : styles.statusInactiveText,
                    ]}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              {u.latitude != null && u.longitude != null && (
                <View style={styles.cardLocationRow}>
                  <MaterialDesignIcons
                    name="map-marker-outline"
                    size={14}
                    color={Brand.blue}
                  />
                  <Text style={styles.cardLocationText}>
                    {u.latitude.toFixed(5)}, {u.longitude.toFixed(5)}
                  </Text>
                  <View style={styles.cardLocationDot} />
                  <Text style={styles.cardLocationMeta}>
                    {formatLocationAccuracy(u.locationAccuracy)}
                  </Text>
                  <View style={styles.cardLocationDot} />
                  <Text style={styles.cardLocationMeta}>
                    {formatLocationTime(u.locationUpdatedAt)}
                  </Text>
                </View>
              )}

              {/* Balance Summary Row */}
              <View style={styles.cardBalanceRow}>
                <View style={styles.balanceCol}>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={[styles.balanceVal, { color: Brand.green }]}>
                    {formatRand(u.availableBalance ?? 0)}
                  </Text>
                </View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceCol}>
                  <Text style={styles.balanceLabel}>Latest Balance</Text>
                  <Text style={styles.balanceVal}>
                    {formatRand(u.latestBalance ?? 0)}
                  </Text>
                </View>
              </View>

              {/* Action Toolbar */}
              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.cardActionBtn, styles.btnTopUp]}
                  onPress={() => handleLoadAccount(u)}
                >
                  <MaterialDesignIcons
                    name="cash-plus"
                    size={16}
                    color={Brand.white}
                  />
                  <Text style={styles.cardActionBtnText}>Top Up</Text>
                </Pressable>

                <Pressable
                  style={[styles.cardActionBtn, styles.btnTxs]}
                  onPress={() => handleShowTransactions(u.phoneNumber)}
                >
                  <MaterialDesignIcons
                    name="history"
                    size={16}
                    color={Brand.white}
                  />
                  <Text style={styles.cardActionBtnText}>Txs</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.cardActionBtn,
                    styles.btnStatus,
                    { backgroundColor: isActive ? "#F5732B" : Brand.green },
                  ]}
                  onPress={() => handleToggleActive(u.phoneNumber, u.active)}
                >
                  <MaterialDesignIcons
                    name={
                      isActive
                        ? "account-cancel-outline"
                        : "account-check-outline"
                    }
                    size={16}
                    color={Brand.white}
                  />
                  <Text style={styles.cardActionBtnText}>
                    {isActive ? "Deactivate" : "Activate"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.btnDelete}
                  onPress={() => handleDelete(u.phoneNumber)}
                >
                  <MaterialDesignIcons
                    name="delete-outline"
                    size={20}
                    color="#D32F2F"
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Transactions Modal */}
      <Modal
        visible={txModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTxModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardLarge}>
            <View style={styles.modalHeader}>
              <Pressable
                style={styles.modalBackBtn}
                onPress={() => setTxModalOpen(false)}
                hitSlop={8}
              >
                <MaterialDesignIcons
                  name="arrow-left"
                  size={22}
                  color={Brand.textDark}
                />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Transactions</Text>
                <Text style={styles.modalSubtitle}>History for {txUser}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.txScrollView}
              contentContainerStyle={{ paddingBottom: Spacing.four }}
            >
              {txs.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialDesignIcons
                    name="history"
                    size={48}
                    color={Brand.textMuted}
                  />
                  <Text style={styles.emptyText}>
                    No transactions found for this user.
                  </Text>
                </View>
              ) : (
                txs.map((t, i) => {
                  const isCredit = !!t.credit;
                  const contactVal = t.notificationValue || t.proofContact;

                  return (
                    <View key={i} style={styles.txCard}>
                      <View style={styles.txMainRow}>
                        <View
                          style={[
                            styles.txIconContainer,
                            isCredit ? styles.txIconCredit : styles.txIconDebit,
                          ]}
                        >
                          <MaterialDesignIcons
                            name={isCredit ? "plus" : "minus"}
                            size={18}
                            color={isCredit ? Brand.green : "#D32F2F"}
                          />
                        </View>
                        <View style={styles.txInfo}>
                          <Text style={styles.txTitleText}>{t.title}</Text>
                          <Text style={styles.txSubText}>{t.sub}</Text>
                          <Text style={styles.txDateText}>
                            {t.date} {t.time ?? ""}
                          </Text>
                          {(t.notificationValue || t.proofContact) && (
                            <Text style={styles.txNotifValue} numberOfLines={1}>
                              {t.notificationType === "email" ? "📧" : "📱"}{" "}
                              {t.notificationValue || t.proofContact}
                            </Text>
                          )}
                        </View>
                        <View style={styles.txAmountCol}>
                          <Text
                            style={[
                              styles.txAmtText,
                              isCredit ? styles.creditAmt : styles.debitAmt,
                            ]}
                          >
                            {isCredit ? "+" : ""}
                            {t.amount}
                          </Text>
                          {t.runningBalance && (
                            <Text style={styles.txRunningBal}>
                              {t.runningBalance}
                            </Text>
                          )}
                          <View
                            style={{
                              flexDirection: "row",
                              gap: 12,
                              marginTop: 8,
                            }}
                          >
                            <Pressable
                              onPress={() => handleOpenEditTx(t)}
                              hitSlop={8}
                            >
                              <MaterialDesignIcons
                                name="pencil"
                                size={18}
                                color={Brand.blue}
                              />
                            </Pressable>
                            <Pressable
                              onPress={() => handleDeleteTx(t)}
                              hitSlop={8}
                            >
                              <MaterialDesignIcons
                                name="delete"
                                size={18}
                                color="#D32F2F"
                              />
                            </Pressable>
                          </View>
                        </View>
                      </View>

                      {/* Contact Notification Quick Actions */}
                      {contactVal && (
                        <View style={styles.notificationActionBox}>
                          <View style={styles.notificationHeaderRow}>
                            <MaterialDesignIcons
                              name="information-outline"
                              size={14}
                              color={Brand.textMuted}
                            />
                            <Text style={styles.notificationLabel}>
                              Proof of Payment recipient:
                            </Text>
                          </View>
                          <Text style={styles.notificationValueText}>
                            {contactVal}
                          </Text>

                          <View style={styles.notificationButtonRow}>
                            {isEmail(contactVal) ? (
                              <Pressable
                                style={[styles.miniActionBtn, styles.emailBtn]}
                                onPress={() => handleEmail(contactVal)}
                              >
                                <MaterialDesignIcons
                                  name="email-outline"
                                  size={14}
                                  color="#0D47A1"
                                />
                                <Text
                                  style={[
                                    styles.miniActionText,
                                    { color: "#0D47A1" },
                                  ]}
                                >
                                  Email Receiver
                                </Text>
                              </Pressable>
                            ) : (
                              <>
                                <Pressable
                                  style={[styles.miniActionBtn, styles.callBtn]}
                                  onPress={() => handleCall(contactVal)}
                                >
                                  <MaterialDesignIcons
                                    name="phone-outline"
                                    size={14}
                                    color="#0D47A1"
                                  />
                                  <Text
                                    style={[
                                      styles.miniActionText,
                                      { color: "#0D47A1" },
                                    ]}
                                  >
                                    Call
                                  </Text>
                                </Pressable>
                                <Pressable
                                  style={[
                                    styles.miniActionBtn,
                                    styles.whatsappBtn,
                                  ]}
                                  onPress={() => handleWhatsApp(contactVal)}
                                >
                                  <MaterialDesignIcons
                                    name="whatsapp"
                                    size={14}
                                    color="#1B5E20"
                                  />
                                  <Text
                                    style={[
                                      styles.miniActionText,
                                      { color: "#1B5E20" },
                                    ]}
                                  >
                                    WhatsApp
                                  </Text>
                                </Pressable>
                              </>
                            )}
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>

            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setTxModalOpen(false)}
            >
              <Text style={styles.modalCloseBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Top Up Modal */}
      <Modal
        visible={topUpModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setTopUpModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Top Up Account</Text>
            <Text style={styles.modalSubtitle}>
              Credit funds to {selectedUser?.firstName} {selectedUser?.lastName}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Amount (ZAR)</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputPrefix}>R</Text>
                <TextInput
                  style={styles.modalInput}
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor={Brand.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Reference</Text>
              <TextInput
                style={styles.inputField}
                value={topUpRef}
                onChangeText={setTopUpRef}
                placeholder="e.g. Deposit Ref"
                placeholderTextColor={Brand.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalActionBtn, styles.btnCancel]}
                onPress={() => setTopUpModalOpen(false)}
                disabled={topUpPending}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalActionBtn, styles.btnSubmit]}
                onPress={handleSubmitTopUp}
                disabled={topUpPending}
              >
                <Text style={styles.btnSubmitText}>
                  {topUpPending ? "Processing..." : "Confirm Top Up"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Tx Modal */}
      <Modal
        visible={editTxModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditTxModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Transaction Date</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Date (e.g. 14 Jul)</Text>
              <TextInput
                style={styles.inputField}
                value={editDate}
                onChangeText={setEditDate}
                placeholder="14 Jul"
                placeholderTextColor={Brand.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>Time (e.g. 14:30)</Text>
              <TextInput
                style={styles.inputField}
                value={editTime}
                onChangeText={setEditTime}
                placeholder="14:30"
                placeholderTextColor={Brand.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.modalLabel}>
                Full Date (e.g. 14 July 2026)
              </Text>
              <TextInput
                style={styles.inputField}
                value={editFullDate}
                onChangeText={setEditFullDate}
                placeholder="14 July 2026"
                placeholderTextColor={Brand.textMuted}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalActionBtn, styles.btnCancel]}
                onPress={() => setEditTxModalOpen(false)}
              >
                <Text style={styles.btnCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalActionBtn, styles.btnSubmit]}
                onPress={handleSaveEditTx}
              >
                <Text style={styles.btnSubmitText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.screen },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    backgroundColor: Brand.card,
    borderBottomWidth: 1,
    borderBottomColor: Brand.divider,
  },
  backButton: {
    padding: Spacing.one,
  },
  headerTitle: {
    color: Brand.textDark,
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    marginLeft: Spacing.three,
  },
  refreshButton: {
    padding: Spacing.one,
    justifyContent: "center",
    alignItems: "center",
    width: 32,
    height: 32,
  },
  scrollContent: {
    padding: Spacing.three,
  },
  userCard: {
    backgroundColor: Brand.card,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: Brand.cardBorder,
    shadowColor: "#0A1F44",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Brand.divider,
  },
  avatarText: {
    color: Brand.blue,
    fontSize: 18,
    fontWeight: "700",
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  userName: {
    color: Brand.textDark,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  userSubText: {
    color: Brand.textMuted,
    fontSize: 12,
  },
  cardLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.two,
    paddingVertical: Spacing.half,
    gap: Spacing.half,
  },
  cardLocationText: {
    color: Brand.navy,
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  cardLocationDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Brand.textMuted,
  },
  cardLocationMeta: {
    color: Brand.textMuted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#E8F5E9",
  },
  statusInactive: {
    backgroundColor: "#ECEFF1",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  statusActiveText: {
    color: Brand.green,
  },
  statusInactiveText: {
    color: Brand.textMuted,
  },
  cardBalanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
  },
  balanceCol: {
    flex: 1,
    alignItems: "center",
  },
  balanceDivider: {
    width: 1,
    height: "80%",
    backgroundColor: Brand.divider,
  },
  balanceLabel: {
    fontSize: 11,
    color: Brand.textMuted,
    marginBottom: 2,
  },
  balanceVal: {
    fontSize: 14,
    fontWeight: "700",
    color: Brand.textDark,
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  cardActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.two,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    justifyContent: "center",
  },
  btnTopUp: {
    backgroundColor: Brand.blue,
  },
  btnTxs: {
    backgroundColor: Brand.navy,
  },
  btnStatus: {
    // Background color determined dynamically
  },
  cardActionBtnText: {
    color: Brand.white,
    fontSize: 12,
    fontWeight: "700",
  },
  btnDelete: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(10, 31, 68, 0.4)",
    justifyContent: "center",
    padding: Spacing.three,
  },
  modalCard: {
    backgroundColor: Brand.white,
    borderRadius: 20,
    padding: Spacing.four,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  modalCardLarge: {
    backgroundColor: Brand.white,
    borderRadius: 20,
    padding: Spacing.four,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: Brand.divider,
    paddingBottom: Spacing.two,
    marginBottom: Spacing.two,
  },
  modalBackBtn: {
    padding: Spacing.one,
    marginRight: Spacing.two,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Brand.textDark,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: Spacing.three,
  },
  modalLabel: {
    color: Brand.textDark,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.one,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Brand.divider,
    borderRadius: 10,
    backgroundColor: Brand.screen,
    paddingHorizontal: Spacing.three,
  },
  inputPrefix: {
    fontSize: 16,
    fontWeight: "700",
    color: Brand.textDark,
    marginRight: Spacing.one,
  },
  modalInput: {
    flex: 1,
    paddingVertical: Spacing.two,
    fontSize: 16,
    color: Brand.textDark,
    fontWeight: "700",
  },
  inputField: {
    borderWidth: 1,
    borderColor: Brand.divider,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
    color: Brand.textDark,
    backgroundColor: Brand.screen,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  modalActionBtn: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancel: {
    backgroundColor: Brand.divider,
  },
  btnCancelText: {
    color: Brand.textDark,
    fontWeight: "700",
    fontSize: 14,
  },
  btnSubmit: {
    backgroundColor: Brand.blue,
  },
  btnSubmitText: {
    color: Brand.white,
    fontWeight: "700",
    fontSize: 14,
  },
  txScrollView: {
    marginVertical: Spacing.two,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.five,
  },
  emptyText: {
    marginTop: Spacing.two,
    fontSize: 14,
    color: Brand.textMuted,
    textAlign: "center",
  },
  txCard: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: Brand.divider,
  },
  txMainRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  txIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  txIconCredit: {
    backgroundColor: "#E8F5E9",
  },
  txIconDebit: {
    backgroundColor: "#FFEBEE",
  },
  txInfo: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  txTitleText: {
    fontSize: 14,
    fontWeight: "700",
    color: Brand.textDark,
  },
  txSubText: {
    fontSize: 12,
    color: Brand.textMuted,
    marginTop: 1,
  },
  txDateText: {
    fontSize: 10,
    color: Brand.textMuted,
    marginTop: 2,
  },
  txNotifValue: {
    fontSize: 12,
    color: Brand.blue,
    marginTop: 2,
    fontWeight: "600",
  },
  txAmountCol: {
    alignItems: "flex-end",
  },
  txAmtText: {
    fontSize: 15,
    fontWeight: "700",
  },
  creditAmt: {
    color: Brand.green,
  },
  debitAmt: {
    color: "#D32F2F",
  },
  txRunningBal: {
    fontSize: 11,
    color: Brand.textMuted,
    marginTop: 2,
  },
  notificationActionBox: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: Brand.divider,
  },
  notificationHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  notificationLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: Brand.textMuted,
  },
  notificationValueText: {
    fontSize: 13,
    fontWeight: "700",
    color: Brand.textDark,
    marginVertical: 4,
  },
  notificationButtonRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: 2,
  },
  miniActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  emailBtn: {
    backgroundColor: "#E3F2FD",
    borderColor: "#BBDEFB",
  },
  callBtn: {
    backgroundColor: "#E3F2FD",
    borderColor: "#BBDEFB",
  },
  whatsappBtn: {
    backgroundColor: "#E8F5E9",
    borderColor: "#C8E6C9",
  },
  miniActionText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalCloseBtn: {
    backgroundColor: Brand.blue,
    borderRadius: 10,
    paddingVertical: Spacing.two,
    alignItems: "center",
    marginTop: Spacing.two,
  },
  modalCloseBtnText: {
    color: Brand.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
