import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Brand, Spacing } from "@/constants/theme";

type Props = {
  visible: boolean;
  currentPin: string;
  onCancel: () => void;
  onSave: (newPin: string) => void | Promise<void>;
};

function isWeakPin(pin: string): boolean {
  if (pin.length !== 4) return true;
  if (/^(\d)\1{3}$/.test(pin)) return true;
  const digits = pin.split("").map(Number);
  const asc = digits.every((d, i) => i === 0 || d === digits[i - 1] + 1);
  const desc = digits.every((d, i) => i === 0 || d === digits[i - 1] - 1);
  return asc || desc;
}

export function ChangePinModal({
  visible,
  currentPin,
  onCancel,
  onSave,
}: Props) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [saving, setSaving] = useState(false);
  const refs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (visible) {
      setPin(["", "", "", ""]);
      setSaving(false);
    }
  }, [visible]);

  function setDigit(i: number, v: string) {
    const digit = v.replace(/[^0-9]/g, "").slice(-1);
    setPin((prev) => {
      const next = [...prev];
      next[i] = digit;
      return next;
    });
    if (digit && i < 3) refs.current[i + 1]?.focus();
  }

  const joined = pin.join("");
  const sameAsCurrent = joined.length === 4 && joined === currentPin;
  const weak = joined.length === 4 && isWeakPin(joined);
  const canSave = joined.length === 4 && !sameAsCurrent && !weak && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    await onSave(joined);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Change PIN</Text>
          <Text style={styles.sub}>Enter a new 4-digit PIN</Text>
          <View style={styles.pinRow}>
            {pin.map((d, i) => (
              <TextInput
                key={i}
                ref={(r) => {
                  refs.current[i] = r;
                }}
                style={styles.pinInput}
                value={d}
                onChangeText={(v) => setDigit(i, v)}
                onKeyPress={({ nativeEvent }) => {
                  if (
                    nativeEvent.key === "Backspace" &&
                    !pin[i] &&
                    i > 0
                  ) {
                    refs.current[i - 1]?.focus();
                  }
                }}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                secureTextEntry
              />
            ))}
          </View>
          {sameAsCurrent ? (
            <Text style={styles.error}>
              New PIN must be different from the current PIN
            </Text>
          ) : weak ? (
            <Text style={styles.error}>
              Avoid consecutive or repeating numbers
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable onPress={onCancel} hitSlop={8} disabled={saving}>
              <Text style={styles.actionMuted}>CANCEL</Text>
            </Pressable>
            <Pressable onPress={handleSave} hitSlop={8} disabled={!canSave}>
              <Text style={[styles.action, !canSave && styles.actionDisabled]}>
                SAVE
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.three,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: Brand.white,
    borderRadius: 6,
    padding: Spacing.four,
  },
  title: { fontSize: 18, fontWeight: "700", color: Brand.textDark },
  sub: {
    fontSize: 13,
    color: Brand.textMuted,
    marginTop: Spacing.one,
  },
  pinRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
  },
  pinInput: {
    width: 32,
    fontSize: 28,
    color: Brand.textDark,
    textAlign: "center",
    paddingVertical: Spacing.one,
    borderBottomWidth: 1,
    borderBottomColor: Brand.textMuted,
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
    color: Brand.warning,
    textAlign: "center",
    marginTop: Spacing.one,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.four,
    marginTop: Spacing.four,
  },
  action: { color: Brand.blue, fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  actionMuted: { color: Brand.textMuted, fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },
  actionDisabled: { color: Brand.textMuted },
});
