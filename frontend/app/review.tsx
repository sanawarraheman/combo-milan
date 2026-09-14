import { useRouter } from "expo-router";
import { Check, ClipboardText, X } from "phosphor-react-native";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Submission,
  useReviewSubmission,
  useSubmissions,
} from "@/src/api";
import { useToast } from "@/src/components/Toast";
import { fonts } from "@/src/fonts";
import { useI18n } from "@/src/i18n";
import { makeStyles, useTheme } from "@/src/theme";

type Filter = "pending" | "approved" | "rejected";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function ReviewSubmissions() {
  const insets = useSafeAreaInsets();
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useI18n();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: submissions = [], isLoading, isError, refetch, isRefetching } =
    useSubmissions();
  const review = useReviewSubmission();

  const [filter, setFilter] = useState<Filter>("pending");

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { pending: 0, approved: 0, rejected: 0 };
    submissions.forEach((s) => {
      if (s.status in c) c[s.status as Filter] += 1;
    });
    return c;
  }, [submissions]);

  const list = submissions.filter((s) => s.status === filter);

  const onReview = async (s: Submission, action: "approve" | "reject") => {
    try {
      await review.mutateAsync({ id: s.id, action });
      showToast(t("saved"), "success");
    } catch (e: any) {
      showToast(e?.message || t("saveFailed"), "error");
    }
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "pending", label: t("pendingLabel") },
    { key: "approved", label: t("approvedLabel") },
    { key: "rejected", label: t("rejectedLabel") },
  ];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.titleRow}>
          <ClipboardText size={22} weight="bold" color={colors.brand} />
          <Text style={styles.headerTitle}>{t("reviewTitle")}</Text>
        </View>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          testID="review-close"
        >
          <X size={24} weight="bold" color={colors.onSurface} />
        </Pressable>
      </View>

      <View style={styles.chipRow}>
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
              testID={`filter-${f.key}`}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.chipCount, active && styles.chipCountActive]}>
                <Text
                  style={[
                    styles.chipCountText,
                    active && styles.chipCountTextActive,
                  ]}
                >
                  {counts[f.key]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Failed to load</Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => refetch()}
            testID="review-retry"
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
            gap: 10,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.brand}
            />
          }
        >
          {list.length === 0 ? (
            <Text style={styles.emptyText}>{t("noSubmissions")}</Text>
          ) : (
            list.map((s) => (
              <View key={s.id} style={styles.card} testID={`sub-${s.id}`}>
                <View style={styles.cardTop}>
                  <Text style={styles.modelName}>{s.modelName}</Text>
                  {s.category ? (
                    <View style={styles.catPill}>
                      <Text style={styles.catPillText}>{s.category}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.claimedLabel}>
                  {t("claimedLabel")}:{" "}
                  <Text style={styles.claimedText}>
                    {s.claimedCompatibleModels}
                  </Text>
                </Text>

                {s.notes ? (
                  <Text style={styles.notes}>{s.notes}</Text>
                ) : null}

                <Text style={styles.date}>{formatDate(s.created_at)}</Text>

                {s.status === "pending" && (
                  <View style={styles.actionRow}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.approveBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => onReview(s, "approve")}
                      disabled={review.isPending}
                      testID={`approve-${s.id}`}
                    >
                      <Check size={16} weight="bold" color={colors.success} />
                      <Text style={styles.approveText}>{t("approve")}</Text>
                    </Pressable>
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtn,
                        styles.rejectBtn,
                        pressed && { opacity: 0.8 },
                      ]}
                      onPress={() => onReview(s, "reject")}
                      disabled={review.isPending}
                      testID={`reject-${s.id}`}
                    >
                      <X size={16} weight="bold" color={colors.error} />
                      <Text style={styles.rejectText}>{t("reject")}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.surface },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: {
    color: colors.onSurface,
    fontFamily: fonts.displayBold,
    fontSize: 22,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  chip: {
    flex: 1,
    height: 40,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.displayMedium,
    fontSize: 13,
  },
  chipTextActive: { color: colors.onBrand },
  chipCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 999,
    backgroundColor: colors.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  chipCountActive: { backgroundColor: "rgba(0,0,0,0.25)" },
  chipCountText: {
    color: colors.muted,
    fontFamily: fonts.displaySemiBold,
    fontSize: 12,
  },
  chipCountTextActive: { color: colors.onBrand },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 32,
  },
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
  card: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modelName: {
    flex: 1,
    color: colors.onSurface,
    fontFamily: fonts.displaySemiBold,
    fontSize: 16,
    letterSpacing: 0.3,
  },
  catPill: {
    backgroundColor: colors.brandTertiary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  catPillText: {
    color: colors.brand,
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
  },
  claimedLabel: {
    color: colors.muted,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  claimedText: { color: colors.onSurface },
  notes: {
    color: colors.onSurfaceSecondary,
    fontFamily: fonts.bodyRegular,
    fontSize: 13,
    fontStyle: "italic",
  },
  date: {
    color: colors.muted,
    fontFamily: fonts.bodyRegular,
    fontSize: 11,
  },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
  },
  approveBtn: {
    backgroundColor: "rgba(43,217,174,0.12)",
    borderColor: colors.success,
  },
  approveText: {
    color: colors.success,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },
  rejectBtn: {
    backgroundColor: "rgba(255,92,92,0.10)",
    borderColor: colors.error,
  },
  rejectText: {
    color: colors.error,
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
  },
}));
