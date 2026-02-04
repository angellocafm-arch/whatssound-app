# STRIPE-READY.md — Guía de Migración a Stripe

## Estado Actual

El sistema de pagos está **completamente funcional en modo simulado**.

- ✅ Base de datos lista (`ws_transactions`, `ws_audit_log`)
- ✅ UI de pagos (TipModal, Admin Simulator)
- ✅ Flujo completo (crear → confirmar → notificar)
- ✅ Rate limiting y validaciones
- ⏳ **Falta**: Integrar Stripe real

---

## Pasos para Activar Stripe

### 1. Crear Cuenta Stripe

1. Ir a [dashboard.stripe.com](https://dashboard.stripe.com)
2. Crear cuenta business para España
3. Completar verificación KYC
4. Activar modo Live

### 2. Crear Productos

En Stripe Dashboard → Products:

| Producto | Precio | ID sugerido |
|----------|--------|-------------|
| Golden Boost Extra | €4.99 | price_golden_boost |
| Patrocinio Permanente | €19.99 | price_permanent_sponsor |

Las propinas son custom (€1-50).

### 3. Configurar Variables de Entorno

```bash
# .env.local (desarrollo)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Vercel (producción)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### 4. Instalar Dependencias

```bash
npm install stripe @stripe/stripe-js @stripe/react-stripe-js
```

### 5. Activar Modo Real

En `src/lib/stripe-adapter.ts`:

```typescript
const MOCK_MODE = false; // Cambiar de true a false
```

### 6. Configurar Webhook

1. Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://whatssound-app.vercel.app/api/webhooks/stripe`
3. Eventos a escuchar:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

### 7. Crear Endpoint de Webhook

Crear `app/api/webhooks/stripe+api.ts`:

```typescript
import Stripe from 'stripe';
import { confirmPayment, failPayment } from '../../../src/lib/payments';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook Error', { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const pi = event.data.object as Stripe.PaymentIntent;
      if (pi.metadata.transaction_id) {
        await confirmPayment(pi.metadata.transaction_id);
      }
      break;
    case 'payment_intent.payment_failed':
      const failedPi = event.data.object as Stripe.PaymentIntent;
      if (failedPi.metadata.transaction_id) {
        await failPayment(failedPi.metadata.transaction_id, 'payment_failed');
      }
      break;
  }

  return new Response('OK', { status: 200 });
}
```

---

## Testing

### Tarjetas de Prueba Stripe

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | Éxito |
| 4000 0000 0000 0002 | Rechazada |
| 4000 0025 0000 3155 | Requiere 3D Secure |

### Probar Webhook Localmente

```bash
# Instalar Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks
stripe listen --forward-to localhost:8081/api/webhooks/stripe
```

---

## Flujo de Pago Final

```
1. Usuario abre TipModal
2. Selecciona monto → createTip() → status: pending
3. Stripe.js carga → PaymentElement
4. Usuario ingresa tarjeta
5. Stripe procesa → webhook → confirmPayment()
6. DJ recibe notificación push
7. Confetti en UI 🎉
```

---

## Comisiones

| Tipo | Usuario paga | DJ recibe | WhatsSound |
|------|-------------|-----------|------------|
| Propina €10 | €10 | €8.50 (85%) | €1.50 (15%) |
| Golden Boost | €4.99 | - | €4.99 (100%) |
| Patrocinio | €19.99 | - | €19.99 (100%) |

Stripe cobra ~2.9% + €0.25 adicional por transacción.

---

## Checklist Pre-Launch

- [ ] Cuenta Stripe verificada
- [ ] Productos creados
- [ ] Variables de entorno en Vercel
- [ ] Webhook configurado
- [ ] Test con tarjeta real (modo test → live)
- [ ] Legal: Términos y condiciones actualizados
- [ ] Legal: Política de reembolsos

---

*Última actualización: 2026-02-04*
