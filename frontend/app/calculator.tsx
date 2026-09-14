import { useRouter } from "expo-router";
import { Calculator as CalcIcon, Minus, Plus, X } from "phosphor-react-native";
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

type Mode = "basic" | "advanced";

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("basic");

  // basic state
  const [vin, setVin] = useState("");
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");

  // advanced state (resistors in series)
  const [resistors, setResistors] = useState<string[]>(["", "", ""]);

  const vout = useMemo(() => {
    const v = parseFloat(vin);
    const a = parseFloat(r1);
    const b = parseFloat(r2);
    if (!isFinite(v) || !isFinite(a) || !isFinite(b) || a + b === 0) return null;
    return (v * b) / (a + b);
  }, [vin, r1, r2]);

  const advResult = useMemo(() => {
    const v = parseFloat(vin);
    const vals = resistors
      .map((r) => parseFloat(r))
      .filter((x) => isFinite(x) && x > 0);
    if (!isFinite(v) || vals.length < 2) return null;
    const total = vals.reduce((a, b) => a + b, 0);
    if (total === 0) return null;
    const drops = vals.map((r) => (v * r) / total);
    const current = (v / total) * 1000; // mA
    return { drops, total, current };
  }, [vin, resistors]);

  const setResistor = (idx: number, val: string) => {
    setResistors((prev) => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  const addResistor = () => {
    if (resistors.length < 6) setResistors((p) => [...p, ""]);
  };
  const removeResistor = () => {
    if (resistors.length > 2) setResistors((p) => p.slice(0, -1));
  };

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
          <Text style={styles.title} numberOfLines={1}>
            {t("voltageDivider")}
          </Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="calc-close">
          <X size={24} weight="bold" color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.modeRow}>
        {(["basic", "advanced"] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
            testID={`mode-${m}`}
          >
            <Text
              style={[styles.modeText, mode === m && styles.modeTextActive]}
            >
              {t(m)}
            </Text>
          </Pressable>
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
        >
          {mode === "basic" ? (
            <>
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
            </>
          ) : (
            <>
              <View style={styles.resultCard}>
                <Text style={styles.resultLabel}>{t("dropsLabel")}</Text>
                {advResult ? (
                  advResult.drops.map((d, i) => (
                    <View key={i} style={styles.dropRow}>
                      <Text style={styles.dropLabel}>R{i + 1}</Text>
                      <Text style={styles.dropValue} testID={`drop-${i}`}>
                        {d.toFixed(3)} V
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.resultValue}>—</Text>
                )}
                {advResult && (
                  <View style={styles.advMeta}>
                    <Text style={styles.formula} testID="adv-total">
                      {t("totalResistance")}: {advResult.total.toFixed(1)} Ω ·{" "}
                      {t("circuitCurrent")}: {advResult.current.toFixed(2)} mA
                    </Text>
                  </View>
                )}
              </View>

              {field(t("vin"), vin, setVin, "adv-input-vin")}

              <View style={styles.resHeader}>
                <Text style={styles.label}>
                  {t("numResistors")}: {resistors.length}
                </Text>
                <View style={styles.resControls}>
                  <Pressable
                    onPress={removeResistor}
                    style={({ pressed }) => [
                      styles.roundBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    testID="res-minus"
                  >
                    <Minus size={18} weight="bold" color={colors.onSurface} />
                  </Pressable>
                  <Pressable
                    onPress={addResistor}
                    style={({ pressed }) => [
                      styles.roundBtn,
                      pressed && { opacity: 0.7 },
                    ]}
                    testID="res-plus"
                  >
                    <Plus size={18} weight="bold" color={colors.onSurface} />
                  </Pressable>
                </View>
              </View>

              {resistors.map((val, i) => (
                <View key={`r-${i}`}>
                  {field(
                    `${t("resistorLabel")} R${i + 1} (Ω)`,
                    val,
                    (v) => setResistor(i, v),
                    `adv-input-r${i}`,
                  )}
                </View>
              ))}
            </>
          )}
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
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  title: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.3,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  modeBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeBtnActive: {
    backgroundColor: colors.brandTertiary,
    borderColor: colors.brand,
  },
  modeText: {
    color: colors.muted,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  modeTextActive: { color: colors.brand },
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
    textAlign: "center",
  },
  dropRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dropLabel: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
  },
  dropValue: {
    color: colors.brand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 18,
  },
  advMeta: { marginTop: 8 },
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
  resHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  resControls: { flexDirection: "row", gap: 8 },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
}));
