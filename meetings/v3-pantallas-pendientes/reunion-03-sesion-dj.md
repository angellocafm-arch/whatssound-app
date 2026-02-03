# Reunión 3: SESIÓN DJ — 2 Pantallas

**Fecha:** 3 Feb 2026

## 👥 Participantes
- 01-Arquitecto Frontend
- 07-CraftMaster (Producto)
- 08-Dashboard Analytics

---

## 🎯 ESPECIFICACIONES FINALES

### 4.5 DJ Anunciar (Modal)
```
Trigger: Botón "Anunciar" en panel DJ
Tipos de anuncio:
  1. Texto destacado (aparece en chat como sistema)
  2. Cambio de género/mood
  3. "Última canción" warning
  4. Promoción (link externo)
Input: Textarea max 200 chars
Preview: Cómo se verá en el chat
Cooldown: 1 anuncio cada 5 minutos
```

### 4.6 DJ Stats Detalladas
```
Acceso: Tab "Stats" en panel DJ
Métricas en tiempo real:
  - Oyentes actuales (gráfica línea últimos 30min)
  - Pico de oyentes de la sesión
  - Canciones reproducidas
  - Total propinas recibidas
  - Top 5 canciones más votadas
  - Engagement rate (reacciones/oyente)
Métricas históricas:
  - Sesiones totales
  - Oyentes únicos totales
  - Propinas acumuladas
Gráficas: recharts o victory-native
```

---

## 🛠️ Dependencias
- TanStack Query para data fetching
- Supabase aggregations
- recharts (web) / victory-native (mobile)
