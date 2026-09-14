// Central font-family names. Loaded in app/_layout.tsx via expo-font.
//
// - Oswald: condensed display font (headings, wordmark, numbers, buttons).
//   English-only usage (Oswald has no Devanagari glyphs).
// - NotoSans: body / UI text. Uses Noto Sans Devanagari which covers Latin AND
//   Devanagari, so Hindi (हिन्दी) renders correctly everywhere.

export const fonts = {
  displayBold: "Oswald-Bold",
  displaySemiBold: "Oswald-SemiBold",
  displayMedium: "Oswald-Medium",
  bodyRegular: "NotoSans-Regular",
  bodyMedium: "NotoSans-Medium",
  bodyBold: "NotoSans-Bold",
};
