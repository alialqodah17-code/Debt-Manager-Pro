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
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { CURRENCIES, getCurrency } from "@/lib/currencies";
import {
  getGetMyProfileQueryKey,
  getGetSummaryQueryKey,
  useGetMyProfile,
  useUpdateMyProfile,
} from "@workspace/api-client-react";
import type { AmountShortcut } from "@workspace/api-client-react";
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

  const profileQ = useGetMyProfile();
  const shortcuts: AmountShortcut[] = profileQ.data?.amountShortcuts ?? [];

  const [shortcutModal, setShortcutModal] = useState<
    | null
    | { mode: "create" }
    | { mode: "edit"; original: AmountShortcut }
  >(null);
  const [scLabel, setScLabel] = useState("");
  const [scValue, setScValue] = useState("");
  const [scKind, setScKind] = useState<"fixed" | "fraction">("fraction");
  const [scError, setScError] = useState<string | null>(null);
  const [confirmDeleteShortcut, setConfirmDeleteShortcut] = useState<
    string | null
  >(null);

  const update = useUpdateMyProfile({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      },
    },
  });

  const persistShortcuts = (next: AmountShortcut[]) => {
    update.mutate({ data: { amountShortcuts: next } });
  };

  const openCreateShortcut = () => {
    setScLabel("");
    setScValue("");
    setScKind("fraction");
    setScError(null);
    setShortcutModal({ mode: "create" });
  };

  const openEditShortcut = (sc: AmountShortcut) => {
    setScLabel(sc.label);
    setScValue(String(sc.value));
    setScKind(sc.kind);
    setScError(null);
    setShortcutModal({ mode: "edit", original: sc });
  };

  const saveShortcut = () => {
    setScError(null);
    const label = scLabel.trim();
    const value = parseFloat(scValue.replace(",", "."));
    if (!label || !(value > 0)) {
      setScError(t("fillAllFields"));
      return;
    }
    if (scKind === "fraction" && value > 1) {
      setScError(t("fractionHint"));
      return;
    }
    if (!shortcutModal) return;
    if (shortcutModal.mode === "create") {
      const newSc: AmountShortcut = {
        id: `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        label,
        value,
        kind: scKind,
      };
      persistShortcuts([...shortcuts, newSc]);
    } else {
      persistShortcuts(
        shortcuts.map((s) =>
          s.id === shortcutModal.original.id
            ? { ...s, label, value, kind: scKind }
            : s,
        ),
      );
    }
    setShortcutModal(null);
  };

  const deleteShortcut = (id: string) => {
    persistShortcuts(shortcuts.filter((s) => s.id !== id));
    setConfirmDeleteShortcut(null);
  };

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

        <SectionLabel title={t("amountShortcuts")} />
        <View
          style={[
            styles.shortcutsCard,
            {
              backgroundColor: c.card,
              borderColor: c.border,
              borderRadius: c.radius - 4,
            },
          ]}
        >
          <Text
            style={[
              styles.shortcutsHint,
              {
                color: c.mutedForeground,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {t("shortcutsHint")}
          </Text>

          {shortcuts.length === 0 ? (
            <Text
              style={[
                styles.shortcutsEmpty,
                {
                  color: c.mutedForeground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {t("noShortcuts")}
            </Text>
          ) : (
            <View style={{ gap: 8, marginTop: 12 }}>
              {shortcuts.map((sc) => (
                <View
                  key={sc.id}
                  style={[
                    styles.shortcutRow,
                    {
                      backgroundColor: c.muted,
                      borderRadius: c.radius - 6,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.shortcutBadge,
                      {
                        backgroundColor: c.card,
                        borderRadius: 999,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: c.foreground,
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                      }}
                    >
                      {sc.label}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginInlineStart: 12 }}>
                    <Text
                      style={[
                        styles.shortcutTitle,
                        {
                          color: c.foreground,
                          textAlign: isRTL ? "right" : "left",
                        },
                      ]}
                    >
                      {sc.kind === "fraction"
                        ? `${t("fractionAmount")} · ${(sc.value * 100).toFixed(0)}%`
                        : `${t("fixedAmount")} · ${sc.value}`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => openEditShortcut(sc)}
                    style={({ pressed }) => ({
                      padding: 8,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Feather name="edit-2" size={14} color={c.foreground} />
                  </Pressable>
                  <Pressable
                    onPress={() => setConfirmDeleteShortcut(sc.id)}
                    style={({ pressed }) => ({
                      padding: 8,
                      opacity: pressed ? 0.6 : 1,
                    })}
                  >
                    <Feather name="trash-2" size={14} color={c.destructive} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          <Pressable
            onPress={openCreateShortcut}
            style={({ pressed }) => [
              styles.addShortcutBtn,
              {
                borderColor: c.primary,
                opacity: pressed ? 0.7 : 1,
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <Feather name="plus" size={16} color={c.primary} />
            <Text
              style={{
                color: c.primary,
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                marginInlineStart: 8,
              }}
            >
              {t("addShortcut")}
            </Text>
          </Pressable>
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

      <Modal
        visible={!!shortcutModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShortcutModal(null)}
      >
        <Pressable
          style={[styles.shortcutOverlay, { backgroundColor: c.overlay }]}
          onPress={() => setShortcutModal(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.shortcutSheet,
              {
                backgroundColor: c.background,
                borderTopLeftRadius: c.radius,
                borderTopRightRadius: c.radius,
              },
            ]}
          >
            <View style={[styles.sheetHandle, { backgroundColor: c.border }]} />
            <Text
              style={[
                styles.sheetTitle,
                { color: c.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("newShortcut")}
            </Text>

            <View
              style={[
                styles.kindToggle,
                { backgroundColor: c.muted, borderRadius: c.radius - 6 },
              ]}
            >
              <KindChip
                label={t("fractionAmount")}
                active={scKind === "fraction"}
                onPress={() => setScKind("fraction")}
              />
              <KindChip
                label={t("fixedAmount")}
                active={scKind === "fixed"}
                onPress={() => setScKind("fixed")}
              />
            </View>

            <TextField
              label={t("shortcutLabel")}
              value={scLabel}
              onChangeText={setScLabel}
              placeholder="½"
            />

            <TextField
              label={t("shortcutValue")}
              value={scValue}
              onChangeText={setScValue}
              placeholder={scKind === "fraction" ? "0.5" : "100"}
              keyboardType="decimal-pad"
            />

            <Text
              style={{
                color: c.mutedForeground,
                fontSize: 12,
                fontFamily: "Inter_500Medium",
                textAlign: isRTL ? "right" : "left",
              }}
            >
              {scKind === "fraction" ? t("fractionHint") : ""}
            </Text>

            {scError ? (
              <Text style={{ color: c.destructive }}>{scError}</Text>
            ) : null}

            <Button
              title={t("save")}
              onPress={saveShortcut}
              loading={update.isPending}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={!!confirmDeleteShortcut}
        title={t("deletePermanently")}
        message=""
        confirmLabel={t("deletePermanently")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          if (confirmDeleteShortcut) deleteShortcut(confirmDeleteShortcut);
        }}
        onCancel={() => setConfirmDeleteShortcut(null)}
      />
    </Screen>
  );
}

function KindChip({
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
        styles.kindBtn,
        {
          backgroundColor: active ? c.card : "transparent",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={{
          color: active ? c.foreground : c.mutedForeground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
    </Pressable>
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
  shortcutsCard: {
    padding: 14,
    borderWidth: 1,
  },
  shortcutsHint: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  shortcutsEmpty: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 12,
  },
  shortcutRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  shortcutBadge: {
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutTitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  addShortcutBtn: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  shortcutOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  shortcutSheet: {
    padding: 20,
    gap: 14,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  kindToggle: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
  },
  kindBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
  },
});
