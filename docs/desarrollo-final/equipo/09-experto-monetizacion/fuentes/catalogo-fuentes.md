# Catálogo de Fuentes — Experto Monetización

## Los 10 Referentes

### 1. Patrick Collison (Stripe)
**Rol:** Co-Founder & CEO de Stripe
**Por qué:** Creó la infraestructura de pagos que usa el 90% de internet. Simplificó lo complejo.
**Aprendizaje clave:** "Reduce la fricción del pago a cero"

### 2. John Collison (Stripe)
**Rol:** Co-Founder & President de Stripe
**Por qué:** Arquitecto de Stripe Connect para marketplaces y creator payouts.
**Aprendizaje clave:** "El split de pagos debe ser transparente para el creador"

### 3. Jack Conte (Patreon)
**Rol:** Co-Founder & CEO de Patreon
**Por qué:** Inventó el modelo de suscripción para creadores. Músico que entendió el problema.
**Aprendizaje clave:** "Los fans pagan por relación, no por contenido"

### 4. Emmett Shear (Twitch)
**Rol:** Co-Founder & ex-CEO de Twitch
**Por qué:** Modelo de bits, subs y donaciones que genera $2B+/año para creadores.
**Aprendizaje clave:** "Múltiples formas de monetizar = más revenue total"

### 5. Patrick Campbell (ProfitWell/Paddle)
**Rol:** Founder de ProfitWell, ahora en Paddle
**Por qué:** El mayor experto en SaaS pricing. Data-driven pricing decisions.
**Aprendizaje clave:** "Price based on value, not cost"

### 6. Madhavan Ramanujam
**Rol:** Partner en Simon-Kucher, Author "Monetizing Innovation"
**Por qué:** Consultor de pricing para Fortune 500. Framework de willingness-to-pay.
**Aprendizaje clave:** "Pregunta cuánto pagarían ANTES de construir"

### 7. Kyle Poyar (OpenView)
**Rol:** Partner, Growth at OpenView Venture Partners
**Por qué:** Experto en Product-Led Growth y pricing de SaaS.
**Aprendizaje clave:** "Freemium funciona si el free es valioso y el paid es irresistible"

### 8. Tien Tzuo (Zuora)
**Rol:** Founder & CEO de Zuora
**Por qué:** Pionero en subscription economy. Ex-Salesforce CMO.
**Aprendizaje clave:** "El mundo se mueve de ownership a access"

### 9. Dan Martell
**Rol:** SaaS Coach, Author "Buy Back Your Time"
**Por qué:** Vendió 3 empresas SaaS. Experto en pricing y churn reduction.
**Aprendizaje clave:** "El precio comunica valor. Muy barato = no valioso"

### 10. Ramli John
**Rol:** Director of Content at Appcues, Author "Product-Led Onboarding"
**Por qué:** Especialista en conversión de free a paid.
**Aprendizaje clave:** "El onboarding define la conversión"

---

## Fuentes Secundarias

| Recurso | Tipo | Uso |
|---------|------|-----|
| Stripe Docs | Docs | Implementación técnica |
| Stripe Atlas | Guides | Mejores prácticas |
| ProfitWell Blog | Blog | Pricing research |
| Paddle Blog | Blog | SaaS metrics |
| Lenny's Newsletter | Newsletter | Pricing case studies |
| Reforge - Monetization | Curso | Frameworks |
| Price Intelligently | Tool | Análisis de pricing |

---

## Modelos de Monetización para WhatsSound

### 1. Propinas (Tips)
```
Usuario → DJ
WhatsSound fee: 15-20%
Stripe fee: 2.9% + €0.25
```

### 2. Golden Boost Comprado
```
Precio: €4.99/unidad
100% a WhatsSound
Margen después de Stripe: ~€4.55
```

### 3. Patrocinio Permanente
```
Precio: €19.99 (one-time)
100% a WhatsSound
Margen después de Stripe: ~€19.15
```

### 4. Suscripciones a DJ (futuro)
```
Tiers: €2.99 / €4.99 / €9.99 mensual
Split: 70% DJ, 30% WhatsSound
Recurring revenue = estabilidad
```

### 5. WhatsSound Premium (futuro)
```
Precio: €4.99/mes
Sin ads, features exclusivos
100% a WhatsSound
```

---

## Stripe Integration Checklist

- [ ] Stripe Account setup
- [ ] Stripe Connect para DJ payouts
- [ ] Payment Intents API
- [ ] Webhooks para confirmar pagos
- [ ] Subscriptions API (futuro)
- [ ] Customer Portal
- [ ] Invoicing automático
- [ ] Tax calculation (Stripe Tax)
- [ ] Fraud detection (Radar)
- [ ] PCI compliance (Stripe handles it)

---

## Métricas Clave

| Métrica | Target inicial |
|---------|----------------|
| Conversion rate (free→paid) | >3% |
| ARPU (Average Revenue Per User) | >€2/mes |
| ARPPU (Paying Users) | >€15/mes |
| Churn (subs) | <8%/mes |
| LTV:CAC ratio | >3:1 |
