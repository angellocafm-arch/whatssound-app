/**
 * WhatsSound — Stripe Adapter
 * Adaptador simulado de Stripe para desarrollo
 * 
 * En producción: reemplazar por Stripe SDK real
 * npm install @stripe/stripe-js stripe
 */

// ============================================
// MOCK MODE - CAMBIAR A FALSE EN PRODUCCIÓN
// ============================================
const MOCK_MODE = true;

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  client_secret: string;
  metadata?: Record<string, string>;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

// ============================================
// MOCK IMPLEMENTATIONS
// ============================================

function generateMockId(prefix: string): string {
  return `${prefix}_mock_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const mockPayments: Map<string, PaymentIntent> = new Map();
const mockCustomers: Map<string, Customer> = new Map();

// ============================================
// PUBLIC API
// ============================================

/**
 * Crear un PaymentIntent
 * En producción: stripe.paymentIntents.create()
 */
export async function createPaymentIntent(
  amount: number,
  currency: string = 'eur',
  metadata?: Record<string, string>
): Promise<PaymentIntent> {
  if (MOCK_MODE) {
    const intent: PaymentIntent = {
      id: generateMockId('pi'),
      amount,
      currency,
      status: 'requires_confirmation',
      client_secret: generateMockId('pi_secret'),
      metadata,
    };
    mockPayments.set(intent.id, intent);
    console.log('[Stripe Mock] PaymentIntent created:', intent.id);
    return intent;
  }

  // PRODUCCIÓN: Descomentar cuando Stripe esté configurado
  // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  // return stripe.paymentIntents.create({ amount, currency, metadata });
  throw new Error('Stripe not configured');
}

/**
 * Confirmar un PaymentIntent (simula pago exitoso)
 * En producción: stripe.paymentIntents.confirm()
 */
export async function confirmPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
  if (MOCK_MODE) {
    const intent = mockPayments.get(paymentIntentId);
    if (!intent) {
      throw new Error('PaymentIntent not found');
    }
    intent.status = 'succeeded';
    mockPayments.set(paymentIntentId, intent);
    console.log('[Stripe Mock] PaymentIntent confirmed:', paymentIntentId);
    return intent;
  }

  throw new Error('Stripe not configured');
}

/**
 * Cancelar un PaymentIntent
 */
export async function cancelPaymentIntent(paymentIntentId: string): Promise<PaymentIntent> {
  if (MOCK_MODE) {
    const intent = mockPayments.get(paymentIntentId);
    if (!intent) {
      throw new Error('PaymentIntent not found');
    }
    intent.status = 'canceled';
    mockPayments.set(paymentIntentId, intent);
    console.log('[Stripe Mock] PaymentIntent canceled:', paymentIntentId);
    return intent;
  }

  throw new Error('Stripe not configured');
}

/**
 * Obtener un PaymentIntent
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<PaymentIntent | null> {
  if (MOCK_MODE) {
    return mockPayments.get(paymentIntentId) || null;
  }

  throw new Error('Stripe not configured');
}

/**
 * Crear o recuperar un Customer
 * En producción: stripe.customers.create() / retrieve()
 */
export async function getOrCreateCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Customer> {
  if (MOCK_MODE) {
    let customer = mockCustomers.get(userId);
    if (!customer) {
      customer = {
        id: generateMockId('cus'),
        email,
        name,
        metadata: { user_id: userId },
      };
      mockCustomers.set(userId, customer);
      console.log('[Stripe Mock] Customer created:', customer.id);
    }
    return customer;
  }

  throw new Error('Stripe not configured');
}

// ============================================
// WEBHOOKS (para procesar eventos de Stripe)
// ============================================

export type StripeEventType = 
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'customer.subscription.created'
  | 'customer.subscription.deleted';

export interface StripeEvent {
  id: string;
  type: StripeEventType;
  data: {
    object: PaymentIntent | any;
  };
}

/**
 * Verificar firma de webhook
 * En producción: stripe.webhooks.constructEvent()
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  endpointSecret: string
): StripeEvent | null {
  if (MOCK_MODE) {
    // En mock, simplemente parseamos el payload
    try {
      return JSON.parse(payload) as StripeEvent;
    } catch {
      return null;
    }
  }

  throw new Error('Stripe not configured');
}

// ============================================
// HELPER: Simular webhook event (solo desarrollo)
// ============================================

export function simulateWebhookEvent(
  type: StripeEventType,
  data: any
): StripeEvent {
  return {
    id: generateMockId('evt'),
    type,
    data: { object: data },
  };
}

// ============================================
// CONSTANTES DE CONFIGURACIÓN
// ============================================

export const STRIPE_CONFIG = {
  // Productos y precios (IDs de Stripe)
  products: {
    goldenBoost: 'prod_golden_boost',
    permanentSponsor: 'prod_permanent_sponsor',
  },
  prices: {
    goldenBoost: 'price_golden_boost_499',
    permanentSponsor: 'price_permanent_sponsor_1999',
  },
  // Comisiones
  platformFeePercent: 15, // 15% para WhatsSound en propinas
};

/**
 * Documentación para migrar a Stripe real:
 * 
 * 1. Instalar dependencias:
 *    npm install stripe @stripe/stripe-js
 * 
 * 2. Configurar variables de entorno:
 *    STRIPE_SECRET_KEY=sk_live_xxx
 *    STRIPE_PUBLISHABLE_KEY=pk_live_xxx
 *    STRIPE_WEBHOOK_SECRET=whsec_xxx
 * 
 * 3. Cambiar MOCK_MODE = false
 * 
 * 4. Crear productos en Stripe Dashboard:
 *    - Golden Boost: €4.99
 *    - Permanent Sponsor: €19.99
 * 
 * 5. Configurar webhook en Stripe:
 *    URL: https://whatssound-app.vercel.app/api/webhooks/stripe
 *    Events: payment_intent.succeeded, payment_intent.payment_failed
 */
