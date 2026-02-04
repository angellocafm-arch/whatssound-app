# RESUMEN: Monetización para WhatsSound
## Análisis de 10 Referentes y Propuesta Final

---

## 📊 Comparativa de Modelos

### Splits de Plataforma

| Plataforma | Creador Recibe | Plataforma Toma | Modelo |
|------------|----------------|-----------------|--------|
| **Ko-fi** | 100% | 0% (free tier) | Micropagos |
| **Substack** | 90% | 10% | Suscripciones |
| **OnlyFans** | 80% | 20% | Suscripciones + Tips |
| **YouTube** | 70% | 30% | Revenue share |
| **Patreon** | ~85% | ~15% (10% + fees) | Suscripciones |
| **Twitch** | 50-70% | 30-50% | Subs + Tips |
| **TikTok** | ~45% | ~55% | Tips virtuales |
| **Stripe** | N/A | 2.9% + €0.25 | Procesamiento |

### Mínimos de Pago

| Plataforma | Mínimo Payout |
|------------|---------------|
| Ko-fi | Sin mínimo (PayPal) |
| OnlyFans | $20 |
| Twitch | $50 |
| YouTube | $100 |
| Patreon | ~$25-50 |

---

## 🎯 Modelos Más Relevantes para WhatsSound

### 1. Propinas en Vivo (Core Feature)
**Referentes:** Twitch (Bits), YouTube (Super Chat), TikTok (LIVE Gifts)

**Mejor práctica:** Sistema de moneda virtual con animaciones

### 2. Suscripciones a DJs
**Referentes:** Patreon, OnlyFans, Substack

**Mejor práctica:** 80-90% para creador, contenido exclusivo

### 3. Micropagos Simples
**Referentes:** Ko-fi, Buy Me a Coffee

**Mejor práctica:** Metáfora amigable ("Invítale un trago"), €5 como unidad base

---

## 💡 Propuesta de Monetización WhatsSound

### Modelo Recomendado: Híbrido

```
┌─────────────────────────────────────────────────────┐
│                  WHATSSOUND                          │
├─────────────────────────────────────────────────────┤
│  PROPINAS (Core)        │  SUSCRIPCIONES (Premium)  │
│  ─────────────────      │  ─────────────────────    │
│  Split: 80/20           │  Split: 85/15             │
│  (DJ 80%, WS 20%)       │  (DJ 85%, WS 15%)         │
│                         │                           │
│  • Durante eventos      │  • Entre eventos          │
│  • Impulso del momento  │  • Ingreso recurrente     │
│  • Animaciones en venue │  • Contenido exclusivo    │
└─────────────────────────────────────────────────────┘
```

---

## 🎵 Sistema de Propinas

### Estructura de Precios (Estilo "Invita un Trago")

| Nivel | Precio | Nombre | Efecto Visual |
|-------|--------|--------|---------------|
| 🥃 | €3 | "Shot" | Emoji flotante |
| 🍺 | €5 | "Trago" | Mensaje en pantalla |
| 🍷 | €10 | "Copa" | Animación mediana |
| 🍾 | €25 | "Botella" | Animación grande |
| 💎 | €50+ | "VIP" | Efecto especial + shoutout |

### Paquetes Prepago (Opcional)
| Paquete | Precio | Créditos | Bonus |
|---------|--------|----------|-------|
| Starter | €10 | €10 | — |
| Popular | €25 | €28 | +12% |
| Premium | €50 | €60 | +20% |

### Revenue Split Propinas

```
Fan envía propina de €10
├── Payment processing: ~€0.54 (2.9% + €0.25)
├── WhatsSound: €1.89 (20% del neto)
└── DJ recibe: €7.57 (80% del neto)

Alternativa (fees incluidos):
├── WhatsSound: €2.00 (20% flat)
└── DJ recibe: €8.00 (80% flat)
→ WhatsSound absorbe payment processing
```

---

## 📱 Sistema de Suscripciones

### Tiers para Fans

| Tier | Precio Sugerido | Incluye |
|------|-----------------|---------|
| **Free** | €0 | Seguir DJ, notificaciones básicas |
| **Fan** | €5/mes | Setlists, early access tickets, badge |
| **Superfan** | €15/mes | + Contenido exclusivo, requests priority |
| **VIP** | €30/mes | + Meet & greet virtual, tracks unreleased |

### Revenue Split Suscripciones

