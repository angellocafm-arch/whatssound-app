# Supabase Security Team - RLS Patterns

## Row Level Security (RLS)

### Qué es RLS
RLS es una característica de PostgreSQL que permite definir políticas que controlan qué filas puede ver o modificar cada usuario. Es la capa de seguridad más importante en Supabase.

## Patrones de RLS Recomendados

### 1. Wrapper con SELECT
**Siempre envolver funciones en `(select ...)`**

```sql
-- ❌ Mal: función llamada por cada fila
CREATE POLICY "example" ON table
USING (auth.uid() = user_id);

-- ✅ Bien: función cacheada por statement
CREATE POLICY "example" ON table
USING ((select auth.uid()) = user_id);
```
**Impacto:** Hasta 99.94% mejora en rendimiento

### 2. Índices en Columnas de Políticas
```sql
-- Agregar índice en columnas usadas en policies
CREATE INDEX idx_table_user_id ON table(user_id);
```

### 3. Especificar Roles
```sql
-- ✅ Especificar el rol explícitamente
CREATE POLICY "Users can view" ON table
FOR SELECT
TO authenticated  -- O anon
USING (...);
```

### 4. Evitar Joins en Políticas
```sql
-- ❌ Mal: join en la policy
USING (
  (select auth.uid()) IN (
    SELECT user_id FROM team_users
    WHERE team_users.team_id = table.team_id
  )
);

-- ✅ Bien: invertir el join
USING (
  team_id IN (
    SELECT team_id FROM team_users
    WHERE user_id = (select auth.uid())
  )
);
```

### 5. Security Definer Functions
```sql
-- Para bypasear RLS en operaciones específicas
CREATE FUNCTION private.check_access(...)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta como el creador
AS $$
BEGIN
  -- Lógica compleja sin penalización de RLS
END;
$$;

-- Usarla en policy
USING ((select private.check_access(...)));
```

### 6. Policies por Operación
```sql
-- Policies separadas para cada operación
CREATE POLICY "select_policy" ON table FOR SELECT ...
CREATE POLICY "insert_policy" ON table FOR INSERT ...
CREATE POLICY "update_policy" ON table FOR UPDATE ...
CREATE POLICY "delete_policy" ON table FOR DELETE ...
```

## Checklist RLS para WhatsSound

### Optimización de Performance
- [ ] Envolver `auth.uid()` en `(select ...)` en todas las policies
- [ ] Verificar índices en columnas de policies
- [ ] Evitar joins complejos en policies
- [ ] Usar security definer para lógica compleja

### Cobertura de Seguridad
- [x] RLS habilitado en ws_profiles
- [x] RLS habilitado en ws_sessions
- [x] RLS habilitado en ws_session_members
- [x] RLS habilitado en ws_songs
- [x] RLS habilitado en ws_votes
- [x] RLS habilitado en ws_tips
- [x] RLS habilitado en ws_messages
- [x] RLS habilitado en ws_reactions
- [x] RLS habilitado en ws_now_playing
- [x] RLS habilitado en ws_reports
- [x] RLS habilitado en ws_follows
- [x] RLS habilitado en ws_user_settings
- [x] RLS habilitado en ws_session_ratings
- [x] RLS habilitado en ws_payment_methods
- [x] RLS habilitado en ws_dj_stripe_accounts
- [x] RLS habilitado en ws_dj_payouts
- [x] RLS habilitado en ws_hourly_stats

### Políticas Críticas a Revisar
- [ ] `ws_tips`: Solo sender/receiver pueden ver
- [ ] `ws_payment_methods`: Solo owner puede ver/modificar
- [ ] `ws_dj_stripe_accounts`: Solo DJ puede ver su cuenta
- [ ] `ws_dj_payouts`: Solo DJ puede ver sus pagos
- [ ] `ws_reports`: Reporter ve sus reports

### Service Role
- [ ] Service role solo usado en backend
- [ ] Variables SUPABASE_SERVICE_KEY nunca en frontend
- [ ] Edge functions usan service role correctamente

## Auditoría de Policies Actuales de WhatsSound

### Análisis de Seguridad

#### ws_profiles (4 policies)
- ✅ SELECT público (necesario para mostrar DJs)
- ✅ UPDATE solo owner
- ✅ INSERT solo owner

#### ws_sessions (3 policies)
- ✅ SELECT público (listar sesiones)
- ✅ INSERT solo si auth.uid() = dj_id
- ✅ UPDATE solo DJ owner

#### ws_tips (2 policies)
- ✅ SELECT solo sender/receiver
- ✅ INSERT solo si auth.uid() = sender_id
- ⚠️ Falta: Verificar que receiver sea DJ de sesión activa

#### ws_payment_methods (4 policies)
- ✅ SELECT solo owner
- ✅ INSERT/UPDATE/DELETE solo owner
- ✅ Datos de Stripe protegidos

### Recomendaciones de Mejora

1. **Optimizar auth.uid()**
```sql
-- Cambiar todas las policies de:
USING (auth.uid() = user_id)
-- A:
USING ((select auth.uid()) = user_id)
```

2. **Agregar índices faltantes**
```sql
CREATE INDEX IF NOT EXISTS idx_tips_sender ON ws_tips(sender_id);
CREATE INDEX IF NOT EXISTS idx_tips_receiver ON ws_tips(receiver_id);
```

3. **Policy más restrictiva para tips**
```sql
-- Validar que el tip sea a un DJ de sesión activa
CREATE POLICY "Tips to active session DJ" ON ws_tips
FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM ws_sessions 
    WHERE id = session_id 
    AND dj_id = receiver_id 
    AND is_active = true
  )
);
```

## Recursos
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://github.com/GaryAustin1/RLS-Performance
