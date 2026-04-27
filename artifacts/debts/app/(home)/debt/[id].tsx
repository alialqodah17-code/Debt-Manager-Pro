import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
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
  useGetMyProfile,
  useUpdateDebt,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

type PaymentKind = "add" | "deduct";

export default function DebtDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const { t, language, isRTL } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentKind, setPaymentKind] = useState<PaymentKind>("add");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [confirmDeleteDebt, setConfirmDeleteDebt] = useState(false);
  const [confirmDeletePayment, setConfirmDeletePayment] = useState<
    string | null
  >(null);

  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  const [shareOpen, setShareOpen] = useState<{
    kind: PaymentKind;
    amount: number;
    remaining: number;
  } | null>(null);

  const { data, isLoading, error, refetch } = useGetDebt(id ?? "", {
    query: {
      enabled: !!id,
      queryKey: getGetDebtQueryKey(id ?? ""),
    },
  });
  const profileQ = useGetMyProfile();
  const shortcuts = profileQ.data?.amountShortcuts ?? [];

  const invalidateAll = () => {
    if (id) {
      qc.invalidateQueries({ queryKey: getGetDebtQueryKey(id) });
    }
    qc.invalidateQueries({ queryKey: getListDebtsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
  };

  const addPayment = useAddPayment({
    mutation: {
      onSuccess: (res, vars) => {
        invalidateAll();
        setPaymentOpen(false);
        setPaymentAmount("");
        setPaymentNote("");
        const submittedAmount = Number(vars.data.amount);
        const submittedKind: PaymentKind =
          vars.data.kind === "deduct" ? "deduct" : "add";
        if (res?.phone) {
          setShareOpen({
            kind: submittedKind,
            amount: submittedAmount,
            remaining: res.remainingAmount ?? 0,
          });
        }
      },
      onError: () => setPaymentError(t("error")),
    },
  });

  const updateDebt = useUpdateDebt({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        setPhoneOpen(false);
      },
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

  const openPaymentModal = (kind: PaymentKind) => {
    setPaymentKind(kind);
    setPaymentAmount("");
    setPaymentNote("");
    setPaymentError(null);
    setPaymentOpen(true);
  };

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
        kind: paymentKind,
        note: paymentNote.trim() ? paymentNote.trim() : null,
      },
    });
  };

  const applyShortcut = (sc: { value: number; kind: "fixed" | "fraction" }) => {
    if (!data) return;
    const base =
      paymentKind === "add" ? data.remainingAmount ?? 0 : data.amount ?? 0;
    const computed =
      sc.kind === "fixed" ? sc.value : Math.max(0, base * sc.value);
    setPaymentAmount(computed.toFixed(2));
  };

  const openPhoneEditor = () => {
    setPhoneInput(data?.phone ?? "");
    setPhoneOpen(true);
  };

  const savePhone = () => {
    if (!id) return;
    const cleaned = phoneInput.trim();
    updateDebt.mutate({
      id,
      data: { phone: cleaned ? cleaned : null },
    });
  };

  const sanitizePhone = (raw: string) =>
    raw.replace(/[^\d+]/g, "").replace(/^\++/, "+");

  const buildShareMessage = (s: {
    kind: PaymentKind;
    amount: number;
    remaining: number;
  }) => {
    if (!data) return "";
    const tpl =
      s.kind === "add"
        ? t("paymentRecordedMessage")
        : t("deductionRecordedMessage");
    return tpl
      .replace("{name}", data.personName)
      .replace("{amount}", formatAmount(s.amount, data.currency, language))
      .replace(
        "{remaining}",
        formatAmount(s.remaining, data.currency, language),
      );
  };

  const sendWhatsApp = async () => {
    if (!shareOpen || !data?.phone) return;
    const phone = sanitizePhone(data.phone).replace(/^\+/, "");
    const text = encodeURIComponent(buildShareMessage(shareOpen));
    const url = `whatsapp://send?phone=${phone}&text=${text}`;
    try {
      await Linking.openURL(url);
    } catch {
      const fallback = `https://wa.me/${phone}?text=${text}`;
      Linking.openURL(fallback).catch(() => {});
    }
    setShareOpen(null);
  };

  const sendSMS = async () => {
    if (!shareOpen || !data?.phone) return;
    const phone = sanitizePhone(data.phone);
    const text = encodeURIComponent(buildShareMessage(shareOpen));
    const url = `sms:${phone}?body=${text}`;
    try {
      await Linking.openURL(url);
    } catch {
      // ignore
    }
    setShareOpen(null);
  };

  const callPhone = () => {
    if (!data?.phone) return;
    Linking.openURL(`tel:${sanitizePhone(data.phone)}`).catch(() => {});
  };

  const openWhatsAppDirect = () => {
    if (!data?.phone) return;
    const phone = sanitizePhone(data.phone).replace(/^\+/, "");
    const url = `whatsapp://send?phone=${phone}`;
    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://wa.me/${phone}`).catch(() => {});
    });
  };

  const sortedShortcuts = useMemo(
    () => shortcuts.slice().sort((a, b) => a.label.localeCompare(b.label)),
    [shortcuts],
  );

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
          styles.content,
          { paddingBottom: 160 },
        ]}
      >
        <LinearGradient
          colors={
            isOwedToMe
              ? ["#1f5b3a", "#0f3a23"]
              : ["#7a2424", "#4a1414"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.heroCard, { borderRadius: c.radius }]}
        >
          <Text
            style={[
              styles.heroLabel,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {isOwedToMe ? t("totalOwedToMe") : t("totalIOwe")}
          </Text>
          <Text
            style={[
              styles.heroPerson,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {data.personName}
          </Text>
          <Text
            style={[
              styles.heroRemaining,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {formatAmount(data.remainingAmount, data.currency, language)}
          </Text>
          <Text
            style={[
              styles.heroOf,
              { textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("of")} {formatAmount(data.amount, data.currency, language)} ·{" "}
            {data.status === "settled" ? t("fullySettled") : t("open")}
          </Text>
        </LinearGradient>

        <View
          style={[
            styles.phoneCard,
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
              { backgroundColor: c.primary + "1A", borderRadius: 999 },
            ]}
          >
            <Feather name="phone" size={16} color={c.primary} />
          </View>
          <Pressable
            onPress={openPhoneEditor}
            style={{ flex: 1, marginInlineStart: 12 }}
          >
            <Text
              style={[
                styles.phoneLabel,
                {
                  color: c.mutedForeground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {t("phoneNumber")}
            </Text>
            <Text
              style={[
                styles.phoneValue,
                {
                  color: data.phone ? c.foreground : c.mutedForeground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {data.phone ?? t("phoneOptional")}
            </Text>
          </Pressable>
          {data.phone ? (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={callPhone}
                style={[
                  styles.actionBtn,
                  { backgroundColor: c.primary + "1A" },
                ]}
              >
                <Feather name="phone" size={16} color={c.primary} />
              </Pressable>
              <Pressable
                onPress={openWhatsAppDirect}
                style={[
                  styles.actionBtn,
                  { backgroundColor: c.success + "1A" },
                ]}
              >
                <Feather name="message-circle" size={16} color={c.success} />
              </Pressable>
              <Pressable
                onPress={openPhoneEditor}
                style={[
                  styles.actionBtn,
                  { backgroundColor: c.muted },
                ]}
              >
                <Feather name="edit-2" size={14} color={c.foreground} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={openPhoneEditor}
              style={[styles.actionBtn, { backgroundColor: c.muted }]}
            >
              <Feather name="plus" size={16} color={c.foreground} />
            </Pressable>
          )}
        </View>

        {data.note ? (
          <View
            style={[
              styles.noteCard,
              {
                backgroundColor: c.card,
                borderColor: c.border,
                borderRadius: c.radius - 4,
              },
            ]}
          >
            <Text
              style={[
                styles.noteLabel,
                {
                  color: c.mutedForeground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {t("note")}
            </Text>
            <Text
              style={[
                styles.noteText,
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
            {data.payments.map((p) => {
              const isDeduct = p.kind === "deduct";
              const tone = isDeduct ? c.destructive : c.success;
              const icon = isDeduct ? "minus" : "check";
              const sign = isDeduct ? "+" : "−";
              return (
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
                      { backgroundColor: tone + "1A", borderRadius: 999 },
                    ]}
                  >
                    <Feather name={icon} size={16} color={tone} />
                  </View>
                  <View style={{ flex: 1, marginInlineStart: 12 }}>
                    <Text
                      style={[
                        styles.paymentAmount,
                        { color: tone, textAlign: isRTL ? "right" : "left" },
                      ]}
                    >
                      {sign}
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
                      {isDeduct ? t("addToDebt") : t("addPayment")} ·{" "}
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
              );
            })}
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
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Button
              title={t("addPayment")}
              onPress={() => openPaymentModal("add")}
              icon={
                <Feather name="plus" size={18} color={c.primaryForeground} />
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title={t("deductPayment")}
              onPress={() => openPaymentModal("deduct")}
              variant="outline"
              icon={<Feather name="minus" size={18} color={c.foreground} />}
            />
          </View>
        </View>
      ) : (
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
            title={t("addToDebt")}
            onPress={() => openPaymentModal("deduct")}
            variant="outline"
            icon={<Feather name="plus" size={18} color={c.foreground} />}
          />
        </View>
      )}

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
              {paymentKind === "add"
                ? t("recordPayment")
                : t("recordDeduction")}
            </Text>

            <View
              style={[
                styles.kindToggle,
                { backgroundColor: c.muted, borderRadius: c.radius - 6 },
              ]}
            >
              <KindOption
                label={t("addPayment")}
                icon="plus"
                tone={c.success}
                active={paymentKind === "add"}
                onPress={() => setPaymentKind("add")}
              />
              <KindOption
                label={t("addToDebt")}
                icon="minus"
                tone={c.destructive}
                active={paymentKind === "deduct"}
                onPress={() => setPaymentKind("deduct")}
              />
            </View>

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

            {sortedShortcuts.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
              >
                {sortedShortcuts.map((sc) => {
                  const computed =
                    sc.kind === "fixed"
                      ? sc.value
                      : (paymentKind === "add"
                          ? data.remainingAmount
                          : data.amount) * sc.value;
                  return (
                    <Pressable
                      key={sc.id}
                      onPress={() => applyShortcut(sc)}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: c.muted,
                          borderColor: c.border,
                          borderRadius: 999,
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: c.foreground,
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 13,
                        }}
                      >
                        {sc.label}
                      </Text>
                      <Text
                        style={{
                          color: c.mutedForeground,
                          fontFamily: "Inter_500Medium",
                          fontSize: 11,
                          marginInlineStart: 6,
                        }}
                      >
                        {formatAmount(computed, data.currency, language)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

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

      <Modal
        visible={phoneOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setPhoneOpen(false)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: c.overlay }]}
          onPress={() => setPhoneOpen(false)}
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
              {t("phoneNumber")}
            </Text>
            <TextField
              label={t("phoneNumber")}
              value={phoneInput}
              onChangeText={setPhoneInput}
              placeholder={t("phonePlaceholder")}
              keyboardType="phone-pad"
              autoFocus
            />
            <Button
              title={t("save")}
              onPress={savePhone}
              loading={updateDebt.isPending}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={!!shareOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setShareOpen(null)}
      >
        <Pressable
          style={[styles.overlay, { backgroundColor: c.overlay, justifyContent: "center", padding: 24 }]}
          onPress={() => setShareOpen(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              styles.shareCard,
              { backgroundColor: c.card, borderRadius: c.radius },
            ]}
          >
            <Text
              style={[
                styles.shareTitle,
                { color: c.foreground, textAlign: isRTL ? "right" : "left" },
              ]}
            >
              {t("shareUpdate")}
            </Text>
            <Text
              style={[
                styles.shareMessage,
                {
                  color: c.mutedForeground,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {t("shareUpdateMessage")}
            </Text>
            <View style={{ gap: 8, marginTop: 12 }}>
              <Button
                title={t("sendWhatsApp")}
                onPress={sendWhatsApp}
                icon={
                  <Feather
                    name="message-circle"
                    size={18}
                    color={c.primaryForeground}
                  />
                }
              />
              <Button
                title={t("sendSMS")}
                onPress={sendSMS}
                variant="outline"
                icon={
                  <Feather name="message-square" size={18} color={c.foreground} />
                }
              />
              <Button
                title={t("skip")}
                onPress={() => setShareOpen(null)}
                variant="ghost"
              />
            </View>
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
    <View style={{ flex: 1 }}>
      <Text
        style={{
          color: c.mutedForeground,
          fontSize: 11,
          fontFamily: "Inter_600SemiBold",
          letterSpacing: 0.5,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text
        style={{
          color: c.foreground,
          fontSize: 13,
          fontFamily: "Inter_500Medium",
          marginTop: 2,
          textAlign: isRTL ? "right" : "left",
        }}
      >
        {value}
      </Text>
    </View>
  );
}

function KindOption({
  label,
  icon,
  tone,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  tone: string;
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
      <Feather name={icon} size={14} color={active ? tone : c.mutedForeground} />
      <Text
        style={{
          color: active ? c.foreground : c.mutedForeground,
          fontFamily: "Inter_600SemiBold",
          fontSize: 13,
          marginInlineStart: 6,
        }}
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
  content: {
    padding: 20,
    gap: 16,
  },
  heroCard: {
    padding: 24,
    overflow: "hidden",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  heroPerson: {
    color: "#ffffff",
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
    marginTop: 6,
  },
  heroRemaining: {
    color: "#ffffff",
    fontSize: 38,
    fontFamily: "PlayfairDisplay_700Bold",
    marginTop: 8,
    letterSpacing: -0.5,
  },
  heroOf: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
  phoneCard: {
    padding: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  phoneLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  phoneValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  rowIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  noteCard: {
    padding: 14,
    borderWidth: 1,
  },
  noteLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  noteText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    gap: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
  emptyPayments: {
    padding: 20,
    borderWidth: 1,
    alignItems: "center",
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
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: 10,
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  shareCard: {
    padding: 20,
  },
  shareTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  shareMessage: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});
