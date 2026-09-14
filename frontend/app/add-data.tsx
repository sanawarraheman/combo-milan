import { useRouter } from "expo-router";
import { Check, ClipboardText, Plus, X } from "phosphor-react-native";
import React, { useState } from "react";
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

import { useCreateGroup, useCreateModel, useMeta } from "@/src/api";
import { useToast } from "@/src/components/Toast";
import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function AddData() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang } = useI18n();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: meta } = useMeta();
  const createGroup = useCreateGroup();
  const createModel = useCreateModel();

  const categories = meta?.categories ?? [];
  const brandGroups = meta?.brandGroups ?? [];

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [isCurve, setIsCurve] = useState(false);
  const [brandGroup, setBrandGroup] = useState<string | null>(null);
  const [modelsText, setModelsText] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<"verified" | "unconfirmed">(
    "unconfirmed",
  );

  const [modelName, setModelName] = useState("");
  const [modelBrand, setModelBrand] = useState("");

  const selectedCat = categories.find((c) => c.id === categoryId);
  const hasCurve = (selectedCat?.subCategories.length ?? 0) > 0;
  const catLabel = (id: string) => {
    const c = categories.find((x) => x.id === id);
    return c ? (lang === "hi" ? c.name_hi : c.name_en) : id;
  };

  const saveGroup = async () => {
    const models = modelsText
      .split("\n")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!categoryId || !brandGroup || models.length === 0) {
      showToast(t("saveFailed"), "error");
      return;
    }
    try {
      await createGroup.mutateAsync({
        categoryId,
        subCategory: hasCurve && isCurve ? "curve-glass" : null,
        brandGroup,
        models,
        source: source.trim() || null,
        status,
      });
      showToast(t("saved"), "success");
      setModelsText("");
      setSource("");
      setStatus("unconfirmed");
      setIsCurve(false);
    } catch (e: any) {
      showToast(e?.message || t("saveFailed"), "error");
    }
  };

  const saveModel = async () => {
    if (!modelName.trim() || !modelBrand.trim()) {
      showToast(t("saveFailed"), "error");
      return;
    }
    try {
      await createModel.mutateAsync({
        name: modelName.trim(),
        brand: modelBrand.trim(),
      });
      showToast(t("saved"), "success");
      setModelName("");
      setModelBrand("");
    } catch (e: any) {
      showToast(e?.message || t("saveFailed"), "error");
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>{t("addData")}</Text>
        <View style={styles.topBarRight}>
          <Pressable
            onPress={() => router.push("/review")}
            hitSlop={12}
            style={styles.reviewBtn}
            testID="open-review"
          >
            <ClipboardText size={16} weight="bold" color={colors.brand} />
            <Text style={styles.reviewBtnText}>{t("reviewTitle")}</Text>
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={12} testID="add-close">
            <X size={24} weight="bold" color={colors.onSurface} />
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 120 }}
        >
          {/* ---- Compatibility group ---- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("addCompatGroup")}</Text>

            <Text style={styles.label}>{t("category")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {categories.map((c) => {
                const active = c.id === categoryId;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setCategoryId(c.id);
                      setIsCurve(false);
                    }}
                    style={[styles.chip, active && styles.chipActive]}
                    testID={`cat-chip-${c.id}`}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {lang === "hi" ? c.name_hi : c.name_en}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {hasCurve && (
              <Pressable
                onPress={() => setIsCurve((v) => !v)}
                style={[styles.curveToggle, isCurve && styles.curveToggleOn]}
                testID="curve-toggle"
              >
                <View
                  style={[styles.checkbox, isCurve && styles.checkboxOn]}
                >
                  {isCurve && (
                    <Check size={14} weight="bold" color={colors.onSuccess} />
                  )}
                </View>
                <Text style={styles.curveText}>
                  {lang === "hi" ? "कर्व ग्लास" : "Curve Glass"} ({t("subCategory")})
                </Text>
              </Pressable>
            )}

            <Text style={styles.label}>{t("brandGroup")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {brandGroups.map((b) => {
                const active = b === brandGroup;
                return (
                  <Pressable
                    key={b}
                    onPress={() => setBrandGroup(b)}
                    style={[styles.chip, active && styles.chipActive]}
                    testID={`brand-chip-${b}`}
                  >
                    <Text
                      style={[styles.chipText, active && styles.chipTextActive]}
                    >
                      {b}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>{t("models")}</Text>
            <Text style={styles.hint}>{t("modelsHint")}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={modelsText}
              onChangeText={setModelsText}
              placeholder={"Redmi Note 12\nPoco X5\n…"}
              placeholderTextColor={colors.muted}
              multiline
              testID="models-input"
            />

            <Text style={styles.label}>{t("sourceOptional")}</Text>
            <TextInput
              style={styles.input}
              value={source}
              onChangeText={setSource}
              placeholder={t("source")}
              placeholderTextColor={colors.muted}
              testID="source-input"
            />

            <Text style={styles.label}>{t("status")}</Text>
            <View style={styles.statusRow}>
              {(["verified", "unconfirmed"] as const).map((s) => {
                const active = status === s;
                return (
                  <Pressable
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[
                      styles.statusBtn,
                      active &&
                        (s === "verified"
                          ? styles.statusVerified
                          : styles.statusUnconfirmed),
                    ]}
                    testID={`status-${s}`}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        active && styles.statusTextActive,
                      ]}
                    >
                      {t(s)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
              onPress={saveGroup}
              disabled={createGroup.isPending}
              testID="save-group"
            >
              <Plus size={18} weight="bold" color={colors.onBrand} />
              <Text style={styles.saveText}>
                {createGroup.isPending ? "…" : t("save")}
              </Text>
            </Pressable>
          </View>

          {/* ---- Add model ---- */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("addModel")}</Text>

            <Text style={styles.label}>{t("modelName")}</Text>
            <TextInput
              style={styles.input}
              value={modelName}
              onChangeText={setModelName}
              placeholder={t("modelName")}
              placeholderTextColor={colors.muted}
              testID="model-name-input"
            />

            <Text style={styles.label}>{t("brand")}</Text>
            <TextInput
              style={styles.input}
              value={modelBrand}
              onChangeText={setModelBrand}
              placeholder={t("brand")}
              placeholderTextColor={colors.muted}
              testID="model-brand-input"
            />

            <Pressable
              style={({ pressed }) => [
                styles.saveBtnAlt,
                pressed && { opacity: 0.8 },
              ]}
              onPress={saveModel}
              disabled={createModel.isPending}
              testID="save-model"
            >
              <Text style={styles.saveTextAlt}>
                {createModel.isPending ? "…" : t("save")}
              </Text>
            </Pressable>
          </View>
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
  headerTitle: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.brandTertiary,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  reviewBtnText: {
    color: colors.brand,
    fontFamily: fonts.displayMedium,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.brand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  label: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 6,
  },
  hint: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    marginBottom: 6,
  },
  chipRow: { gap: 8, paddingVertical: 2, paddingRight: 4 },
  chip: {
    flexShrink: 0,
    height: 36,
    borderRadius: 999,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  chipTextActive: { color: colors.onBrand },
  curveToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderStrong,
  },
  curveToggleOn: { borderColor: colors.success },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.success, borderColor: colors.success },
  curveText: {
    color: colors.onSurface,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  input: {
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.onSurface,
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
  },
  textArea: { minHeight: 96, textAlignVertical: "top" },
  statusRow: { flexDirection: "row", gap: 10 },
  statusBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusVerified: {
    backgroundColor: "rgba(43,217,174,0.15)",
    borderColor: colors.success,
  },
  statusUnconfirmed: {
    backgroundColor: colors.surfaceTertiary,
    borderColor: colors.borderStrong,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  statusTextActive: { color: colors.onSurface },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.brand,
    borderRadius: 12,
    height: 52,
    marginTop: 20,
  },
  saveText: {
    color: colors.onBrand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  saveBtnAlt: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceTertiary,
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: 12,
    height: 50,
    marginTop: 20,
  },
  saveTextAlt: {
    color: colors.brand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
}));
