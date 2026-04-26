import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/contexts/SettingsContext";
import { Button } from "./Button";

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  const c = useColors();
  const { isRTL } = useSettings();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={onCancel}>
        <Pressable
          style={[
            styles.card,
            { backgroundColor: c.card, borderRadius: c.radius },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[
              styles.title,
              { color: c.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.message,
              { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {message}
          </Text>
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button
                title={cancelLabel}
                variant="outline"
                onPress={onCancel}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={confirmLabel}
                variant={destructive ? "destructive" : "primary"}
                onPress={onConfirm}
                loading={loading}
              />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
  },
  message: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
});
