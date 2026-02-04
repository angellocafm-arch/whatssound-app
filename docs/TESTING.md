# TESTING.md — Guía de Pruebas WhatsSound

## Tests Disponibles

### 1. Test Flujo de Propinas
```bash
npx ts-node scripts/test-tip-flow.ts
```

Prueba el flujo completo:
- Crear transacción pending
- Verificar estado
- Confirmar pago
- Crear notificación
- Verificar audit log

### 2. Admin Simulator (Manual)

URL: `/admin/simulator`

**Tab Pagos:**
- Ver transacciones pendientes
- Confirmar (✅) → status: completed
- Fallar (❌) → status: failed + razón

**Tab Push:**
- Ver notificaciones pendientes
- Marcar como enviadas
- Enviar todas a la vez

**Tab Log:**
- Historial de acciones
- Filtrar por tipo

---

## Flujos a Probar

### Flujo Propina (Happy Path)
1. Usuario abre sesión
2. Click "💸 Propina"
3. Selecciona €5
4. Escribe mensaje
5. Click "Enviar"
6. → Estado "Procesando..."
7. Admin confirma en Simulator
8. → Confetti + éxito
9. DJ ve notificación

### Flujo Propina (Error)
1-6. Igual
7. Admin marca como fallido
8. → Mensaje de error
9. Usuario puede reintentar

### Flujo Golden Boost
1. Usuario ve "⭐ Golden Boost" disponible
2. Click en DJ favorito
3. → Animación épica
4. → Boost decrementado
5. DJ ve contador aumentado
6. Followers ven en sesión

### Flujo Golden Boost (Sin disponibles)
1. Usuario sin boosts
2. Click → "No tienes boosts"
3. Opción: comprar €4.99
4. → Flujo de compra

---

## Edge Cases

| Caso | Esperado |
|------|----------|
| Doble click propina | Rate limit (10/min) |
| Monto < €1 | Error "Mínimo €1" |
| Monto > €50 | Error "Máximo €50" |
| Propina a ti mismo | Error |
| Sin conexión | Retry automático |
| Sesión expirada | Reauth |

---

## Tarjetas de Prueba (Stripe)

| Número | Resultado |
|--------|-----------|
| 4242 4242 4242 4242 | ✅ Éxito |
| 4000 0000 0000 0002 | ❌ Rechazada |
| 4000 0025 0000 3155 | 🔐 3D Secure |

---

## Checklist Pre-Demo

### BD
- [ ] Tablas creadas
- [ ] RLS configurado
- [ ] Datos de demo cargados

### UI
- [ ] TipModal abre correctamente
- [ ] Golden Boost funciona
- [ ] Admin Simulator accesible
- [ ] Animaciones fluidas

### Flujos
- [ ] Propina completa E2E
- [ ] Golden Boost E2E
- [ ] Push notifications visibles
- [ ] Errores manejados

### Mobile
- [ ] Android preview build
- [ ] iOS (si aplica)
- [ ] Responsive web

---

## Comandos Útiles

```bash
# Servidor local
npx expo start --web

# Build producción
npx expo export --platform web

# Ver logs Supabase
# Dashboard → Logs → API

# Reset datos test
DELETE FROM ws_transactions WHERE metadata->>'test' = 'true';
DELETE FROM ws_notifications_log WHERE data->>'test' = 'true';
```

---

*Última actualización: 2026-02-04*
