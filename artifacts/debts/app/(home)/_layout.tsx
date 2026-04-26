import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs, useRouter, usePathname } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AuthTokenBridge } from "@/components/AuthTokenBridge";
import { useSettings } from "@/contexts/SettingsContext";
import { useColors } from "@/hooks/useColors";
import { useGetMyProfile } from "@workspace/api-client-react";

function ProfileSync() {
  const { data } = useGetMyProfile();
  const { setCurrency, setLanguage, ready } = useSettings();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!data || !ready) return;
    setCurrency(data.currency);
    if (data.language === "en" || data.language === "ar") {
      setLanguage(data.language);
    }
    if (
      data.currency.toUpperCase() === "USD" &&
      pathname !== "/onboarding"
    ) {
      // Heuristic: if profile still on default and onboarding not visited yet
      // we still let the user use the app — onboarding is one-time on creation.
    }
  }, [data, ready, setCurrency, setLanguage, pathname, router]);

  return null;
}

export default function HomeLayout() {
  const { isLoaded, isSignedIn } = useAuth();
  const c = useColors();
  const { t, isRTL } = useSettings();
  const router = useRouter();

  if (!isLoaded) {
    return (
      <View
        style={[styles.loader, { backgroundColor: c.background }]}
      >
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <AuthTokenBridge />
      <ProfileSync />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.mutedForeground,
          tabBarStyle: {
            backgroundColor: c.card,
            borderTopColor: c.border,
            borderTopWidth: 1,
            height: 64,
            paddingTop: 8,
            paddingBottom: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontFamily: "Inter_600SemiBold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t("home"),
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="list"
          options={{
            title: t("debts"),
            tabBarIcon: ({ color, size }) => (
              <Feather name="list" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: t("addDebt"),
            tabBarButton: () => (
              <Pressable
                onPress={() => router.push("/new")}
                style={styles.addBtnWrap}
                accessibilityRole="button"
                accessibilityLabel={t("addDebt")}
              >
                <View
                  style={[
                    styles.addBtn,
                    { backgroundColor: c.primary, borderRadius: 999 },
                  ]}
                >
                  <Feather
                    name="plus"
                    size={26}
                    color={c.primaryForeground}
                  />
                </View>
              </Pressable>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t("settings"),
            tabBarIcon: ({ color, size }) => (
              <Feather name="settings" size={size - 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="new"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="onboarding"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="debt/[id]"
          options={{ href: null }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -16,
  },
  addBtn: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});
