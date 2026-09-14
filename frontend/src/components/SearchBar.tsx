import { MagnifyingGlass, X } from "phosphor-react-native";
import React from "react";
import { Pressable, TextInput, View } from "react-native";

import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

type Props = {
  value: string;
  onChangeText: (v: string) => void;
  onFocus?: () => void;
};

export function SearchBar({ value, onChangeText, onFocus }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <View style={styles.wrap}>
      <MagnifyingGlass size={18} weight="bold" color={colors.muted} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={t("searchPlaceholder")}
        placeholderTextColor={colors.muted}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        testID="search-input"
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText("")}
          hitSlop={10}
          testID="search-clear"
        >
          <X size={18} weight="bold" color={colors.muted} />
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  input: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: fonts.bodyRegular,
    fontSize: 15,
    paddingVertical: 0,
  },
}));
