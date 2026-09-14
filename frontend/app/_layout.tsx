import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LogBox, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { CorrectionProvider } from "@/src/components/SuggestCorrectionSheet";
import { ToastProvider } from "@/src/components/Toast";
import { LanguageProvider } from "@/src/i18n";
import { queryClient } from "@/src/query-client";
import { themes } from "@/src/theme";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  const [loaded] = useFonts({
    "Oswald-Bold": require("../assets/fonts/Oswald-Bold.ttf"),
    "Oswald-SemiBold": require("../assets/fonts/Oswald-SemiBold.ttf"),
    "Oswald-Medium": require("../assets/fonts/Oswald-Medium.ttf"),
    "NotoSans-Regular": require("../assets/fonts/NotoSans-Regular.ttf"),
    "NotoSans-Medium": require("../assets/fonts/NotoSans-Medium.ttf"),
    "NotoSans-Bold": require("../assets/fonts/NotoSans-Bold.ttf"),
  });

  return (
    <ErrorBoundary>
      <GestureHandlerRootView
        style={{ flex: 1, backgroundColor: themes.dark.surface }}
      >
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <ToastProvider>
                <LanguageProvider>
                  <CorrectionProvider>
                    <StatusBar style="light" />
                    {loaded ? (
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          contentStyle: {
                            backgroundColor: themes.dark.surface,
                          },
                          animation: "slide_from_right",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: themes.dark.surface,
                        }}
                      />
                    )}
                  </CorrectionProvider>
                </LanguageProvider>
              </ToastProvider>
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
