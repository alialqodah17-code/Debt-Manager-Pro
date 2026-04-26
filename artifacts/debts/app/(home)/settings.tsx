import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/Button";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCIES, getCurrency } from "@/lib/currencies";
import {
  getGetMyProfileQueryKey,
  getGetSummaryQueryKey,
  useUpdateMyProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function Settings() {
  const c = useColors();
  const { t, language, currency, isRTL, setLanguage, setCurrency } =
    useSettings();
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [search, setSearch] = useState("");

  const update = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      },
    },
  });

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? "";
  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    userEmail.split("@")[0] ||
    t("you");

  const filteredCurrencies = (() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (cur) =>
        cur.code.toLowerCase().includes(q) ||
        cur.nameEn.toLowerCase().includes(q) ||
        cur.nameAr.includes(q),
    );
  })();

  const onSignOut = async () => {
    await signOut();
    router.replace("/(auth)/sign-in");
  };

  const onPickCurrency = (code: string) => {
    setCurrency(code);
    update.mutate({ data: { currency: code } });
    setCurrencyOpen(false);
  };

  const onPickLanguage = (lang: "en" | "ar") => {
    setLanguage(lang);
    update.mutate({ data: { language: lang } });
  };

  return (
    <Screen noBottomInset>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text
          style={[
            styles.title,
            { color: c.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("settings")}
        </Text>

        <View
          style={[
            styles.profileCard,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: c.primary,
                borderRadius: 999,
              },
            ]}
          >
            <Text style={[styles.avatarText, { color: c.primaryForeground }]}>
              {userName[0]?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <View style={{ flex: 1, marginInlineStart: 12 }}>
            <Text
              style={[
                styles.profileName,
                { color: c.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
              numberOfLines={1}
            >
              {userName}
            </Text>
            {userEmail ? (
              <Text
                style={[
                  styles.profileEmail,
                  {
                    color: c.mutedForeground,
                    textAlign: isRTL ? "right" : "left",
                  },
                ]}
                numberOfLines={1}
              >
                {userEmail}
              </Text>
            ) : null}
          </View>
        </View>

        <SectionLabel title={t("preferences")} />

        <Pressable
          onPress={() => setCurrencyOpen(true)}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius - 4,
              opacity: pressed ? 0.85 : 1,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: c.primary + "1A", borderRadius: 10 },
            ]}
          >
            <Feather name="dollar-sign" size={18} color={c.primary} />
          </View>
          <View style={{ flex: 1, marginInlineStart: 12 }}>
            <Text style={[styles.rowTitle, { color: c.foreground }]}>
              {t("currency")}
            </Text>
            <Text
              style={[styles.rowSubtitle, { color: c.mutedForeground }]}
            >
              {getCurrency(currency).code} · {getCurrency(currency).symbol}
            </Text>
          </View>
          <Feather
            name={isRTL ? "chevron-left" : "chevron-right"}
            size={20}
            color={c.mutedForeground}
          />
        </Pressable>

        <View
          style={[
            styles.row,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius - 4,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: c.accent + "26", borderRadius: 10 },
            ]}
          >
            <Feather name="globe" size={18} color={c.accent} />
          </View>
          <View style={{ flex: 1, marginInlineStart: 12 }}>
            <Text style={[styles.rowTitle, { color: c.foreground }]}>
              {t("language")}
            </Text>
          </View>
          <View
            style={[
              styles.langSwitch,
              { backgroundColor: c.muted, borderRadius: 999 },
            ]}
          >
            <LangPill
              label="EN"
              active={language === "en"}
              onPress={() => onPickLanguage("en")}
            />
            <LangPill
              label="ع"
              active={language === "ar"}
              onPress={() => onPickLanguage("ar")}
            />
          </View>
        </View>

        <SectionLabel title={t("account")} />

        <Pressable
          onPress={onSignOut}
          style={({ pressed }) => [
            styles.row,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius - 4,
              opacity: pressed ? 0.85 : 1,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              {
                backgroundColor: c.destructive + "1A",
                borderRadius: 10,
              },
            ]}
          >
            <Feather name="log-out" size={18} color={c.destructive} />
          </View>
          <View style={{ flex: 1, marginInlineStart: 12 }}>
            <Text style={[styles.rowTitle, { color: c.destructive }]}>
              {t("signOut")}
            </Text>
          </View>
        </Pressable>

        <SectionLabel title={t("appInfo")} />
        <View
          style={[
            styles.row,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius - 4,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View
            style={[
              styles.rowIcon,
              { backgroundColor: c.muted, borderRadius: 10 },
            ]}
          >
            <Feather name="info" size={18} color={c.foreground} />
          </View>
          <View style={{ flex: 1, marginInlineStart: 12 }}>
            <Text style={[styles.rowTitle, { color: c.foreground }]}>
              {t("appName")}
            </Text>
            <Text style={[styles.rowSubtitle, { color: c.mutedForeground }]}>
              {t("version")} 1.0.0
            </Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={currencyOpen}
        animationType="slide"
        onRequestClose={() => setCurrencyOpen(false)}
        presentationStyle="pageSheet"
      >
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: c.border, flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text style={[styles.modalTitle, { color: c.foreground }]}>
              {t("selectCurrency")}
            </Text>
            <Pressable onPress={() => setCurrencyOpen(false)}>
              <Feather name="x" size={24} color={c.foreground} />
            </Pressable>
          </View>
          <View style={{ padding: 16 }}>
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
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
          >
            {filteredCurrencies.map((cur) => {
              const active = currency === cur.code;
              return (
                <Pressable
                  key={cur.code}
                  onPress={() => onPickCurrency(cur.code)}
                  style={({ pressed }) => [
                    styles.currencyRow,
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
                    <Text style={[styles.codeBoxText, { color: c.foreground }]}>
                      {cur.symbol}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginInlineStart: 12 }}>
                    <Text
                      style={[
                        styles.currencyName,
                        { color: c.foreground, textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {language === "ar" ? cur.nameAr : cur.nameEn}
                    </Text>
                    <Text
                      style={[
                        styles.currencyCode,
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
                    <Feather name="check" size={20} color={c.primary} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </Screen>
  );
}

function SectionLabel({ title }: { title: string }) {
  const c = useColors();
  const { isRTL } = useSettings();
  return (
    <Text
      style={[
        styles.sectionLabel,
        {
          color: c.mutedForeground,
          textAlign: isRTL ? "right" : "left",
        },
      ]}
    >
      {title.toUpperCase()}
    </Text>
  );
}

function LangPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.langPill,
        {
          backgroundColor: active ? c.primary : "transparent",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.langPillText,
          { color: active ? c.primaryForeground : c.foreground },
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
    gap: 12,
  },
  title: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  profileName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  profileEmail: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
  },
  rowIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  langSwitch: {
    flexDirection: "row",
    padding: 3,
  },
  langPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    minWidth: 38,
    alignItems: "center",
  },
  langPillText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  currencyRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
  },
  codeBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  codeBoxText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  currencyName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  currencyCode: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
});
