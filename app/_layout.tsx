/**
 * WhatsSound — Root Layout
 * Auth-aware navigation with DEMO_MODE bypass for investors
 * 
 * URLs fijas:
 * - Inversores: / (default, demo=true)
 * - Pruebas: /?demo=false
 * - Dashboard: /admin
 */

import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { colors } from '../src/theme/colors';
import { useAuthStore } from '../src/stores/authStore';
import { isDemoMode, setDemoMode, DEMO_USER, DEMO_DJ, getNeedsProfile } from '../src/lib/demo';
import { useDeepLinking } from '../src/hooks/useDeepLinking';
import { DebugOverlay } from '../src/components/ui/DebugOverlay';
import debugLog from '../src/lib/debugToast';
import { initSentry, captureError } from '../src/lib/sentry';
import { initPostHog } from '../src/lib/posthog';

// ═══════════════════════════════════════════════════════════
// 🎯 MODOS:
// - demo=true (default): Inversores, bypass auth, mockups
// - demo=false: Pruebas, flujo real, número ficticio funciona
// ═══════════════════════════════════════════════════════════

const DEMO_AUTH_USER = {
  id: DEMO_USER.id,
  email: 'demo@whatssound.app',
  app_metadata: {},
  user_metadata: { display_name: DEMO_USER.display_name },
  aud: 'authenticated',
  created_at: '2024-01-15T10:00:00Z',
} as any;

const DEMO_SESSION = {
  access_token: 'demo-token',
  refresh_token: 'demo-refresh',
  expires_at: Math.floor(Date.now() / 1000) + 86400,
  user: DEMO_AUTH_USER,
} as any;

const DEMO_PROFILE = {
  id: DEMO_USER.id,
  username: DEMO_USER.username,
  display_name: DEMO_USER.display_name,
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
  const { user, profile, initialized, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Deep linking handler
  useDeepLinking();

  useEffect(() => {
    // Inicializar Sentry para monitoreo de errores
    initSentry();
    // Inicializar PostHog para analytics
    initPostHog();
    
    // Verificar si la URL tiene ?demo=false ANTES de establecer modo demo
    if (Platform.OS === 'web') {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('demo') === 'false') {
          // Usuario quiere modo pruebas - establecer modo y limpiar auth
          setDemoMode(false);
          useAuthStore.setState({
            user: null,
            session: null,
            profile: null,
            initialized: true,
            loading: false,
          });
          return;
        }
      } catch {}
    }
    
    if (isDemoMode()) {
      // MODO INVERSORES: bypass auth, usuario demo
      useAuthStore.setState({
        user: DEMO_AUTH_USER,
        session: DEMO_SESSION,
        profile: DEMO_PROFILE,
        initialized: true,
        loading: false,
      });
      return;
    }
    
    // MODO PRUEBAS: auth real
    // Check if returning from phone login (needs profile)
    if (getNeedsProfile()) {
      useAuthStore.setState({
        user: null,
        session: null,
        profile: null,
        initialized: true,
        loading: false,
      });
      return;
    }
    
    // Normal auth initialization
    initialize();
  }, []);

  useEffect(() => {
    if (isDemoMode()) return; // No routing en modo demo
    if (!initialized) return;

    const inAuthGroup = segments[0] === '(auth)';
    const currentPath = segments.join('/');
    
    // Rutas de auth que permiten tener user (flujo de registro)
    const authRoutesWithUser = ['(auth)/permissions', '(auth)/create-profile', '(auth)/onboarding', '(auth)/genres'];
    const isAllowedAuthRoute = authRoutesWithUser.some(route => currentPath.startsWith(route.replace('(auth)/', '')));

    const isWelcome = segments[0] === 'welcome';
    
    if (!user && !inAuthGroup && !isWelcome) {
      // Sin user y fuera de auth → ir a welcome (página de inicio)
      router.replace('/welcome');
    } else if (user && profile && inAuthGroup && !isAllowedAuthRoute) {
      // Con user Y perfil completo en auth, pero NO en rutas permitidas → ir a tabs
      // Si no tiene perfil, dejarlo en auth para que complete el registro
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
  // Log inicial
  useEffect(() => {
    debugLog.info('App', `Iniciando - modo: ${isDemoMode() ? 'DEMO' : 'PRUEBAS'}`);
  }, []);

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
        {/* Debug overlay - solo en modo pruebas */}
        {!isDemoMode() && <DebugOverlay />}
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
