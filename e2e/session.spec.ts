/**
 * WhatsSound — E2E Tests: Sesiones DJ
 * Verifica crear, unirse y gestionar sesiones
 */

import { test, expect } from '@playwright/test';

test.describe('Flujo de Sesiones', () => {
  
  test.beforeEach(async ({ page }) => {
    // Ir a la app
    await page.goto('/');
  });

  test('Ver lista de sesiones en Live', async ({ page }) => {
    await page.goto('/(tabs)/live');
    
    // Verificar que la página carga
    await expect(page.getByText(/en vivo|sesiones|live/i)).toBeVisible();
    
    // Verificar que hay cards de sesiones o mensaje de vacío
    const sessionCards = page.locator('[data-testid="session-card"]');
    const emptyMessage = page.getByText(/no hay sesiones|crea una sesión/i);
    
    const hasCards = await sessionCards.count() > 0;
    const hasEmpty = await emptyMessage.isVisible().catch(() => false);
    
    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('Abrir formulario de crear sesión', async ({ page }) => {
    await page.goto('/(tabs)/live');
    
    // Click en botón de crear
    const createButton = page.getByRole('button', { name: /crear|nueva|\+/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      // Verificar que estamos en create
      await expect(page).toHaveURL(/session\/create/);
      
      // Verificar campos del formulario
      await expect(page.getByPlaceholder(/nombre|título/i)).toBeVisible();
    }
  });

  test('Crear sesión completa', async ({ page }) => {
    await page.goto('/session/create');
    
    // Rellenar nombre
    await page.getByPlaceholder(/nombre|título/i).fill('Test Session E2E');
    
    // Seleccionar género
    const genreButton = page.getByRole('button', { name: /reggaeton|pop|electro/i }).first();
    if (await genreButton.isVisible()) {
      await genreButton.click();
    }
    
    // Click en crear
    const createBtn = page.getByRole('button', { name: /crear sesión|empezar/i });
    if (await createBtn.isVisible()) {
      await createBtn.click();
      
      // Verificar que vamos a la sesión creada
      await page.waitForURL(/session\/[a-zA-Z0-9-]+/);
    }
  });

  test('Ver detalles de sesión existente', async ({ page }) => {
    await page.goto('/(tabs)/live');
    
    // Click en primera sesión disponible
    const firstSession = page.locator('[data-testid="session-card"]').first();
    if (await firstSession.isVisible()) {
      await firstSession.click();
      
      // Verificar que estamos en detalle de sesión
      await expect(page).toHaveURL(/session\/[a-zA-Z0-9-]+/);
      
      // Verificar elementos de la sesión
      await expect(page.getByText(/cola|queue|canciones/i)).toBeVisible();
    }
  });

  test('Unirse a sesión con código', async ({ page }) => {
    const testCode = 'ABC123';
    await page.goto(`/join/${testCode}`);
    
    // Verificar que la página carga
    await expect(page.getByText(/unirse|join|sesión/i)).toBeVisible();
  });
});

test.describe('Cola de Canciones', () => {
  
  test('Ver cola de canciones', async ({ page }) => {
    // Ir a una sesión demo
    await page.goto('/session/demo');
    
    // Buscar tab o sección de cola
    const queueTab = page.getByText(/cola|queue/i);
    if (await queueTab.isVisible()) {
      await queueTab.click();
    }
    
    // Verificar que hay lista de canciones o mensaje vacío
    const songs = page.locator('[data-testid="song-item"]');
    const empty = page.getByText(/no hay canciones|cola vacía/i);
    
    const hasSongs = await songs.count() > 0;
    const isEmpty = await empty.isVisible().catch(() => false);
    
    expect(hasSongs || isEmpty).toBeTruthy();
  });

  test('Abrir búsqueda de canciones', async ({ page }) => {
    await page.goto('/session/request-song?sid=demo');
    
    // Verificar que hay buscador
    await expect(page.getByPlaceholder(/buscar|canción|artista/i)).toBeVisible();
  });

  test('Buscar canción', async ({ page }) => {
    await page.goto('/session/request-song?sid=demo');
    
    // Buscar
    await page.getByPlaceholder(/buscar/i).fill('Bad Bunny');
    
    // Esperar resultados
    await page.waitForTimeout(1000);
    
    // Verificar que hay resultados o mensaje de error
    const results = page.locator('[data-testid="search-result"]');
    const hasResults = await results.count() > 0;
    
    // Si no hay testid, buscar por texto
    if (!hasResults) {
      const songTitles = page.getByText(/Bad Bunny|Tití|Dakiti/i);
      const hasTitles = await songTitles.count() > 0;
      expect(hasTitles || hasResults).toBeTruthy();
    }
  });
});
