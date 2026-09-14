import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
  CaretDown,
  CaretRight,
  MagnifyingGlass,
  SealCheck,
} from "phosphor-react-native";
import React, { useMemo, useRef, useState } from "react";
import {
  findNodeHandle,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Category,
  CompatGroup,
  useConfirmGroup,
  useGroups,
  useMeta,
} from "@/src/api";
import { ActionRow } from "@/src/components/ActionRow";
import { CompatibilityCard } from "@/src/components/CompatibilityCard";
import { Header } from "@/src/components/Header";
import { SearchBar } from "@/src/components/SearchBar";
import { StatPill } from "@/src/components/StatPill";
import { useCorrection } from "@/src/components/SuggestCorrectionSheet";
import { useToast } from "@/src/components/Toast";
import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

export default function Home() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t, lang } = useI18n();

  const { data: meta } = useMeta();
  const { data: groups = [], isLoading, isError, refetch } = useGroups();
  const confirmGroup = useConfirmGroup();
  const { openCorrection } = useCorrection();
  const { showToast } = useToast();

  const [query, setQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<Record<string, boolean>>({});
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const pendingScroll = useRef<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);
  const cardRefs = useRef<Record<string, View | null>>({});

  const categories = meta?.categories ?? [];
  const brandOrder = meta?.brandGroups ?? [];
  const catById = useMemo(() => {
    const m: Record<string, Category> = {};
    categories.forEach((c) => (m[c.id] = c));
    return m;
  }, [categories]);

  const catLabel = (c?: Category) =>
    !c ? "" : lang === "hi" ? c.name_hi : c.name_en;
  const subLabel = (catId: string, subKey: string | null) => {
    if (!subKey) return "";
    const sub = catById[catId]?.subCategories.find((s) => s.key === subKey);
    return sub ? (lang === "hi" ? sub.name_hi : sub.name_en) : subKey;
  };

  const brandKey = (g: CompatGroup) =>
    `${g.categoryId}|${g.subCategory ?? "main"}|${g.brandGroup}`;

  // Highlight the matched portion of a text in the accent color
  const highlightText = (text: string, style: object) => {
    if (!q) return <Text style={style}>{text}</Text>;
    const lower = text.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return <Text style={style}>{text}</Text>;
    return (
      <Text style={style}>
        {text.slice(0, idx)}
        <Text style={styles.match}>{text.slice(idx, idx + q.length)}</Text>
        {text.slice(idx + q.length)}
      </Text>
    );
  };

  const verifiedCount = groups.filter((g) => g.status === "verified").length;

  // -------- search --------
  const q = query.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!q) return [];
    return groups.filter((g) => {
      const cat = catById[g.categoryId];
      const hay = [
        g.models.join(" "),
        g.brandGroup,
        g.source ?? "",
        cat?.name_en ?? "",
        cat?.name_hi ?? "",
        subLabel(g.categoryId, g.subCategory),
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, groups, catById]);

  const onSelectResult = (g: CompatGroup) => {
    setQuery("");
    Keyboard.dismiss();
    setExpandedCategory(g.categoryId);
    if (g.subCategory) {
      setOpenSub((s) => ({ ...s, [`${g.categoryId}:${g.subCategory}`]: true }));
    }
    setExpandedBrand(brandKey(g));
    setHighlightId(g.id);
    pendingScroll.current = g.id;
    setTimeout(() => setHighlightId(null), 2600);
  };

  const handleCardLayout = (id: string) => {
    if (pendingScroll.current !== id) return;
    const node = cardRefs.current[id];
    const parent = contentRef.current;
    if (node && parent) {
      const handle = findNodeHandle(parent);
      if (handle != null) {
        // @ts-ignore measureLayout exists on host views
        node.measureLayout(
          handle,
          (_x: number, y: number) => {
            scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
          },
          () => {},
        );
      }
    }
    pendingScroll.current = null;
  };

  // -------- export --------
  const handleExport = async () => {
    if (!groups.length) {
      showToast(t("nothingToExport"), "info");
      return;
    }
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "Category",
      "SubCategory",
      "BrandGroup",
      "Models",
      "Source",
      "Status",
      "Confirms",
    ].join(",");
    const rows = groups.map((g) =>
      [
        esc(catById[g.categoryId]?.name_en ?? g.categoryId),
        esc(subLabel(g.categoryId, g.subCategory)),
        esc(g.brandGroup),
        esc(g.models.join(" = ")),
        esc(g.source ?? ""),
        esc(g.status),
        String(g.confirmCount),
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");

    try {
      if (Platform.OS === "web") {
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "combo-milan.csv";
        a.click();
        URL.revokeObjectURL(url);
        showToast(t("exported"), "success");
        return;
      }
      const file = new File(Paths.cache, "combo-milan.csv");
      try {
        file.create({ overwrite: true });
      } catch {
        /* already exists */
      }
      await file.write(csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "text/csv",
          dialogTitle: "Combo Milan export",
        });
      }
      showToast(t("exported"), "success");
    } catch {
      showToast(t("saveFailed"), "error");
    }
  };

  const onConfirm = (id: string) => confirmGroup.mutate(id);
  const onSuggest = (g: CompatGroup) =>
    openCorrection(g, catLabel(catById[g.categoryId]));

  // -------- brand grouping helper --------
  const buildBrandGroups = (list: CompatGroup[]) => {
    const map: Record<string, CompatGroup[]> = {};
    list.forEach((g) => {
      (map[g.brandGroup] ||= []).push(g);
    });
    return brandOrder
      .filter((b) => map[b]?.length)
      .map((b) => ({ brand: b, items: map[b] }));
  };

  const renderCard = (g: CompatGroup) => (
    <CompatibilityCard
      key={g.id}
      group={g}
      highlighted={highlightId === g.id}
      onConfirm={onConfirm}
      onSuggest={onSuggest}
      onLayout={handleCardLayout}
      ref={(el) => {
        cardRefs.current[g.id] = el;
      }}
    />
  );

  const renderBrandGroups = (
    catId: string,
    sub: string | null,
    list: CompatGroup[],
  ) => {
    const bgroups = buildBrandGroups(list);
    if (!bgroups.length) return null;
    return bgroups.map(({ brand, items }) => {
      const key = `${catId}|${sub ?? "main"}|${brand}`;
      const open = expandedBrand === key;
      return (
        <View key={key} style={styles.brandBlock}>
          <Pressable
            style={({ pressed }) => [styles.brandRow, pressed && styles.pressed]}
            onPress={() => setExpandedBrand(open ? null : key)}
            testID={`brand-${key}`}
          >
            <View style={styles.brandAvatar}>
              <Text style={styles.brandAvatarText}>{brand[0]}</Text>
            </View>
            <Text style={styles.brandName}>
              {brand}
            </Text>
            <StatPill value={items.length} label={t("groupsLabel")} />
            {open ? (
              <CaretDown size={16} weight="bold" color={colors.muted} />
            ) : (
              <CaretRight size={16} weight="bold" color={colors.muted} />
            )}
          </Pressable>
          {open && (
            <View style={styles.cardList}>{items.map(renderCard)}</View>
          )}
        </View>
      );
    });
  };

  const renderCategory = (cat: Category) => {
    const catGroups = groups.filter((g) => g.categoryId === cat.id);
    const mainGroups = catGroups.filter((g) => !g.subCategory);
    const open = expandedCategory === cat.id;
    return (
      <View key={cat.id} style={styles.categoryBlock}>
        <Pressable
          style={({ pressed }) => [styles.categoryRow, pressed && styles.pressed]}
          onPress={() => setExpandedCategory(open ? null : cat.id)}
          testID={`category-${cat.id}`}
        >
          {open ? (
            <CaretDown size={18} weight="bold" color={colors.brand} />
          ) : (
            <CaretRight size={18} weight="bold" color={colors.brand} />
          )}
          <Text style={styles.categoryName} numberOfLines={2}>
            {catLabel(cat)}
          </Text>
          <View style={styles.countPill}>
            <Text style={styles.countText}>{catGroups.length}</Text>
          </View>
        </Pressable>

        {open && (
          <View style={styles.categoryBody}>
            {catGroups.length === 0 ? (
              <Text style={styles.emptyText}>{t("noData")}</Text>
            ) : (
              <>
                {cat.subCategories.length > 0 ? (
                  <View style={styles.subBlock}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.subRow,
                        styles.subRowNormal,
                        pressed && styles.pressed,
                      ]}
                      onPress={() =>
                        setOpenSub((s) => ({
                          ...s,
                          [`${cat.id}:main`]: s[`${cat.id}:main`] === false,
                        }))
                      }
                      testID={`sub-${cat.id}:main`}
                    >
                      {openSub[`${cat.id}:main`] !== false ? (
                        <CaretDown
                          size={15}
                          weight="bold"
                          color={colors.brand}
                        />
                      ) : (
                        <CaretRight
                          size={15}
                          weight="bold"
                          color={colors.brand}
                        />
                      )}
                      <Text style={styles.subNameNormal}>
                        {t("normalGlass")}
                      </Text>
                      <View style={styles.countPill}>
                        <Text style={styles.countText}>
                          {mainGroups.length}
                        </Text>
                      </View>
                    </Pressable>
                    {openSub[`${cat.id}:main`] !== false && (
                      <View style={styles.subBody}>
                        {mainGroups.length === 0 ? (
                          <Text style={styles.emptyText}>{t("noData")}</Text>
                        ) : (
                          renderBrandGroups(cat.id, null, mainGroups)
                        )}
                      </View>
                    )}
                  </View>
                ) : (
                  renderBrandGroups(cat.id, null, mainGroups)
                )}
                {cat.subCategories.map((sub) => {
                  const subGroups = catGroups.filter(
                    (g) => g.subCategory === sub.key,
                  );
                  const subOpenKey = `${cat.id}:${sub.key}`;
                  const subOpen = !!openSub[subOpenKey];
                  return (
                    <View key={sub.key} style={styles.subBlock}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.subRow,
                          pressed && styles.pressed,
                        ]}
                        onPress={() =>
                          setOpenSub((s) => ({
                            ...s,
                            [subOpenKey]: !subOpen,
                          }))
                        }
                        testID={`sub-${subOpenKey}`}
                      >
                        {subOpen ? (
                          <CaretDown
                            size={15}
                            weight="bold"
                            color={colors.success}
                          />
                        ) : (
                          <CaretRight
                            size={15}
                            weight="bold"
                            color={colors.success}
                          />
                        )}
                        <Text style={styles.subName}>
                          {lang === "hi" ? sub.name_hi : sub.name_en}
                        </Text>
                        <View style={styles.subCountPill}>
                          <Text style={styles.subCountText}>
                            {subGroups.length}
                          </Text>
                        </View>
                      </Pressable>
                      {subOpen && (
                        <View style={styles.subBody}>
                          {subGroups.length === 0 ? (
                            <Text style={styles.emptyText}>{t("noData")}</Text>
                          ) : (
                            renderBrandGroups(cat.id, sub.key, subGroups)
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <Header />
      <ActionRow onExport={handleExport} />
      <View style={styles.searchWrap}>
        <SearchBar value={query} onChangeText={setQuery} />
      </View>

      <View style={styles.contentArea}>
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        >
          <View ref={contentRef}>
            <View style={styles.summaryRow}>
              <Text style={styles.sectionTitle}>{t("categories")}</Text>
              <View style={styles.summaryPills}>
                <StatPill value={groups.length} label={t("groupsLabel")} />
                <StatPill
                  value={verifiedCount}
                  label={t("verifiedLabel")}
                  tone="verified"
                />
              </View>
            </View>

            {isLoading ? (
              <View style={styles.skeletonWrap}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.skeleton} />
                ))}
              </View>
            ) : isError ? (
              <View style={styles.errorWrap}>
                <Text style={styles.emptyText}>Failed to load</Text>
                <Pressable
                  style={styles.retryBtn}
                  onPress={() => refetch()}
                  testID="retry-btn"
                >
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.categoryList}>
                {categories.map(renderCategory)}
              </View>
            )}
          </View>
        </ScrollView>

        {q.length > 0 && (
          <View style={styles.searchPanel} testID="search-panel">
            <View style={styles.searchPanelHeader}>
              <MagnifyingGlass size={16} weight="bold" color={colors.brand} />
              <Text style={styles.searchPanelTitle}>
                {t("searchResults")} · {searchResults.length}
              </Text>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            >
              {searchResults.length === 0 ? (
                <Text style={styles.emptyText}>{t("noResults")}</Text>
              ) : (
                searchResults.map((g) => (
                  <Pressable
                    key={g.id}
                    style={({ pressed }) => [
                      styles.resultRow,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => onSelectResult(g)}
                    testID={`result-${g.id}`}
                  >
                    <View style={styles.resultTop}>
                      <View style={{ flex: 1 }}>
                        {highlightText(
                          `${catLabel(catById[g.categoryId])}${
                            g.subCategory
                              ? ` · ${subLabel(g.categoryId, g.subCategory)}`
                              : ""
                          } · ${g.brandGroup}`,
                          styles.resultMeta,
                        )}
                      </View>
                      {g.status === "verified" && (
                        <SealCheck
                          size={16}
                          weight="fill"
                          color={colors.success}
                        />
                      )}
                    </View>
                    {highlightText(
                      g.models.join("  =  "),
                      styles.resultModels,
                    )}
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  contentArea: { flex: 1, position: "relative" },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  summaryPills: { flexDirection: "row", gap: 6 },

  categoryList: { paddingHorizontal: 16, gap: 10 },
  categoryBlock: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    minHeight: 56,
    paddingVertical: 10,
  },
  categoryName: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  countPill: {
    minWidth: 30,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    color: colors.brand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 13,
  },
  categoryBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingTop: 10,
  },

  brandBlock: { gap: 8 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceTertiary,
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 52,
    paddingVertical: 8,
  },
  brandAvatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  brandAvatarText: {
    color: colors.brand,
    fontFamily: fonts.displayBold,
    fontSize: 16,
  },
  brandName: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
  },
  cardList: { gap: 10, paddingLeft: 6 },

  subBlock: { gap: 8, marginTop: 2 },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.success,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 46,
  },
  subName: {
    flex: 1,
    color: colors.success,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  subRowNormal: {
    borderColor: colors.brand,
  },
  subNameNormal: {
    flex: 1,
    color: colors.brand,
    fontFamily: fonts.displayMedium,
    fontSize: 14,
    letterSpacing: 0.3,
  },
  subCountPill: {
    minWidth: 26,
    height: 24,
    borderRadius: 999,
    backgroundColor: "rgba(43,217,174,0.15)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  subCountText: {
    color: colors.success,
    fontFamily: fonts.displaySemiBold,
    fontSize: 12,
  },
  subBody: { gap: 8, paddingLeft: 6 },

  emptyText: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    paddingVertical: 8,
  },

  skeletonWrap: { paddingHorizontal: 16, gap: 10 },
  skeleton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceSecondary,
  },
  errorWrap: { alignItems: "center", padding: 24, gap: 12 },
  retryBtn: {
    backgroundColor: colors.brand,
    borderRadius: 10,
    paddingHorizontal: 20,
    height: 44,
    justifyContent: "center",
  },
  retryText: {
    color: colors.onBrand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },

  searchPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
  },
  searchPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  searchPanelTitle: {
    color: colors.brand,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  resultRow: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
    gap: 6,
  },
  resultTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  resultMeta: {
    flex: 1,
    color: colors.brand,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
  },
  resultModels: {
    color: colors.onSurface,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
  },
  match: {
    color: colors.brand,
    fontFamily: fonts.bodyBold,
  },
  pressed: { opacity: 0.7 },
}));
