import { useSSO } from "@clerk/expo";
import { useSignIn } from "@clerk/expo/legacy";
import { Feather } from "@expo/vector-icons";
import * as AuthSession from "expo-auth-session";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
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

WebBrowser.maybeCompleteAuthSession();

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

export default function SignInScreen() {
  useWarmUpBrowser();
  const c = useColors();
  const { t, language, setLanguage, isRTL } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    if (!email.trim() || !password) {
      setError(t("fillAllFields"));
      return;
    }
    setSubmitting(true);
    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      });
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/(home)");
      } else {
        setError(t("error"));
      }
    } catch (err) {
      const msg =
        (err as { errors?: Array<{ longMessage?: string; message?: string }> })
          ?.errors?.[0]?.longMessage ??
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ??
        t("error");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, email, password, signIn, setActive, router, t]);

  const handleGoogle = useCallback(async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { createdSessionId, setActive: ssoSetActive } =
        await startSSOFlow({
          strategy: "oauth_google",
          redirectUrl: AuthSession.makeRedirectUri(),
        });
      if (createdSessionId && ssoSetActive) {
        await ssoSetActive({ session: createdSessionId });
        router.replace("/(home)");
      }
    } catch (err) {
      const msg =
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? t("error");
      setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [startSSOFlow, router, t]);

  return (
    <Screen noTopInset noBottomInset>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top + 24, 56),
            paddingBottom: Math.max(insets.bottom + 24, 32),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.langSwitch,
            { flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
        >
          <Pressable
            onPress={() => setLanguage(language === "en" ? "ar" : "en")}
            style={({ pressed }) => [
              styles.langBtn,
              {
                borderColor: c.border,
                backgroundColor: c.card,
                opacity: pressed ? 0.7 : 1,
                borderRadius: c.radius - 6,
              },
            ]}
          >
            <Feather name="globe" size={14} color={c.foreground} />
            <Text style={[styles.langLabel, { color: c.foreground }]}>
              {language === "en" ? "العربية" : "English"}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.brand, { alignItems: isRTL ? "flex-end" : "flex-start" }]}>
          <View
            style={[
              styles.logo,
              { backgroundColor: c.primary, borderRadius: c.radius },
            ]}
          >
            <Feather name="repeat" size={28} color={c.primaryForeground} />
          </View>
          <Text
            style={[
              styles.brandTitle,
              { color: c.foreground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("appName")}
          </Text>
          <Text
            style={[
              styles.brandSubtitle,
              { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {t("welcome")}
          </Text>
        </View>

        <View style={styles.form}>
          <Button
            title={t("continueWithGoogle")}
            onPress={handleGoogle}
            variant="outline"
            loading={googleLoading}
            icon={<Feather name="chrome" size={18} color={c.foreground} />}
          />

          <View
            style={[
              styles.divider,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={[styles.dividerText, { color: c.mutedForeground }]}>
              {t("or")}
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>

          <TextField
            label={t("email")}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <TextField
            label={t("password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="••••••••"
          />

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

          <Button
            title={submitting ? t("signingIn") : t("signIn")}
            onPress={handleEmailSignIn}
            loading={submitting}
          />

          <View
            style={[
              styles.footer,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
          >
            <Text style={[styles.footerText, { color: c.mutedForeground }]}>
              {t("noAccount")}
            </Text>
            <Link href="/(auth)/sign-up" asChild>
              <Pressable>
                <Text style={[styles.footerLink, { color: c.primary }]}>
                  {" "}
                  {t("createAccount")}
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 24,
    flexGrow: 1,
    gap: 32,
  },
  langSwitch: {
    justifyContent: "flex-end",
  },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  langLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  brand: {
    gap: 8,
  },
  logo: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
  },
  form: {
    gap: 16,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  error: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
