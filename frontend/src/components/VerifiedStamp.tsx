import { SealCheck } from "phosphor-react-native";
import React from "react";
import { Text, View } from "react-native";

import { fonts } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

export function VerifiedStamp({ testID }: { testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.stamp} testID={testID}>
      <SealCheck size={16} weight="fill" color={colors.success} />
      <Text style={styles.text}>VERIFIED</Text>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  stamp: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.success,
    borderStyle: "dashed",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    transform: [{ rotate: "-7deg" }],
    backgroundColor: "rgba(43,217,174,0.08)",
  },
  text: {
    color: colors.success,
    fontFamily: fonts.displayBold,
    fontSize: 12,
    letterSpacing: 1,
  },
}));
