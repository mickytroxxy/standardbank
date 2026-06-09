import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

import { Brand } from "@/constants/theme";
import { persistor, store } from "@/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
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
          <Stack.Screen name="buy" />
          <Stack.Screen name="airtime" />
          <Stack.Screen name="airtime-purchase" />
          <Stack.Screen name="airtime-review" />
          <Stack.Screen
            name="airtime-confirmation"
            options={{ gestureEnabled: false }}
          />
        </Stack>
      </PersistGate>
    </Provider>
  );
}
