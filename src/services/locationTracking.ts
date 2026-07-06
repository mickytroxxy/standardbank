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
    throw new Error("Foreground location permission denied.");
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== "granted") {
    throw new Error("Background location permission denied.");
  }

  await AsyncStorage.setItem("@tracking_phone", phoneNumber);

  const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (!hasStarted) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 30000,
      distanceInterval: 50,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: "Standard Bank",
        notificationBody: "Updating your location in the background",
        notificationColor: "#003ccd",
      },
    });
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
