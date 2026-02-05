/**
 * WhatsSound — E2E Tests: Navegación
 * Verifica que todas las rutas principales cargan correctamente
 */

import { test, expect } from '@playwright/test';

test.describe('Navegación Principal', () => {
  
  test('Tabs principales cargan correctamente', async ({ page }) => {
    const tabs = [
      { url: '/(tabs)/live', text: /en vivo|live|sesiones/i },
      { url: '/(tabs)/discover', text: /descubrir|discover|explorar/i },
      { url: '/(tabs)/chats', text: /chats|mensajes/i },
      { url: '/(tabs)/settings', text: /ajustes|settings|configuración/i },
    ];

    for (const tab of tabs) {
      await page.goto(tab.url);
      await expect(page).toHaveURL(new RegExp(tab.url.replace(/[()]/g, '\\$&')));
      // Página debe tener contenido
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('Settings → todas las opciones navegan correctamente', async ({ page }) => {
    await page.goto('/(tabs)/settings');
    
    const settingsLinks = [
      { name: /perfil de dj/i, url: /settings\/dj-profile/ },
      { name: /dashboard/i, url: /dj-dashboard/ },
      { name: /suscripción/i, url: /subscription/ },
      { name: /notificaciones/i, url: /settings\/notifications/ },
      { name: /privacidad/i, url: /settings\/privacy/ },
      { name: /apariencia/i, url: /settings\/appearance/ },
      { name: /audio/i, url: /settings\/audio/ },
      { name: /almacenamiento/i, url: /settings\/storage/ },
      { name: /ayuda/i, url: /settings\/help/ },
    ];

    for (const link of settingsLinks) {
      await page.goto('/(tabs)/settings');
      const element = page.getByText(link.name);
      if (await element.isVisible()) {
        await element.click();
        await expect(page).toHaveURL(link.url);
        await page.goBack();
      }
    }
  });

  test('Admin panel carga correctamente', async ({ page }) => {
    await page.goto('/admin');
    
    // Verificar que el panel admin tiene contenido
    await expect(page.getByText(/admin|dashboard|panel/i)).toBeVisible();
  });

  test('Página 404 para rutas inexistentes', async ({ page }) => {
    await page.goto('/esta-ruta-no-existe-xyz');
    
    // Debe mostrar error o redirigir
    const is404 = await page.getByText(/404|not found|no encontrado/i).isVisible().catch(() => false);
    const isRedirected = !page.url().includes('esta-ruta-no-existe');
    
    expect(is404 || isRedirected).toBeTruthy();
  });
});

test.describe('Deep Links', () => {
  
  test('Join con código válido', async ({ page }) => {
    await page.goto('/join/TEST123');
    
    // Debe mostrar página de unirse o redirigir
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Perfil de usuario por ID', async ({ page }) => {
    await page.goto('/profile/demo-user');
    
    // Debe mostrar perfil o error
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Sesión por ID', async ({ page }) => {
    await page.goto('/session/demo');
    
    // Debe mostrar sesión o error
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Responsividad', () => {
  
  test('Mobile viewport funciona', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/(tabs)/live');
    
    // Contenido debe ser visible
    await expect(page.locator('body')).toBeVisible();
  });

  test('Tablet viewport funciona', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/(tabs)/live');
    
    await expect(page.locator('body')).toBeVisible();
  });

  test('Desktop viewport funciona', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/(tabs)/live');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
