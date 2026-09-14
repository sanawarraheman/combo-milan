import React from "react";
import { Text, View } from "react-native";

import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type Props = {
  value: number | string;
  label: string;
  tone?: "default" | "verified" | "confirm";
  testID?: string;
};

export function StatPill({ value, label, tone = "default", testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();

  const valueColor =
    tone === "verified"
      ? colors.success
      : tone === "confirm"
        ? colors.brand
        : colors.onSurface;

  return (
    <View style={styles.pill} testID={testID}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  value: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 13,
  },
  label: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
  },
}));
