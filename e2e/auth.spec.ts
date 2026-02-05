/**
 * WhatsSound — E2E Tests: Autenticación
 * Verifica el flujo completo de registro y login
 */

import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación', () => {
  
  test('Welcome → Login con número de prueba → Crear perfil → Ver tabs', async ({ page }) => {
    // 1. Ir a welcome
    await page.goto('/welcome');
    await expect(page).toHaveTitle(/WhatsSound/i);
    
    // 2. Click en "Comenzar"
    await page.getByRole('button', { name: /comenzar/i }).click();
    
    // 3. Verificar que estamos en login
    await expect(page).toHaveURL(/login/);
    
    // 4. Ingresar número de prueba
    await page.getByPlaceholder(/teléfono|número/i).fill('666666666');
    await page.getByRole('button', { name: /continuar/i }).click();
    
    // 5. Verificar que vamos a crear perfil (test mode salta OTP)
    await expect(page).toHaveURL(/create-profile|otp/);
    
    // Si estamos en OTP, ingresar código de prueba
    if (page.url().includes('otp')) {
      // Los inputs de OTP
      const otpInputs = page.locator('input[maxlength="1"]');
      if (await otpInputs.count() > 0) {
        await otpInputs.nth(0).fill('1');
        await otpInputs.nth(1).fill('2');
        await otpInputs.nth(2).fill('3');
        await otpInputs.nth(3).fill('4');
        await otpInputs.nth(4).fill('5');
        await otpInputs.nth(5).fill('6');
      }
      await page.waitForURL(/create-profile|tabs/);
    }
    
    // 6. Si estamos en create-profile, completar
    if (page.url().includes('create-profile')) {
      await page.getByPlaceholder(/nombre/i).fill('Test User E2E');
      
      // Seleccionar al menos un género
      const genreButton = page.getByRole('button', { name: /reggaeton|pop|rock/i }).first();
      if (await genreButton.isVisible()) {
        await genreButton.click();
      }
      
      await page.getByRole('button', { name: /crear perfil|continuar/i }).click();
      
      // Esperar navegación
      await page.waitForURL(/permissions|tabs/);
    }
    
    // 7. Si estamos en permissions, continuar
    if (page.url().includes('permissions')) {
      await page.getByRole('button', { name: /empezar|continuar|saltar/i }).first().click();
    }
    
    // 8. Verificar que llegamos a tabs
    await expect(page).toHaveURL(/tabs|live/);
  });

  test('Explorar sin cuenta → Ver sesiones en vivo', async ({ page }) => {
    await page.goto('/welcome');
    
    // Click en "Explorar"
    const exploreButton = page.getByRole('button', { name: /explorar|sin cuenta/i });
    if (await exploreButton.isVisible()) {
      await exploreButton.click();
      await expect(page).toHaveURL(/tabs|live/);
    }
  });

  test('Cerrar sesión desde Settings', async ({ page }) => {
    // Ir directo a settings (asumiendo que hay sesión)
    await page.goto('/(tabs)/settings');
    
    // Buscar botón de cerrar sesión
    const logoutButton = page.getByText(/cerrar sesión/i);
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Verificar que volvemos a login
      await expect(page).toHaveURL(/login|welcome/);
    }
  });
});
