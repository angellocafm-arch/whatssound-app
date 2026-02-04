# Stripe Atlas / Stripe Payments
## Creator Economy Infrastructure

### Perfil
- **Empresa:** Stripe Inc.
- **Producto:** Stripe Atlas (incorporación) + Stripe Payments (procesamiento)
- **Enfoque:** Infraestructura financiera para la creator economy
- **Clientes notables:** Linear, Cursor, RevenueCat, Runway

### Modelo de Monetización

#### Stripe Atlas (Incorporación)
- **Precio único:** $500 para incorporar empresa en Delaware
- **Incluye:** Incorporación, EIN, equity para founders, 83(b) election
- **Créditos:** $2,500 en productos Stripe + $50k en descuentos de partners

#### Stripe Payments (Procesamiento)
| Tipo de Pago | Comisión |
|--------------|----------|
| Tarjetas UK | 2.5% + €0.25 |
| Tarjetas internacionales | 3.25% + €0.25 |
| Conversión de divisa | +2% adicional |
| Pagos presenciales EEA | 1.4% + €0.10 |
| Pagos presenciales no-EEA | 2.9% + €0.10 |

#### Stripe Connect (Plataformas/Marketplaces)
- **Modelo estándar:** Stripe cobra fees directamente a usuarios
- **Modelo personalizado:** 0.25%+ fee base para plataformas que definen su propio pricing
- **Revenue share disponible:** Para plataformas que procesan volumen

#### Otros Productos Relevantes
- **Billing (Suscripciones):** 0.7% del volumen o desde €500/mes
- **Invoicing:** 0.4% por transacción (cap €2)
- **Tax:** 0.5% por transacción donde estés registrado

### Mínimos de Pago
- **Sin mínimo de pago** para empezar
- **Payouts:** Transferencia bancaria estándar (2-7 días hábiles)
- **Instant Payouts:** Disponible con fee adicional (1%)

### Lecciones para WhatsSound

#### Modelo Connect para Propinas DJ
```
Fan paga propina → Stripe procesa → WhatsSound toma X% → DJ recibe resto
```

**Ventajas:**
- Stripe maneja toda la complejidad de pagos
- Cumplimiento regulatorio incluido
- Soporte para múltiples países y divisas
- Dashboard para DJs ver sus ganancias

**Configuración recomendada:**
- Usar Stripe Connect en modo "Express"
- Onboarding simplificado para DJs
- Split automático de pagos
- WhatsSound puede definir su comisión (5-15%)

#### Revenue Share
- Stripe ofrece revenue share a plataformas con volumen
- Potencial ingreso adicional para WhatsSound por volumen procesado

### Propuesta para WhatsSound

| Concepto | Sugerencia |
|----------|------------|
| Procesador de pagos | Stripe Connect |
| Comisión WhatsSound | 10-15% de propinas |
| Comisión Stripe | ~2.9% + €0.25 |
| DJ recibe | 75-85% neto |
| Mínimo retiro DJ | €10 |
| Frecuencia payout | Semanal o mensual |

### Links
- [Stripe Atlas](https://stripe.com/atlas)
- [Stripe Pricing](https://stripe.com/pricing)
- [Stripe Connect](https://stripe.com/connect)
