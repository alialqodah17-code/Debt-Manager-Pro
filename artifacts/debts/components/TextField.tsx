import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSettings } from "@/contexts/SettingsContext";

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  rightAdornment?: React.ReactNode;
}

export function TextField({
  label,
  error,
  rightAdornment,
  style,
  ...rest
}: Props) {
  const c = useColors();
  const { isRTL } = useSettings();
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ width: "100%" }}>
      {label ? (
        <Text
          style={[
            styles.label,
            { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: c.card,
            borderColor: error
              ? c.destructive
              : focused
                ? c.primary
                : c.border,
            borderRadius: c.radius - 4,
          },
        ]}
      >
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          placeholderTextColor={c.mutedForeground}
          style={[
            styles.input,
            {
              color: c.foreground,
              textAlign: isRTL ? "right" : "left",
              writingDirection: isRTL ? "rtl" : "ltr",
            },
            style,
          ]}
        />
        {rightAdornment}
      </View>
      {error ? (
        <Text
          style={[
            styles.error,
            { color: c.destructive, textAlign: isRTL ? "right" : "left" },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    paddingVertical: 14,
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 6,
  },
});
