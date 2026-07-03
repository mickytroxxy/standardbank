import { ActivityIndicator, Modal, StyleSheet, View } from "react-native";

import { useAppSelector } from "@/store";

/**
 * Global loader overlay — shown whenever `ui.isLoading` is true.
 * Controlled entirely via Redux: dispatch(showLoader()) / dispatch(hideLoader()).
 * Mount once in _layout.tsx inside <Provider>.
 */
export default function LoaderModal() {
  const isLoading = useAppSelector((s) => s.ui.isLoading);

  return (
    <Modal
      visible={isLoading}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#003ccd" />
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
  },
  card: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 10,
  },
});
