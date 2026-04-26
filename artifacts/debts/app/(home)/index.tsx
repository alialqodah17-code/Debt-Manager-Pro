import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { DebtCard } from "@/components/DebtCard";
import { Screen } from "@/components/Screen";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { formatCompactAmount } from "@/lib/format";
import { useGetSummary } from "@workspace/api-client-react";

export default function Dashboard() {
  const c = useColors();
  const { t, language, isRTL, currency } = useSettings();
  const router = useRouter();
  const { user } = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch, error } = useGetSummary();

  // First-login currency picker
  useEffect(() => {
    if (!user) return;
    const seenKey = `diyoun.onboarded.${user.id}`;
    let cancelled = false;
    (async () => {
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const seen = await AsyncStorage.getItem(seenKey);
      if (cancelled) return;
      if (!seen) {
        router.push("/(home)/onboarding");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, router]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const displayCurrency = data?.currency ?? currency;
  const owed = data?.totalOwedToMe ?? 0;
  const iOwe = data?.totalIOwe ?? 0;
  const net = data?.netBalance ?? 0;
  const netColor =
    net > 0 ? c.success : net < 0 ? c.destructive : c.foreground;

  const greeting = (() => {
    const name = user?.firstName || user?.username || t("you");
    return language === "ar" ? `مرحباً، ${name}` : `Hello, ${name}`;
  })();

  return (
    <Screen noBottomInset>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={onRefresh}
            tintColor={c.primary}
          />
        }
      >
        <View
          style={[
            styles.header,
            { alignItems: isRTL ? "flex-end" : "flex-start" },
          ]}
        >
          <Text
            style={[
              styles.greeting,
              { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {greeting}
          </Text>
          <Text
            style={[
              styles.title,
              { color: c.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("dashboard")}
          </Text>
        </View>

        <View
          style={[
            styles.netCard,
            {
              backgroundColor: c.foreground,
              borderRadius: c.radius,
            },
          ]}
        >
          <Text
            style={[
              styles.netLabel,
              {
                color: c.background,
                opacity: 0.7,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("netBalance")}
          </Text>
          <Text
            style={[
              styles.netValue,
              {
                color:
                  net > 0
                    ? c.accent
                    : net < 0
                      ? c.destructive
                      : c.background,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {(net > 0 ? "+" : net < 0 ? "−" : "") +
              formatCompactAmount(Math.abs(net), displayCurrency, language)}
          </Text>
          <View style={[styles.netDivider, { backgroundColor: c.background, opacity: 0.1 }]} />
          <View
            style={[
              styles.netRow,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.netSubLabel, { color: c.background, opacity: 0.6 }]}>
                {t("openDebts")}
              </Text>
              <Text style={[styles.netSubValue, { color: c.background }]}>
                {data?.openDebtsCount ?? 0}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.netSubLabel, { color: c.background, opacity: 0.6 }]}>
                {t("settledDebts")}
              </Text>
              <Text style={[styles.netSubValue, { color: c.background }]}>
                {data?.settledDebtsCount ?? 0}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.statsRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <StatCard
            icon="arrow-down-left"
            label={t("totalOwedToMe")}
            value={formatCompactAmount(owed, displayCurrency, language)}
            color={c.success}
          />
          <StatCard
            icon="arrow-up-right"
            label={t("totalIOwe")}
            value={formatCompactAmount(iOwe, displayCurrency, language)}
            color={c.destructive}
          />
        </View>

        <View
          style={[
            styles.sectionHeader,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: c.foreground }]}>
            {t("recentActivity")}
          </Text>
          <Pressable onPress={() => router.push("/(home)/list")}>
            <Text style={[styles.sectionLink, { color: c.primary }]}>
              {t("all")}
            </Text>
          </Pressable>
        </View>

        {error ? (
          <Text style={[styles.error, { color: c.destructive }]}>
            {t("error")}
          </Text>
        ) : null}

        {isLoading && !data ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
        ) : !data || data.recentDebts.length === 0 ? (
          <View
            style={[
              styles.empty,
              { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius },
            ]}
          >
            <View
              style={[
                styles.emptyIcon,
                { backgroundColor: c.primary + "1A", borderRadius: 999 },
              ]}
            >
              <Feather name="inbox" size={28} color={c.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>
              {t("noDebtsYet")}
            </Text>
            <Text style={[styles.emptyMsg, { color: c.mutedForeground }]}>
              {t("addFirstDebt")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {data.recentDebts.map((d) => (
              <DebtCard key={d.id} debt={d} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  const c = useColors();
  const { isRTL } = useSettings();
  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderRadius: c.radius,
          alignItems: isRTL ? "flex-end" : "flex-start",
        },
      ]}
    >
      <View
        style={[
          styles.statIcon,
          { backgroundColor: color + "1A", borderRadius: 999 },
        ]}
      >
        <Feather name={icon} size={16} color={color} />
      </View>
      <Text
        style={[
          styles.statLabel,
          { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.statValue,
          { color: c.foreground, textAlign: isRTL ? "right" : "left" },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    gap: 4,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  netCard: {
    padding: 20,
    gap: 8,
  },
  netLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  netValue: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginTop: 4,
  },
  netDivider: {
    height: 1,
    marginVertical: 12,
  },
  netRow: {
    flexDirection: "row",
    gap: 16,
  },
  netSubLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  netSubValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  statValue: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  sectionLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    padding: 32,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  emptyMsg: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  error: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
