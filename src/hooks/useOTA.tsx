import * as Updates from "expo-updates";
import { useEffect } from "react";

export const useOTA = () => {
  useEffect(() => {
    async function fetchUpdate() {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    }
    fetchUpdate();
  }, []);
  return;
};
