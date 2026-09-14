import { CheckCircle, PencilSimple } from "phosphor-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

import { CompatGroup } from "@/src/api";
import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { StatPill } from "@/src/components/StatPill";
import { VerifiedStamp } from "@/src/components/VerifiedStamp";
import { makeStyles, useTheme } from "@/src/theme";

type Props = {
  group: CompatGroup;
  highlighted?: boolean;
  onConfirm: (id: string) => void;
  onSuggest: (group: CompatGroup) => void;
  onLayout?: (id: string) => void;
};

export const CompatibilityCard = React.forwardRef<View, Props>(
  ({ group, highlighted, onConfirm, onSuggest, onLayout }, ref) => {
    const styles = useStyles();
    const { colors } = useTheme();
    const { t } = useI18n();

    return (
      <View
        ref={ref}
        onLayout={() => onLayout?.(group.id)}
        style={[styles.card, highlighted && styles.cardHighlight]}
        testID={`compat-card-${group.id}`}
      >
        <View style={styles.topRow}>
          <View style={styles.pills}>
            <StatPill value={group.models.length} label={t("modelsShort")} />
            <StatPill
              value={group.confirmCount}
              label={t("confirmsLabel")}
              tone="confirm"
            />
          </View>
          {group.status === "verified" ? (
            <VerifiedStamp testID={`verified-${group.id}`} />
          ) : (
            <View style={styles.unconfirmed}>
              <Text style={styles.unconfirmedText}>{t("unconfirmed")}</Text>
            </View>
          )}
        </View>

        <Text style={styles.models} testID={`models-${group.id}`}>
          {group.models.join("  =  ")}
        </Text>

        {group.source ? (
          <Text style={styles.source}>
            {t("source")}: <Text style={styles.sourceName}>{group.source}</Text>
          </Text>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.confirmBtn, pressed && styles.pressed]}
            onPress={() => onConfirm(group.id)}
            testID={`confirm-${group.id}`}
          >
            <CheckCircle size={18} weight="fill" color={colors.success} />
            <Text style={styles.confirmText}>
              {t("confirm")} · {group.confirmCount}
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.suggestBtn, pressed && styles.pressed]}
            onPress={() => onSuggest(group)}
            testID={`suggest-${group.id}`}
          >
            <PencilSimple size={16} weight="bold" color={colors.muted} />
            <Text style={styles.suggestText}>{t("suggestCorrection")}</Text>
          </Pressable>
        </View>
      </View>
    );
  },
);

CompatibilityCard.displayName = "CompatibilityCard";

const useStyles = makeStyles((colors) => ({
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 10,
  },
  cardHighlight: {
    borderColor: colors.brand,
    backgroundColor: colors.brandTertiary,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  pills: { flexDirection: "row", gap: 6, flexShrink: 1 },
  unconfirmed: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unconfirmedText: {
    color: colors.muted,
    fontFamily: fonts.displayMedium,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  models: {
    color: colors.onSurface,
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    lineHeight: 24,
  },
  source: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
  },
  sourceName: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyMedium,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmText: {
    color: colors.onSurface,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
  },
  suggestBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 40,
    paddingHorizontal: 8,
    flexShrink: 1,
  },
  suggestText: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 12,
  },
  pressed: { opacity: 0.7 },
}));
