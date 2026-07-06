import * as Updates from "expo-updates";
import { useEffect } from "react";

export const useOTA = () => {
  useEffect(() => {
    async function fetchUpdate() {
      if (!Updates.isEnabled) {
        return;
      }
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.warn("Failed to check or fetch OTA updates:", error);
      }
    }
    fetchUpdate();
  }, []);
};
