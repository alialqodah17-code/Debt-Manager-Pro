import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  children: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
  glow?: boolean;
  glowColor?: string;
}

export function GradientCard({
  children,
  colors: gradientColors,
  style,
  glow,
  glowColor,
}: Props) {
  const c = useColors();
  const fallback: readonly [string, string] = [
    c.gradientHeroFrom,
    c.gradientHeroTo,
  ];

  return (
    <View
      style={[
        styles.wrap,
        glow && {
          shadowColor: glowColor ?? c.accent,
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 12 },
          elevation: 12,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={gradientColors ?? fallback}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          { borderRadius: c.radius },
        ]}
      >
        {children}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
  },
  gradient: {
    overflow: "hidden",
  },
});
