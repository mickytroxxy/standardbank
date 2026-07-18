import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/api";

/**
 * Requests notification permissions and returns the Expo push token.
 * Returns null if permissions are denied or device is a simulator.
 */
export async function registerForPushNotifications(
  phoneNumber: string,
): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn("Push notifications are only supported on physical devices.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#003ccd",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.warn("Push notification permission not granted.");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "1b07eb29-9105-4c85-baab-b02d9307d9dd",
    });
    const token = tokenData.data;

    // Persist the push token in Firestore so the admin can look it up
    await updateDoc(doc(db, "accounts", phoneNumber), {
      expoPushToken: token,
    });

    return token;
  } catch (e) {
    console.warn("Failed to get Expo push token:", e);
    return null;
  }
}

/**
 * Sends a push notification to a user identified by their phone number.
 * Looks up their Expo push token from Firestore and calls Expo's Push API.
 */
export async function sendPushNotificationToUser(
  phoneNumber: string,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void> {
  try {
    const snap = await getDoc(doc(db, "accounts", phoneNumber));
    if (!snap.exists()) {
      console.warn("User document not found for push notification:", phoneNumber);
      return;
    }

    const token: string | undefined = snap.data()?.expoPushToken;
    if (!token) {
      console.warn("No push token stored for user:", phoneNumber);
      return;
    }

    const message = {
      to: token,
      sound: "default",
      title,
      body,
      data: data ?? {},
      priority: "high",
    };

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (result?.data?.status === "error") {
      console.warn("Expo push failed:", result.data.message);
    }
  } catch (e) {
    console.warn("Failed to send push notification:", e);
  }
}
