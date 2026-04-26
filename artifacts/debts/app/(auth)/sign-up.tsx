import { useSSO } from "@clerk/expo";
import { useSignUp } from "@clerk/expo/legacy";
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

export default function SignUpScreen() {
  useWarmUpBrowser();
  const c = useColors();
  const { t, isRTL } = useSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { signUp, setActive, isLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    if (!email.trim() || !password) {
      setError(t("fillAllFields"));
      return;
    }
    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }
    setSubmitting(true);
    try {
      await signUp.create({ emailAddress: email.trim(), password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
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
  }, [isLoaded, email, password, signUp, t]);

  const handleVerify = useCallback(async () => {
    if (!isLoaded) return;
    setError(null);
    setSubmitting(true);
    try {
      const completed = await signUp.attemptEmailAddressVerification({ code });
      if (completed.status === "complete") {
        await setActive({ session: completed.createdSessionId });
        router.replace("/(home)");
      } else {
        setError(t("error"));
      }
    } catch (err) {
      const msg =
        (err as { errors?: Array<{ message?: string }> })?.errors?.[0]
          ?.message ?? t("error");
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }, [isLoaded, signUp, code, setActive, router, t]);

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
            {pendingVerification ? t("verifyEmail") : t("createAccount")}
          </Text>
          <Text
            style={[
              styles.brandSubtitle,
              { color: c.mutedForeground, textAlign: isRTL ? "right" : "left" },
            ]}
          >
            {pendingVerification ? t("weSentCode") : t("tagline")}
          </Text>
        </View>

        {pendingVerification ? (
          <View style={styles.form}>
            <View nativeID="clerk-captcha" />
            <TextField
              label={t("verificationCode")}
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="000000"
            />
            {error ? (
              <Text style={[styles.error, { color: c.destructive }]}>
                {error}
              </Text>
            ) : null}
            <Button
              title={submitting ? t("verifying") : t("verify")}
              onPress={handleVerify}
              loading={submitting}
            />
          </View>
        ) : (
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
              <View
                style={[styles.dividerLine, { backgroundColor: c.border }]}
              />
              <Text style={[styles.dividerText, { color: c.mutedForeground }]}>
                {t("or")}
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: c.border }]}
              />
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
              autoComplete="new-password"
              placeholder="••••••••"
            />
            <View nativeID="clerk-captcha" />

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
              title={submitting ? t("signingUp") : t("signUp")}
              onPress={handleSignUp}
              loading={submitting}
            />

            <View
              style={[
                styles.footer,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <Text style={[styles.footerText, { color: c.mutedForeground }]}>
                {t("alreadyHaveAccount")}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <Pressable>
                  <Text style={[styles.footerLink, { color: c.primary }]}>
                    {" "}
                    {t("signIn")}
                  </Text>
                </Pressable>
              </Link>
            </View>
          </View>
        )}
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
  brand: { gap: 8 },
  logo: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  form: { gap: 16 },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: { flex: 1, height: 1 },
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
