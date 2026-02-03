# Reunión 4: PROPINAS Y PAGOS — 3 Pantallas

**Fecha:** 3 Feb 2026

## 👥 Participantes
- 12-Monetización Pagos
- 02-Arquitecto Backend
- 17-Seguridad Legal
- 07-CraftMaster (Producto)

---

## 🎯 ESPECIFICACIONES FINALES

### 7.1 Enviar Propina (Modal)
```
Trigger: Botón "💰 Propina" en sesión
Montos predefinidos: €1, €2, €5, €10, €20
Monto personalizado: Input libre (min €0.50, max €100)
Mensaje opcional: Max 100 chars
Checkbox: ☐ Propina anónima
Preview: "Enviarás €X a [DJ Name]"
Pago: Stripe Payment Sheet (Apple Pay, Google Pay, tarjeta)
Confirmación: Animación de confetti + mensaje en chat
Fee estructura:
  - Stripe: 2.9% + €0.25
  - WhatsSound: 10%
  - DJ recibe: ~87%
```

### 7.2 Historial de Propinas
```
Acceso: Perfil → Mis propinas
Tabs: Enviadas | Recibidas (si es DJ)
Por cada propina:
  - Fecha/hora
  - Monto
  - A quién / De quién
  - Sesión
  - Mensaje (si hay)
Filtros: Por fecha, por monto
Export: CSV para DJs (tax purposes)
```

### 7.3 Configurar Pagos
```
Acceso: Perfil → Pagos
Para usuarios:
  - Métodos guardados (tarjetas)
  - Añadir/eliminar método
  - Historial de compras
Para DJs:
  - Conectar cuenta Stripe (Stripe Connect Express)
  - Ver balance pendiente
  - Solicitar retiro (min €10)
  - Historial de pagos recibidos
  - Documentos fiscales
```

---

## 🛠️ Dependencias
```bash
npm install @stripe/stripe-react-native
# Configurar Stripe Connect en dashboard
```

### Tablas Supabase (existentes)
- `ws_tips` — Ya tiene campos necesarios
- Nueva: `ws_payment_methods` (user_id, stripe_pm_id, last4, brand)
- Nueva: `ws_dj_payouts` (dj_id, amount, status, stripe_transfer_id)
