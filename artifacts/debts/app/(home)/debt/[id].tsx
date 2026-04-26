import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Screen } from "@/components/Screen";
import { TextField } from "@/components/TextField";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { getCurrency } from "@/lib/currencies";
import { formatAmount, formatDate } from "@/lib/format";
import {
  getGetDebtQueryKey,
  getGetSummaryQueryKey,
  getListDebtsQueryKey,
  useAddPayment,
  useDeleteDebt,
  useDeletePayment,
  useGetDebt,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function DebtDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { t, language, isRTL } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [confirmDeleteDebt, setConfirmDeleteDebt] = useState(false);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<
    string | null
  >(null);

  const { data, isLoading, error, refetch } = useGetDebt(id ?? "", {
    query: {
      enabled: !!id,
      queryKey: getGetDebtQueryKey(id ?? ""),
    },
  });

  const invalidateAll = () => {
    if (id) {
      qc.invalidateQueries({ queryKey: getGetDebtQueryKey(id) });
    }
    qc.invalidateQueries({ queryKey: getListDebtsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
  };

  const addPayment = useAddPayment({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        setPaymentOpen(false);
        setPaymentAmount("");
        setPaymentNote("");
      },
      onError: () => setPaymentError(t("error")),
    },
  });

  const deleteDebt = useDeleteDebt({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListDebtsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        router.back();
      },
    },
  });

  const deletePayment = useDeletePayment({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        setConfirmDeletePayment(null);
        refetch();
      },
    },
  });

  const handleAddPayment = () => {
    setPaymentError(null);
    const amt = parseFloat(paymentAmount.replace(",", "."));
    if (!(amt > 0)) {
      setPaymentError(t("fillAllFields"));
      return;
    }
    if (!id) return;
    addPayment.mutate({
      id,
      data: {
        amount: amt,
        note: paymentNote.trim() ? paymentNote.trim() : null,
      },
    });
  };

  if (!id) return null;

  if (isLoading && !data) {
    return (
      <Screen>
        <ActivityIndicator color={c.primary} />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen>
        <Text style={{ color: c.destructive, padding: 20 }}>{t("error")}</Text>
      </Screen>
    );
  }

  const isOwedToMe = data.direction === "owed_to_me";
  const accentColor = isOwedToMe ? c.success : c.destructive;
  const symbol = getCurrency(data.currency).symbol;

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
          {t("debtDetails")}
        </Text>
        <Pressable
          onPress={() => setConfirmDeleteDebt(true)}
          style={[styles.iconBtn, { backgroundColor: c.destructive + "1A" }]}
        >
          <Feather name="trash-2" size={18} color={c.destructive} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(insets.bottom + 110, 120) },
        ]}
      >
        <View
          style={[
            styles.heroCard,
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
              styles.directionBadge,
              { backgroundColor: accentColor + "1A" },
            ]}
          >
            <Feather
              name={isOwedToMe ? "arrow-down-left" : "arrow-up-right"}
              size={12}
              color={accentColor}
            />
            <Text style={[styles.directionText, { color: accentColor }]}>
              {isOwedToMe ? t("owedToMe") : t("iOwe")}
            </Text>
          </View>
          <Text
            style={[
              styles.personName,
              { color: c.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {data.personName}
          </Text>
          <Text
            style={[
              styles.bigAmount,
              { color: accentColor, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {formatAmount(data.remainingAmount, data.currency, language)}
          </Text>
          <Text
            style={[styles.subAmount, { color: c.mutedForeground }]}
          >
            {t("paid")} {formatAmount(data.paidAmount, data.currency, language)}{" "}
            {t("of")} {formatAmount(data.amount, data.currency, language)}
          </Text>

          {data.status === "settled" ? (
            <View
              style={[
                styles.settledBadge,
                {
                  backgroundColor: c.success + "1A",
                  borderColor: c.success + "40",
                },
              ]}
            >
              <Feather name="check-circle" size={14} color={c.success} />
              <Text style={[styles.settledText, { color: c.success }]}>
                {t("fullySettled")}
              </Text>
            </View>
          ) : null}
        </View>

        {data.note ? (
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                borderRadius: c.radius - 4,
                alignItems: isRTL ? "flex-end" : "flex-start",
              },
            ]}
          >
            <Text
              style={[
                styles.noteLabel,
                { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("notes")}
            </Text>
            <Text
              style={[
                styles.noteBody,
                { color: c.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {data.note}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.metaRow,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <MetaItem label={t("createdAt")} value={formatDate(data.createdAt, language)} />
          <MetaItem label={t("updatedAt")} value={formatDate(data.updatedAt, language)} />
        </View>

        <Text
          style={[
            styles.sectionTitle,
            { color: c.foreground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {t("paymentHistory")}
        </Text>

        {data.payments.length === 0 ? (
          <View
            style={[
              styles.emptyPayments,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                borderRadius: c.radius - 4,
              },
            ]}
          >
            <Text style={{ color: c.mutedForeground }}>{t("noPayments")}</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {data.payments.map((p) => (
              <View
                key={p.id}
                style={[
                  styles.paymentRow,
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
                    styles.paymentIcon,
                    { backgroundColor: c.success + "1A", borderRadius: 999 },
                  ]}
                >
                  <Feather name="check" size={16} color={c.success} />
                </View>
                <View style={{ flex: 1, marginInlineStart: 12 }}>
                  <Text
                    style={[
                      styles.paymentAmount,
                      { color: c.foreground, textAlign: isRTL ? "right" : "left" },
                    ]}
                  >
                    {formatAmount(p.amount, data.currency, language)}
                  </Text>
                  <Text
                    style={[
                      styles.paymentDate,
                      {
                        color: c.mutedForeground,
                        textAlign: isRTL ? "right" : "left",
                      },
                    ]}
                  >
                    {formatDate(p.createdAt, language)}
                    {p.note ? ` · ${p.note}` : ""}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setConfirmDeletePayment(p.id)}
                  style={({ pressed }) => ({
                    padding: 8,
                    opacity: pressed ? 0.6 : 1,
                  })}
                >
                  <Feather name="trash-2" size={16} color={c.destructive} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {data.status !== "settled" ? (
        <View
          style={[
            styles.fab,
            {
              paddingBottom: Math.max(insets.bottom + 12, 16),
              backgroundColor: c.background,
              borderTopColor: c.border,
            },
          ]}
        >
          <Button
            title={t("addPayment")}
            onPress={() => setPaymentOpen(true)}
            icon={<Feather name="plus" size={18} color={c.primaryForeground} />}
          />
        </View>
      ) : null}

      <Modal
        visible={paymentOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPaymentOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: c.overlay }]}
          onPress={() => setPaymentOpen(false)}
        >
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: c.background,
                borderTopLeftRadius: c.radius,
                borderTopRightRadius: c.radius,
                paddingBottom: Math.max(insets.bottom + 16, 24),
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[styles.sheetHandle, { backgroundColor: c.border }]}
            />
            <Text
              style={[
                styles.sheetTitle,
                { color: c.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("recordPayment")}
            </Text>
            <TextField
              label={t("paymentAmount")}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              placeholder={t("amountPlaceholder")}
              keyboardType="decimal-pad"
              autoFocus
              rightAdornment={
                <Text
                  style={{
                    color: c.mutedForeground,
                    fontFamily: "Inter_600SemiBold",
                    marginInlineStart: 8,
                  }}
                >
                  {symbol}
                </Text>
              }
            />
            <TextField
              label={t("note")}
              value={paymentNote}
              onChangeText={setPaymentNote}
              placeholder={t("notePlaceholder")}
            />
            {paymentError ? (
              <Text style={{ color: c.destructive }}>{paymentError}</Text>
            ) : null}
            <Button
              title={t("save")}
              onPress={handleAddPayment}
              loading={addPayment.isPending}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        visible={confirmDeleteDebt}
        title={t("deleteDebtTitle")}
        message={t("deleteDebtMessage")}
        confirmLabel={t("deletePermanently")}
        cancelLabel={t("cancel")}
        destructive
        loading={deleteDebt.isPending}
        onConfirm={() => {
          deleteDebt.mutate({ id });
        }}
        onCancel={() => setConfirmDeleteDebt(false)}
      />

      <ConfirmDialog
        visible={!!confirmDeletePayment}
        title={t("deletePaymentTitle")}
        message={t("deletePaymentMessage")}
        confirmLabel={t("deletePermanently")}
        cancelLabel={t("cancel")}
        destructive
        loading={deletePayment.isPending}
        onConfirm={() => {
          if (confirmDeletePayment) {
            deletePayment.mutate({ id: confirmDeletePayment });
          }
        }}
        onCancel={() => setConfirmDeletePayment(null)}
      />
    </Screen>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  const c = useColors();
  const { isRTL } = useSettings();
  return (
    <View
      style={[
        styles.metaItem,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          borderRadius: c.radius - 4,
          alignItems: isRTL ? "flex-end" : "flex-start",
        },
      ]}
    >
      <Text style={[styles.metaLabel, { color: c.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.metaValue, { color: c.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
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
  scroll: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    padding: 20,
    borderWidth: 1,
    gap: 8,
  },
  directionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  directionText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  personName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  bigAmount: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
    marginTop: 4,
  },
  subAmount: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  settledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 8,
  },
  settledText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  noteCard: {
    padding: 16,
    borderWidth: 1,
    gap: 6,
  },
  noteLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  noteBody: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    gap: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  emptyPayments: {
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentAmount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  paymentDate: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  fab: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    padding: 20,
    gap: 14,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    alignSelf: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
