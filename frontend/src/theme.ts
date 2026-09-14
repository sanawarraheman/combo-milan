// Design tokens for Combo Milan. Dark-first utility theme.
//
// The keys match the "color" block of /app/design_guidelines.json.
// Use makeStyles() for StyleSheets and useTheme().colors for color props.
// Never write color literals in components (except colors that must stay
// identical across light/dark, e.g. third-party brand colors).

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const dark = {
  // Surfaces
  surface: "#14171c",
  onSurface: "#f5f6f8",
  surfaceSecondary: "#1f232a",
  onSurfaceSecondary: "#e1e4e8",
  surfaceTertiary: "#2a2f38",
  onSurfaceTertiary: "#d1d5db",
  surfaceInverse: "#ffffff",
  onSurfaceInverse: "#14171c",
  muted: "#8b94a0",

  // Brand (amber/orange)
  brand: "#f5a623",
  onBrand: "#14171c",
  brandPrimary: "#f5a623",
  onBrandPrimary: "#14171c",
  brandSecondary: "#d98f1c",
  onBrandSecondary: "#14171c",
  brandTertiary: "#453112",
  onBrandTertiary: "#f5a623",

  // Status
  success: "#2bd9ae",
  onSuccess: "#092f25",
  warning: "#f5a623",
  onWarning: "#14171c",
  error: "#ef4444",
  onError: "#ffffff",
  info: "#3b82f6",
  onInfo: "#ffffff",

  // Lines
  border: "#2c323b",
  borderStrong: "#3b434f",
  divider: "#22262d",
};

export type ThemeColors = typeof dark;

export const defaultScheme = "dark" satisfies ColorScheme;

export const themes: { light?: ThemeColors; dark: ThemeColors } = { dark };

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme);
}

// This app ships dark only — force dark on native chrome.
setColorScheme?.(defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  // Only "dark" exists; always resolve to dark.
  const scheme: ColorScheme = "dark";
  return { scheme, colors: themes.dark };
}

export function makeStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
