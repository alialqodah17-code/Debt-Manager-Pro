import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
import { TextField } from "@/components/TextField";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { useListDebts } from "@workspace/api-client-react";

type Filter = "all" | "owed_to_me" | "i_owe";
type StatusFilter = "all" | "open" | "settled";

export default function DebtsList() {
  const c = useColors();
  const { t, isRTL } = useSettings();
  const [direction, setDirection] = useState<Filter>("all");
  const [status, setStatus] = useState<StatusFilter>("open");
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useListDebts({
    direction,
    status,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (d) =>
        d.personName.toLowerCase().includes(q) ||
        (d.note ?? "").toLowerCase().includes(q),
    );
  }, [data, query]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Screen noBottomInset>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={c.primary}
          />
        }
      >
        <Text
          style={[
            styles.title,
            { color: c.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("debts")}
        </Text>

        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchPerson")}
          rightAdornment={
            <Feather name="search" size={18} color={c.mutedForeground} />
          }
        />

        <View
          style={[
            styles.chipsRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Chip
            label={t("filterAll")}
            active={direction === "all"}
            onPress={() => setDirection("all")}
          />
          <Chip
            label={t("owedToMeShort")}
            active={direction === "owed_to_me"}
            onPress={() => setDirection("owed_to_me")}
          />
          <Chip
            label={t("iOweShort")}
            active={direction === "i_owe"}
            onPress={() => setDirection("i_owe")}
          />
        </View>
        <View
          style={[
            styles.chipsRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Chip
            label={t("filterOpen")}
            active={status === "open"}
            onPress={() => setStatus("open")}
            small
          />
          <Chip
            label={t("filterSettled")}
            active={status === "settled"}
            onPress={() => setStatus("settled")}
            small
          />
          <Chip
            label={t("all")}
            active={status === "all"}
            onPress={() => setStatus("all")}
            small
          />
        </View>

        {isLoading && !data ? (
          <ActivityIndicator color={c.primary} style={{ marginTop: 32 }} />
        ) : filtered.length === 0 ? (
          <View
            style={[
              styles.empty,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                borderRadius: c.radius,
              },
            ]}
          >
            <Text style={[styles.emptyTitle, { color: c.foreground }]}>
              {t("noDebtsYet")}
            </Text>
            <Text style={[styles.emptyMsg, { color: c.mutedForeground }]}>
              {t("addFirstDebt")}
            </Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filtered.map((d) => (
              <DebtCard key={d.id} debt={d} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function Chip({
  label,
  active,
  onPress,
  small,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  small?: boolean;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? c.primary : c.card,
          borderColor: active ? c.primary : c.border,
          opacity: pressed ? 0.85 : 1,
          paddingVertical: small ? 6 : 8,
          paddingHorizontal: small ? 12 : 14,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: active ? c.primaryForeground : c.foreground,
            fontSize: small ? 12 : 13,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: "Inter_600SemiBold",
  },
  empty: {
    padding: 32,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
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
});
