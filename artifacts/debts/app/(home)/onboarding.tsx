import { useUser } from "@clerk/expo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCIES } from "@/lib/currencies";
import {
  getGetMyProfileQueryKey,
  getGetSummaryQueryKey,
  useUpdateMyProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Onboarding() {
  const c = useColors();
  const { t, language, isRTL, setCurrency } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("USD");

  const update = useUpdateMyProfile({
    mutation: {
      onSuccess: async () => {
        if (user) {
          await AsyncStorage.setItem(`diyoun.onboarded.${user.id}`, "1");
        }
        setCurrency(selected);
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        router.replace("/(home)");
      },
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (cur) =>
        cur.code.toLowerCase().includes(q) ||
        cur.nameEn.toLowerCase().includes(q) ||
        cur.nameAr.includes(q),
    );
  }, [search]);

  return (
    <Screen noBottomInset>
      <View
        style={[
          styles.header,
          { paddingTop: 8, alignItems: isRTL ? "flex-end" : "flex-start" },
        ]}
      >
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: c.primary + "1A", borderRadius: 999 },
          ]}
        >
          <Feather name="dollar-sign" size={26} color={c.primary} />
        </View>
        <Text
          style={[
            styles.title,
            { color: c.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("chooseCurrencyTitle")}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("chooseCurrencySubtitle")}
        </Text>
      </View>

      <View style={styles.searchWrap}>
        <TextField
          value={search}
          onChangeText={setSearch}
          placeholder={t("selectCurrency")}
          rightAdornment={
            <Feather name="search" size={18} color={c.mutedForeground} />
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.map((cur) => {
          const active = selected === cur.code;
          return (
            <Pressable
              key={cur.code}
              onPress={() => setSelected(cur.code)}
              style={({ pressed }) => [
                styles.row,
                {
                  backgroundColor: active ? c.primary + "10" : c.card,
                  borderColor: active ? c.primary : c.border,
                  borderRadius: c.radius - 4,
                  opacity: pressed ? 0.85 : 1,
                  flexDirection: isRTL ? "row-reverse" : "row",
                },
              ]}
            >
              <View
                style={[
                  styles.codeBox,
                  { backgroundColor: c.muted, borderRadius: 10 },
                ]}
              >
                <Text style={[styles.code, { color: c.foreground }]}>
                  {cur.symbol}
                </Text>
              </View>
              <View style={{ flex: 1, marginInlineStart: 12 }}>
                <Text
                  style={[
                    styles.name,
                    { color: c.foreground, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {language === "ar" ? cur.nameAr : cur.nameEn}
                </Text>
                <Text
                  style={[
                    styles.codeText,
                    {
                      color: c.mutedForeground,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                >
                  {cur.code}
                </Text>
              </View>
              {active ? (
                <Feather name="check-circle" size={22} color={c.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom + 12, 16),
            backgroundColor: c.background,
            borderTopColor: c.border,
          },
        ]}
      >
        <Button
          title={t("continue")}
          onPress={() =>
            update.mutate({ data: { currency: selected, language } })
          }
          loading={update.isPending}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
  },
  searchWrap: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1.5,
  },
  codeBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  code: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  codeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  footer: {
    padding: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
