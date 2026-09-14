import { useRouter } from "expo-router";
import { Calculator as CalcIcon, X } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [vin, setVin] = useState("");
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");

  const vout = useMemo(() => {
    const v = parseFloat(vin);
    const a = parseFloat(r1);
    const b = parseFloat(r2);
    if (!isFinite(v) || !isFinite(a) || !isFinite(b) || a + b === 0) return null;
    return (v * b) / (a + b);
  }, [vin, r1, r2]);

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    testID: string,
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.muted}
        testID={testID}
      />
    </View>
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <CalcIcon size={22} weight="bold" color={colors.brand} />
          <Text style={styles.title}>{t("voltageDivider")}</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="calc-close">
          <X size={24} weight="bold" color={colors.onSurface} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        >
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>{t("vout")}</Text>
            <Text style={styles.resultValue} testID="vout-result">
              {vout === null ? "—" : `${vout.toFixed(3)} V`}
            </Text>
            <Text style={styles.formula}>{t("formula")}</Text>
          </View>

          {field(t("vin"), vin, setVin, "input-vin")}
          {field(t("r1"), r1, setR1, "input-r1")}
          {field(t("r2"), r2, setR2, "input-r2")}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  title: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  resultCard: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    alignItems: "center",
    gap: 6,
    marginBottom: 20,
  },
  resultLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  resultValue: {
    color: colors.brand,
    fontFamily: fonts.displayBold,
    fontSize: 40,
    letterSpacing: 1,
  },
  formula: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
    marginTop: 4,
  },
  field: { marginBottom: 16 },
  label: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 52,
    color: colors.onSurface,
    fontFamily: fonts.bodyMedium,
    fontSize: 18,
  },
}));