```
Fan paga suscripción €10/mes
├── Payment processing: ~€0.54
├── WhatsSound: €1.42 (15% del neto)
└── DJ recibe: €8.04 (85% del neto)
```

**Justificación 85/15 vs 80/20:**
- Suscripciones son recurrentes → menor fricción de cobro
- Valor más predecible → menor comisión justa
- Competir con Substack (90/10) y Patreon (~85%)

---

## 💼 Tiers para DJs (SaaS)

### Modelo Freemium + Comisión Reducida

| Plan | Precio | Comisión Propinas | Features |
|------|--------|-------------------|----------|
| **Free** | €0/mes | 20% | Perfil, propinas básicas, stats |
| **Pro** | €9.99/mes | 15% | + Analytics, badge verificado, priority support |
| **Premium** | €24.99/mes | 10% | + Custom branding, API, advanced analytics |

### Ejemplo de Ahorro para DJ

```
DJ con €1,000/mes en propinas:

Plan Free (20%): €200 para WS → DJ gana €800
Plan Pro (15%): €150 + €10 = €160 → DJ gana €840 (+€40)
Plan Premium (10%): €100 + €25 = €125 → DJ gana €875 (+€75)

Break-even Pro: €667/mes en propinas
Break-even Premium: €833/mes en propinas
```

---

## 🏢 B2B: Venues

### Pricing para Venues

| Plan | Precio | Incluye |
|------|--------|---------|
| **Starter** | Free | Widget propinas, 10 eventos/mes |
| **Growth** | €49/mes | Ilimitado, pantalla venue, analytics |
| **Enterprise** | Custom | Multi-venue, integraciones, AM dedicado |

---

## 📈 Métricas Clave (Inspirado por patio11)

### Para Seguir

| Métrica | Target Inicial |
|---------|----------------|
| **ARPU** (Avg Revenue Per DJ) | €50/mes |
| **Take Rate** | 15-20% promedio |
| **DJ Churn** | <5% mensual |
| **Tip Conversion** | 5% de asistentes |
| **Avg Tip Size** | €8-10 |

---

## 🚀 Implementación Recomendada

### Fase 1: MVP (Meses 1-3)
- [ ] Propinas simples (sin moneda virtual)
- [ ] Split 80/20 flat
- [ ] Stripe Connect integración
- [ ] Mínimo payout €20

### Fase 2: Growth (Meses 4-6)
- [ ] Animaciones en app
- [ ] Tiers de propinas
- [ ] DJ Pro plan (comisión reducida)
- [ ] Analytics básicos

### Fase 3: Scale (Meses 7-12)
- [ ] Suscripciones DJ
- [ ] Moneda virtual prepago
- [ ] B2B venue tools
- [ ] Pantalla de propinas para venues

---

## ✅ Decisiones Clave

| Decisión | Recomendación | Justificación |
|----------|---------------|---------------|
| Split propinas | **80/20** | Balance entre competitividad y sostenibilidad |
| Split suscripciones | **85/15** | Más bajo para contenido recurrente |
| Mínimo payout | **€20** | Bajo para incentivar DJs nuevos |
| Frecuencia payout | **Semanal** | Gratificación rápida |
| Moneda virtual | **Fase 2** | Empezar simple con euros directos |
| Payment processor | **Stripe Connect** | Estándar industria, Express para onboarding fácil |

---

## 📁 Archivos de Referencia

1. [Stripe Atlas](./01-stripe-atlas.md) - Infraestructura de pagos
2. [Patreon](./02-patreon.md) - Suscripciones para creadores
3. [Twitch](./03-twitch.md) - Bits y subs en streaming
4. [OnlyFans](./04-onlyfans.md) - Modelo 80/20 simple
5. [Ko-fi/BMC](./05-kofi-buymeacoffee.md) - Micropagos
6. [Substack](./06-substack.md) - 90/10 para newsletters
7. [YouTube](./07-youtube-partner-program.md) - Super Chat y memberships
8. [TikTok](./08-tiktok-creator-fund.md) - LIVE gifts
9. [Spotify](./09-spotify-royalties.md) - Modelo royalties (qué NO hacer)
10. [patio11](./10-patrick-mckenzie-patio11.md) - Pricing y SaaS wisdom

---

## 💬 Tagline de Monetización

> **"Los DJs se quedan el 80%"**
> 
> Simple, memorable, competitivo.

---

*Generado: Febrero 2026*
*Para: WhatsSound App - OpenParty*
