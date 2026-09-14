import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompatGroup, useCreateSubmission } from "@/src/api";
import { useToast } from "@/src/components/Toast";
import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

const CorrectionContext = createContext<{
  openCorrection: (group: CompatGroup, categoryLabel: string) => void;
} | null>(null);

export function CorrectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const createSubmission = useCreateSubmission();

  const [modelName, setModelName] = useState("");
  const [category, setCategory] = useState("");
  const [claimed, setClaimed] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(false);

  const openCorrection = useCallback(
    (group: CompatGroup, categoryLabel: string) => {
      setModelName(group.models[0] ?? "");
      setCategory(categoryLabel);
      setClaimed(group.models.join(", "));
      setNotes("");
      setError(false);
      sheetRef.current?.present();
    },
    [],
  );

  const submit = async () => {
    if (!modelName.trim() || !claimed.trim()) {
      setError(true);
      return;
    }
    try {
      await createSubmission.mutateAsync({
        modelName,
        category,
        claimedCompatibleModels: claimed,
        notes,
      });
      sheetRef.current?.dismiss();
      showToast(t("submitted"), "success");
    } catch {
      showToast(t("saveFailed"), "error");
    }
  };

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
      />
    ),
    [],
  );

  const value = useMemo(() => ({ openCorrection }), [openCorrection]);

  return (
    <CorrectionContext.Provider value={value}>
      {children}
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.surfaceSecondary }}
        handleIndicatorStyle={{ backgroundColor: colors.borderStrong }}
      >
        <BottomSheetScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <Text style={styles.title}>{t("correctionTitle")}</Text>

          <Text style={styles.label}>{t("modelName")}</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={modelName}
            onChangeText={setModelName}
            placeholder={t("modelName")}
            placeholderTextColor={colors.muted}
            testID="correction-model"
          />

          <Text style={styles.label}>{t("category")}</Text>
          <BottomSheetTextInput
            style={styles.input}
            value={category}
            onChangeText={setCategory}
            placeholder={t("category")}
            placeholderTextColor={colors.muted}
            testID="correction-category"
          />

          <Text style={styles.label}>{t("claimedModels")}</Text>
          <BottomSheetTextInput
            style={[styles.input, styles.textArea]}
            value={claimed}
            onChangeText={setClaimed}
            placeholder={t("claimedModels")}
            placeholderTextColor={colors.muted}
            multiline
            testID="correction-claimed"
          />

          <Text style={styles.label}>{t("notes")}</Text>
          <BottomSheetTextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t("notes")}
            placeholderTextColor={colors.muted}
            multiline
            testID="correction-notes"
          />

          {error && <Text style={styles.error}>{t("required")}</Text>}

          <Pressable
            style={({ pressed }) => [styles.submit, pressed && { opacity: 0.8 }]}
            onPress={submit}
            disabled={createSubmission.isPending}
            testID="correction-submit"
          >
            <Text style={styles.submitText}>
              {createSubmission.isPending ? "…" : t("submit")}
            </Text>
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </CorrectionContext.Provider>
  );
}

export function useCorrection() {
  const ctx = useContext(CorrectionContext);
  if (!ctx)
    throw new Error("useCorrection must be used within CorrectionProvider");
  return ctx;
}

const useStyles = makeStyles((colors) => ({
  content: { padding: 20, gap: 6 },
  title: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    marginTop: 10,
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
    marginTop: 4,
  },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  error: {
    color: colors.error,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    marginTop: 10,
  },
  submit: {
    backgroundColor: colors.brand,
    borderRadius: 12,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  submitText: {
    color: colors.onBrand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 0.5,
  },
}));
