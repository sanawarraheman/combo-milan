import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type ToastType = "success" | "error" | "info";
type ToastState = { message: string; type: ToastType } | null;

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      setToast({ message, type });
    },
    [],
  );

  useEffect(() => {
    if (!toast) return;
    Animated.timing(opacity, {
      toValue: 1,
      duration: 180,
      useNativeDriver: Platform.OS !== "web",
    }).start();
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== "web",
      }).start(() => setToast(null));
    }, 2400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [toast, opacity]);

  const barColor =
    toast?.type === "error"
      ? colors.error
      : toast?.type === "info"
        ? colors.info
        : colors.success;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={[styles.wrap, { opacity, top: insets.top + 12 }]}
          testID="toast"
        >
          <View style={[styles.toast, { borderLeftColor: barColor }]}>
            <Text style={styles.text}>{toast.message}</Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    alignItems: "center",
    zIndex: 9999,
    pointerEvents: "none",
  },
  toast: {
    backgroundColor: colors.surfaceTertiary,
    borderLeftWidth: 4,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 480,
    width: "100%",
    ...StyleSheet.flatten({
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 8,
    }),
  },
  text: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
}));
