import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { getCurrency } from "@/lib/currencies";
import {
  getGetSummaryQueryKey,
  getListDebtsQueryKey,
  useCreateDebt,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function NewDebt() {
  const c = useColors();
  const { t, isRTL, currency } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [direction, setDirection] = useState<"owed_to_me" | "i_owe">(
    "owed_to_me",
  );
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useCreateDebt({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        router.back();
      },
      onError: () => {
        setError(t("error"));
      },
    },
  });

  const handleSubmit = () => {
    setError(null);
    const amt = parseFloat(amount.replace(",", "."));
    if (!personName.trim() || !(amt > 0)) {
      setError(t("fillAllFields"));
      return;
    }
    create.mutate({
      data: {
        personName: personName.trim(),
        direction,
        amount: amt,
        note: note.trim() ? note.trim() : null,
      },
    });
  };

  const symbol = getCurrency(currency).symbol;

  return (
    <Screen noBottomInset>
      <View
        style={[
          styles.header,
          {
            borderBottomColor: c.border,
            flexDirection: isRTL ? "row-reverse" : "row",
          },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: c.muted }]}
        >
          <Feather
            name={isRTL ? "arrow-right" : "arrow-left"}
            size={20}
            color={c.foreground}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.foreground }]}>
          {t("newDebt")}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.form,
          { paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.toggleRow, { backgroundColor: c.muted, borderRadius: c.radius - 4 }]}>
          <ToggleOption
            label={t("owedToMe")}
            icon="arrow-down-left"
            active={direction === "owed_to_me"}
            color={c.success}
            onPress={() => setDirection("owed_to_me")}
          />
          <ToggleOption
            label={t("iOwe")}
            icon="arrow-up-right"
            active={direction === "i_owe"}
            color={c.destructive}
            onPress={() => setDirection("i_owe")}
          />
        </View>

        <TextField
          label={t("personName")}
          value={personName}
          onChangeText={setPersonName}
          placeholder={t("personNamePlaceholder")}
          autoCapitalize="words"
        />

        <TextField
          label={t("amount")}
          value={amount}
          onChangeText={setAmount}
          placeholder={t("amountPlaceholder")}
          keyboardType="decimal-pad"
          rightAdornment={
            <Text
              style={[
                styles.adornment,
                { color: c.mutedForeground },
              ]}
            >
              {symbol}
            </Text>
          }
        />

        <TextField
          label={t("note")}
          value={note}
          onChangeText={setNote}
          placeholder={t("notePlaceholder")}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: "top" }}
        />

        {error ? (
          <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>
        ) : null}

        <Button
          title={t("save")}
          onPress={handleSubmit}
          loading={create.isPending}
        />
      </ScrollView>
    </Screen>
  );
}

function ToggleOption({
  label,
  icon,
  active,
  color,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.toggleBtn,
        {
          backgroundColor: active ? c.card : "transparent",
          opacity: pressed ? 0.85 : 1,
          shadowColor: active ? "#000" : "transparent",
        },
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={active ? color : c.mutedForeground}
      />
      <Text
        style={[
          styles.toggleText,
          { color: active ? c.foreground : c.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  form: {
    padding: 20,
    gap: 18,
  },
  toggleRow: {
    flexDirection: "row",
    padding: 4,
    gap: 4,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  adornment: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginInlineStart: 8,
  },
  error: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
