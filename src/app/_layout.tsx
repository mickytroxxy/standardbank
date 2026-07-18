import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { Fragment, useEffect } from "react";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import LoaderModal from "@/components/LoaderModal";
import { Brand } from "@/constants/theme";
import { useOTA } from "@/hooks/useOTA";
import { registerLocationTask } from "@/services/locationTracking";
import { persistor, store } from "@/store";

registerLocationTask();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const updates = useOTA();

  const [loaded, error] = useFonts({
    "BentonSans Regular": require("../../assets/fonts/BentonSans Regular.otf"),
    "BentonSans Bold": require("../../assets/fonts/BentonSans Bold.otf"),
    "BentonSans Book": require("../../assets/fonts/BentonSans Book.otf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Provider store={store}>
      <KeyboardProvider>
        <Fragment>
          <PersistGate loading={null} persistor={persistor}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Brand.blue },
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="register" />
              <Stack.Screen name="app-code" />
              <Stack.Screen name="home" />
              <Stack.Screen name="pay" />
              <Stack.Screen name="send" />
              <Stack.Screen name="open-account" />
              <Stack.Screen name="beneficiary-cell" />
              <Stack.Screen name="beneficiary-account" />
              <Stack.Screen name="choose-bank" />
              <Stack.Screen name="account-detail" />
              <Stack.Screen name="transaction-details" />
              <Stack.Screen name="send-proof-of-payment" />
              <Stack.Screen name="payment-details" />
              <Stack.Screen name="review-details" />
              <Stack.Screen
                name="confirmation"
                options={{ gestureEnabled: false }}
              />
              <Stack.Screen name="manage-vouchers" />
              <Stack.Screen name="buy" />
              <Stack.Screen name="airtime" />
              <Stack.Screen name="more" />
              <Stack.Screen name="settings" />

              <Stack.Screen name="airtime-purchase" />
              <Stack.Screen name="airtime-review" />
              <Stack.Screen
                name="airtime-confirmation"
                options={{ gestureEnabled: false }}
              />
            </Stack>
          </PersistGate>
          <LoaderModal />
        </Fragment>
      </KeyboardProvider>
    </Provider>
  );
}
