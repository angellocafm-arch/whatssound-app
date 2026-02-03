/**
 * WhatsSound — Root Layout
 * Auth-aware navigation with Supabase + DEMO_MODE bypass
 */

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { colors } from '../src/theme/colors';
import { useAuthStore } from '../src/stores/authStore';
import { isDemoMode, DEMO_USER as DEMO_PROFILE_DATA, DEMO_DJ } from '../src/lib/demo';

// ═══════════════════════════════════════════════════════════
// 🎯 DEMO MODE — ?demo=true in URL or defaults to true
// Real mode: ?demo=false → real auth, real data
// ═══════════════════════════════════════════════════════════

const DEMO_USER = {
  id: DEMO_PROFILE_DATA.id,
  email: 'demo@whatssound.app',
  app_metadata: {},
  user_metadata: { display_name: DEMO_PROFILE_DATA.display_name },
  aud: 'authenticated',
  created_at: '2024-01-15T10:00:00Z',
} as any;

const DEMO_SESSION = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user: DEMO_USER,
} as any;

const DEMO_PROFILE = {
  id: DEMO_PROFILE_DATA.id,
  username: DEMO_PROFILE_DATA.username,
  display_name: DEMO_PROFILE_DATA.display_name,
  bio: 'Aquí por la música 💃',
  avatar_url: null,
  is_dj: false,
  is_verified: false,
  dj_name: null,
  genres: ['Reggaetón', 'Pop'],
  role: 'user',
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 5 * 60 * 1000 },
  },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, initialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isDemoMode()) {
      // Bypass auth — inject demo user directly into store
      useAuthStore.setState({
        user: DEMO_USER,
        session: DEMO_SESSION,
        profile: DEMO_PROFILE,
        initialized: true,
        loading: false,
      });
      return;
    }
    initialize();
  }, []);

  useEffect(() => {
    if (isDemoMode()) return; // Skip auth routing in demo mode
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);

  if (!isDemoMode() && !initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <View style={styles.appShell}>
        <AuthGate>
          <Stack
            screenOptions={{
              headerShown: false,
              headerStyle: { backgroundColor: colors.background },
              headerTintColor: colors.textPrimary,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
            }}
          >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="session/[id]"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
              }}
            />
          </Stack>
        </AuthGate>
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
    ...(Platform.OS === 'web'
      ? {
          maxWidth: 420,
          width: '100%',
          alignSelf: 'center' as const,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        }
      : {}),
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
