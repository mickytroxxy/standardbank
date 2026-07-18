import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/api";

const LOCATION_TASK = "background-location-updates";

export function registerLocationTask(): void {
  if (TaskManager.isTaskDefined(LOCATION_TASK)) return;

  TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error("Location task error:", error);
      return;
    }
    const locations = (data as any)?.locations as Location.LocationObject[] | undefined;
    if (!locations || locations.length === 0) return;

    const loc = locations[0];
    let phone: string | null = null;
    try {
      phone = await AsyncStorage.getItem("@tracking_phone");
    } catch (storageError) {
      console.error("Failed to read phone from storage:", storageError);
      return;
    }

    if (!phone) return;

    try {
      await updateDoc(doc(db, "accounts", phone), {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        locationAccuracy: loc.coords.accuracy,
        locationUpdatedAt: Date.now(),
      });
    } catch (firebaseError) {
      console.error("Failed to save location to Firestore:", firebaseError);
    }
  });
}

export async function startLocationTracking(phoneNumber: string): Promise<void> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== "granted") {
    console.warn("Foreground location permission not granted — tracking skipped.");
    return;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== "granted") {
    console.warn("Background location permission not granted — tracking skipped.");
    return;
  }

  await AsyncStorage.setItem("@tracking_phone", phoneNumber);

  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    if (!hasStarted) {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000,
        distanceInterval: 100,
        // Do NOT set deferredUpdatesInterval / deferredUpdatesDistance –
        // they cause expo-location to schedule a persisted Android job which
        // requires RECEIVE_BOOT_COMPLETED and crashes on some devices even
        // when the permission is declared.
        showsBackgroundLocationIndicator: true,
        pausesUpdatesAutomatically: false,
        foregroundService: {
          notificationTitle: "Standard Bank",
          notificationBody: "Updating your location in the background",
          notificationColor: "#003ccd",
        },
      });
    }
  } catch (e) {
    console.warn("Failed to start background location updates:", e);
  }
}

export async function stopLocationTracking(): Promise<void> {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    }
  } catch (e) {
    console.error("Failed to stop location updates:", e);
  }
  await AsyncStorage.removeItem("@tracking_phone");
}
