/**
 * WhatsSound — useDeepLinking
 * Manejo de deep links y universal links
 */

import { useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

export function useDeepLinking() {
  const router = useRouter();

  const handleUrl = useCallback((url: string) => {
    console.log('[DeepLink] Received:', url);
    
    try {
      const parsed = Linking.parse(url);
      const { path, queryParams } = parsed;
      
      if (!path) return;

      // whatssound://session/abc123 o https://whatssound-app.vercel.app/join/abc123
      if (path.startsWith('session/') || path.startsWith('join/')) {
        const sessionId = path.split('/')[1];
        if (sessionId) {
          console.log('[DeepLink] Opening session:', sessionId);
          router.push(`/session/${sessionId}`);
          return;
        }
      }

      // whatssound://profile/xyz
      if (path.startsWith('profile/')) {
        const profileId = path.split('/')[1];
        if (profileId) {
          console.log('[DeepLink] Opening profile:', profileId);
          router.push(`/profile/${profileId}`);
          return;
        }
      }

      // whatssound://scheduled/abc123
      if (path.startsWith('scheduled/')) {
        const scheduledId = path.split('/')[1];
        if (scheduledId) {
          console.log('[DeepLink] Opening scheduled session:', scheduledId);
          router.push(`/session/scheduled/${scheduledId}`);
          return;
        }
      }

      // whatssound://dj/xyz
      if (path.startsWith('dj/')) {
        const djId = path.split('/')[1];
        if (djId) {
          console.log('[DeepLink] Opening DJ profile:', djId);
          router.push(`/profile/dj-public?id=${djId}`);
          return;
        }
      }

      console.log('[DeepLink] Unknown path:', path);
    } catch (error) {
      console.error('[DeepLink] Parse error:', error);
    }
  }, [router]);

  useEffect(() => {
    // Manejar deep links cuando la app está abierta
    const subscription = Linking.addEventListener('url', (event) => {
      handleUrl(event.url);
    });

    // Manejar deep link inicial (app estaba cerrada)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [handleUrl]);
}

/**
 * Generar URL de deep link para compartir
 */
export function createShareUrl(type: 'session' | 'profile' | 'scheduled' | 'dj', id: string): string {
  const baseUrl = 'https://whatssound-app.vercel.app';
  
  switch (type) {
    case 'session':
      return `${baseUrl}/join/${id}`;
    case 'profile':
      return `${baseUrl}/u/${id}`;
    case 'scheduled':
      return `${baseUrl}/event/${id}`;
    case 'dj':
      return `${baseUrl}/dj/${id}`;
    default:
      return baseUrl;
  }
}

/**
 * Generar URL de deep link nativo (para testing)
 */
export function createNativeUrl(type: 'session' | 'profile' | 'scheduled' | 'dj', id: string): string {
  const scheme = 'whatssound://';
  
  switch (type) {
    case 'session':
      return `${scheme}session/${id}`;
    case 'profile':
      return `${scheme}profile/${id}`;
    case 'scheduled':
      return `${scheme}scheduled/${id}`;
    case 'dj':
      return `${scheme}dj/${id}`;
    default:
      return scheme;
  }
}

export default useDeepLinking;
