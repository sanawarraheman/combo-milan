import { useRouter } from "expo-router";
import { Calculator, Plus, Table } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export function ActionRow({ onExport }: { onExport: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={() => router.push("/calculator")}
        testID="action-calculator"
      >
        <Calculator size={18} weight="bold" color={colors.brand} />
        <Text style={styles.label} numberOfLines={1}>
          {t("calculator")}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}
        onPress={onExport}
        testID="action-export"
      >
        <Table size={18} weight="bold" color={colors.brand} />
        <Text style={styles.label} numberOfLines={1}>
          {t("exportExcel")}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styles.btnPrimary,
          pressed && styles.pressed,
        ]}
        onPress={() => router.push("/admin-unlock")}
        testID="action-add-data"
      >
        <Plus size={18} weight="bold" color={colors.onBrand} />
        <Text style={[styles.label, styles.labelPrimary]} numberOfLines={1}>
          {t("addData")}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  row: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  btn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 6,
  },
  btnPrimary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  pressed: { opacity: 0.7 },
  label: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.displayMedium,
    fontSize: 13,
    letterSpacing: 0.3,
  },
  labelPrimary: { color: colors.onBrand },
}));
