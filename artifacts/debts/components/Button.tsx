import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import { useColors } from "@/hooks/useColors";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "destructive"
  | "ghost"
  | "gold";

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  full?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled,
  loading,
  icon,
  style,
  full = true,
}: Props) {
  const c = useColors();

  const palette: Record<
    Variant,
    {
      bg: string;
      fg: string;
      border?: string;
      gradient?: readonly [string, string];
      shadow?: string;
    }
  > = {
    primary: {
      bg: c.primary,
      fg: c.primaryForeground,
      gradient: [c.gradientEmeraldFrom, c.gradientEmeraldTo],
      shadow: c.primary,
    },
    gold: {
      bg: c.accent,
      fg: c.accentForeground,
      gradient: [c.gradientGoldFrom, c.gradientGoldTo],
      shadow: c.accent,
    },
    secondary: { bg: c.secondary, fg: c.secondaryForeground },
    outline: {
      bg: "transparent",
      fg: c.foreground,
      border: c.border,
    },
    destructive: { bg: c.destructive, fg: c.destructiveForeground },
    ghost: { bg: "transparent", fg: c.foreground },
  };

  const p = palette[variant];

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress();
  };

  const inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={p.fg} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              { color: p.fg, marginInlineStart: icon ? 8 : 0 },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </>
      )}
    </View>
  );

  if (p.gradient && !disabled) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.shadowWrap,
          {
            shadowColor: p.shadow ?? "#000",
            opacity: pressed ? 0.92 : 1,
            alignSelf: full ? "stretch" : "flex-start",
            borderRadius: c.radius - 2,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={p.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.base,
            { borderRadius: c.radius - 2 },
          ]}
        >
          {inner}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: p.bg,
          borderColor: p.border ?? "transparent",
          borderWidth: p.border ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: full ? "stretch" : "flex-start",
          borderRadius: c.radius - 2,
        },
        style,
      ]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  base: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
});
