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

// ═══════════════════════════════════════════════════════════
// 🎯 DEMO MODE — Set to true to bypass auth for investor demo
// ═══════════════════════════════════════════════════════════
const DEMO_MODE = true;

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@whatssound.app',
  app_metadata: {},
  user_metadata: {
    display_name: 'Carlos Mendoza',
  },
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
  id: 'demo-user-001',
  username: 'carlosmendoza',
  display_name: 'Carlos Mendoza',
  bio: 'Amante de la música y DJ amateur 🎧',
  avatar_url: null,
  is_dj: true,
  is_verified: true,
  dj_name: 'DJ Carlos',
  genres: ['Reggaetón', 'Latin House', 'Electrónica'],
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
    if (DEMO_MODE) {
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
    if (DEMO_MODE) return; // Skip auth routing in demo mode
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, initialized, segments]);

  if (!DEMO_MODE && !initialized) {
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
