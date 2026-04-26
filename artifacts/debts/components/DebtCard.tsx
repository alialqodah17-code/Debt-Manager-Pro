import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/contexts/SettingsContext";
import { formatAmount, formatDateShort } from "@/lib/format";
import type { Debt } from "@workspace/api-client-react";

interface Props {
  debt: Debt;
}

export function DebtCard({ debt }: Props) {
  const c = useColors();
  const { language, t, isRTL } = useSettings();
  const router = useRouter();

  const isOwedToMe = debt.direction === "owed_to_me";
  const accentColor = isOwedToMe ? c.success : c.destructive;
  const isSettled = debt.status === "settled";

  const progress = debt.amount > 0 ? debt.paidAmount / debt.amount : 0;

  const initials = debt.personName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  return (
    <Pressable
      onPress={() => router.push(`/debt/${debt.id}` as never)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: isOwedToMe ? c.accent + "55" : c.border,
          borderRadius: c.radius,
          opacity: pressed ? 0.85 : 1,
          shadowColor: isOwedToMe ? c.accent : "#000",
          shadowOpacity: isOwedToMe ? 0.12 : 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        },
      ]}
    >
      <View
        style={[
          styles.accentBar,
          {
            backgroundColor: accentColor,
            [isRTL ? "right" : "left"]: 0,
            borderTopStartRadius: c.radius,
            borderBottomStartRadius: c.radius,
          },
        ]}
      />
      <View style={[styles.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: accentColor + "1A",
              borderRadius: c.radius - 4,
              borderWidth: 1,
              borderColor: accentColor + "33",
            },
          ]}
        >
          <Text style={[styles.avatarText, { color: accentColor }]}>
            {initials || "?"}
          </Text>
        </View>
        <View style={{ flex: 1, marginInlineStart: 12 }}>
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                { color: c.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {debt.personName}
            </Text>
            {isSettled ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: c.success + "20" },
                ]}
              >
                <Feather name="check" size={12} color={c.success} />
                <Text style={[styles.badgeText, { color: c.success }]}>
                  {t("settled")}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.direction,
              {
                color: c.mutedForeground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {isOwedToMe ? t("owesYou") : t("youOwe")} ·{" "}
            {formatDateShort(debt.createdAt, language)}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.amounts,
          { flexDirection: isRTL ? "row-reverse" : "row" },
        ]}
      >
        <Text
          style={[
            styles.amount,
            { color: accentColor },
          ]}
        >
          {(isOwedToMe ? "+" : "−") +
            formatAmount(debt.remainingAmount, debt.currency, language)}
        </Text>
        {debt.paidAmount > 0 && !isSettled ? (
          <Text style={[styles.subAmount, { color: c.mutedForeground }]}>
            {t("paid")}{" "}
            {formatAmount(debt.paidAmount, debt.currency, language)}
          </Text>
        ) : null}
      </View>

      {!isSettled ? (
        <View style={[styles.progressTrack, { backgroundColor: c.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: accentColor,
                width: `${Math.min(100, Math.max(0, progress * 100))}%`,
              },
            ]}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
    overflow: "hidden",
    position: "relative",
  },
  accentBar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  direction: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginInlineStart: 8,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  amounts: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  amount: {
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: -0.7,
  },
  subAmount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
});
