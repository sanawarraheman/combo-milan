import { Translate } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export function Header() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { lang, toggle, t } = useI18n();

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={styles.mark}>
          <Text style={styles.markText}>CM</Text>
        </View>
        <View>
          <Text style={styles.wordmark}>COMBO MILAN</Text>
          <Text style={styles.tagline}>{t("tagline")}</Text>
        </View>
      </View>

      <Pressable
        onPress={toggle}
        style={({ pressed }) => [styles.langBtn, pressed && styles.pressed]}
        hitSlop={8}
        testID="language-toggle"
      >
        <Translate size={16} weight="bold" color={colors.brand} />
        <Text style={styles.langText}>{lang === "en" ? "EN" : "हि"}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flexShrink: 1 },
  mark: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  markText: {
    color: colors.onBrand,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  wordmark: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 20,
    letterSpacing: 1,
  },
  tagline: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
    marginTop: -1,
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 40,
  },
  pressed: { opacity: 0.6 },
  langText: {
    color: colors.onSurface,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },
}));
