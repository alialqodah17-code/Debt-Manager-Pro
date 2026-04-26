import React from "react";
import {
  Platform,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noTopInset?: boolean;
  noBottomInset?: boolean;
}

export function Screen({ children, style, noTopInset, noBottomInset }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: c.background },
        {
          paddingTop: noTopInset
            ? 0
            : Math.max(insets.top, isWeb ? 67 : 0),
          paddingBottom: noBottomInset
            ? 0
            : Math.max(insets.bottom, isWeb ? 34 : 0),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
