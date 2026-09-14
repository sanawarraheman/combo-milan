import { useRouter } from "expo-router";
import { Backspace, Lock, X } from "phosphor-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { saveAdminPasscode, verifyPasscode } from "@/src/api";
import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "back"];

export default function AdminUnlock() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;

  const runShake = () => {
    shake.setValue(0);
    const useNative = Platform.OS !== "web";
    Animated.sequence([
      Animated.timing(shake, { toValue: 12, duration: 60, useNativeDriver: useNative }),
      Animated.timing(shake, { toValue: -12, duration: 60, useNativeDriver: useNative }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: useNative }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: useNative }),
    ]).start();
  };

  useEffect(() => {
    if (code.length !== 4) return;
    setChecking(true);
    verifyPasscode(code)
      .then(async (ok) => {
        if (ok) {
          await saveAdminPasscode(code);
          router.replace("/add-data");
        } else {
          setError(true);
          runShake();
          setCode("");
        }
      })
      .catch(() => {
        setError(true);
        runShake();
        setCode("");
      })
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const press = (k: string) => {
    setError(false);
    if (k === "back") {
      setCode((c) => c.slice(0, -1));
    } else if (k !== "" && code.length < 4) {
      setCode((c) => c + k);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          testID="admin-close"
        >
          <X size={24} weight="bold" color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <View style={styles.lockCircle}>
          <Lock size={30} weight="fill" color={colors.brand} />
        </View>
        <Text style={styles.title}>{t("adminAccess")}</Text>
        <Text style={styles.subtitle}>{t("enterPasscode")}</Text>

        <Animated.View
          style={[styles.dots, { transform: [{ translateX: shake }] }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < code.length && styles.dotFilled,
                error && styles.dotError,
              ]}
            />
          ))}
        </Animated.View>

        {error && <Text style={styles.error}>{t("wrongPasscode")}</Text>}
      </View>

      <View style={[styles.pad, { paddingBottom: insets.bottom + 24 }]}>
        {KEYS.map((k, idx) => (
          <Pressable
            key={idx}
            disabled={k === "" || checking}
            onPress={() => press(k)}
            style={({ pressed }) => [
              styles.key,
              k === "" && styles.keyEmpty,
              pressed && k !== "" && styles.keyPressed,
            ]}
            testID={k === "back" ? "key-back" : k ? `key-${k}` : undefined}
          >
            {k === "back" ? (
              <Backspace size={24} weight="bold" color={colors.onSurface} />
            ) : (
              <Text style={styles.keyText}>{k}</Text>
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  topBar: { paddingHorizontal: 16, paddingVertical: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  lockCircle: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 24,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
  },
  dots: { flexDirection: "row", gap: 16, marginTop: 20 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  dotFilled: { backgroundColor: colors.brand, borderColor: colors.brand },
  dotError: { borderColor: colors.error },
  error: {
    color: colors.error,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    marginTop: 12,
  },
  pad: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 32,
    gap: 0,
  },
  key: {
    width: "33.33%",
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  keyEmpty: {},
  keyPressed: { opacity: 0.5 },
  keyText: {
    color: colors.onSurface,
    fontFamily: fonts.displaySemiBold,
    fontSize: 28,
  },
}));
