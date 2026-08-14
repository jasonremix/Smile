import * as Updates from "expo-updates";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { AuthProvider } from "./src/context/AuthContext";
import RootNavigator from "./src/navigation/RootNavigator";

// Ohne diesen expliziten Check laedt Expo neue OTA-Updates zwar im
// Hintergrund, wendet sie aber erst beim naechsten kompletten App-Neustart
// an - ein Update kann sich dadurch "unsichtbar" anfuehlen. Aktiv pruefen
// und bei Erfolg sofort neu laden, damit Aenderungen beim naechsten
// App-Oeffnen wirklich da sind.
function useApplyUpdatesOnLaunch() {
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const { isAvailable } = await Updates.checkForUpdateAsync();
        if (!isAvailable) return;
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // Kein Netz oder Update-Server nicht erreichbar - App laeuft
        // einfach mit dem aktuell installierten Stand weiter.
      }
    })();
  }, []);
}

export default function App() {
  useApplyUpdatesOnLaunch();
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <RootNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
