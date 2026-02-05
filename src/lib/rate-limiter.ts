/**
 * WhatsSound — Rate Limiter
 * Previene spam y abuso de endpoints sensibles
 * 
 * Límites por defecto:
 * - Pagos: 10/minuto por usuario
 * - Chat: 60/minuto por usuario
 * - API general: 100/minuto por IP
 */

// In-memory store (en producción usar Redis)
const rateLimitStore: Map<string, { count: number; resetAt: number }> = new Map();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Ventana de tiempo en ms
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  payments: { maxRequests: 10, windowMs: 60000 },      // 10/min
  goldenBoost: { maxRequests: 5, windowMs: 60000 },   // 5/min
  chat: { maxRequests: 60, windowMs: 60000 },         // 60/min
  reactions: { maxRequests: 30, windowMs: 60000 },    // 30/min
  api: { maxRequests: 100, windowMs: 60000 },         // 100/min
};

/**
 * Verifica si una acción está dentro del límite
 * @returns true si está permitido, false si excede el límite
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[action];
  const key = `${action}:${identifier}`;
  const now = Date.now();

  const current = rateLimitStore.get(key);

  // Limpiar si la ventana expiró
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Verificar límite
  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: current.resetAt - now,
    };
  }

  // Incrementar contador
  current.count++;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetIn: current.resetAt - now,
  };
}

/**
 * Middleware de rate limiting para pagos
 */
export function checkPaymentRateLimit(userId: string): { allowed: boolean; error?: string } {
  const result = checkRateLimit(userId, 'payments');
  
  if (!result.allowed) {
    return {
      allowed: false,
      error: `Demasiadas solicitudes. Intenta de nuevo en ${Math.ceil(result.resetIn / 1000)} segundos.`,
    };
  }

  return { allowed: true };
}

/**
 * Valida montos de pago
 */
export function validatePaymentAmount(
  amountCents: number,
  type: 'tip' | 'golden_boost' | 'permanent_sponsor'
): { valid: boolean; error?: string } {
  const limits = {
    tip: { min: 100, max: 5000 },           // €1 - €50
    golden_boost: { min: 499, max: 499 },   // €4.99 fijo
    permanent_sponsor: { min: 999, max: 9999 }, // €9.99 - €99.99
  };

  const limit = limits[type];

  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    return { valid: false, error: 'Monto inválido' };
  }

  if (amountCents < limit.min) {
    return { valid: false, error: `Monto mínimo: €${(limit.min / 100).toFixed(2)}` };
  }

  if (amountCents > limit.max) {
    return { valid: false, error: `Monto máximo: €${(limit.max / 100).toFixed(2)}` };
  }

  return { valid: true };
}

/**
 * Valida que un usuario tenga Golden Boost disponible
 */
export async function validateGoldenBoostAvailable(
  userId: string,
  supabase: unknown
): Promise<{ valid: boolean; error?: string; available?: number }> {
  const { data: profile, error } = await supabase
    .from('ws_profiles')
    .select('golden_boosts_available')
    .eq('id', userId)
    .single();

  if (error || !profile) {
    return { valid: false, error: 'Usuario no encontrado' };
  }

  if (profile.golden_boosts_available <= 0) {
    return {
      valid: false,
      error: 'No tienes Golden Boosts disponibles. Se regeneran cada domingo.',
      available: 0,
    };
  }

  return { valid: true, available: profile.golden_boosts_available };
}

/**
 * Limpia entradas expiradas del store (llamar periódicamente)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

// Limpiar cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}
