# Fase 9: Post-Mortem y Mejora Continua

## 🎯 Propósito

Esta fase documenta el proceso de **cerrar una sesión de trabajo**, analizar qué funcionó y qué no, y actualizar los protocolos para que el equipo (humano o IA) mejore continuamente.

**Regla fundamental:** Cada sesión significativa termina con un post-mortem. No hay excusas.

---

## 📋 Checklist de Cierre de Sesión

### 1. Marcar Versión Funcional
```bash
# Crear tag con versión semántica
git tag -a vX.Y.Z-descripcion -m "Descripción de lo que incluye"
git push origin vX.Y.Z-descripcion
```

**Convención de versiones:**
- `v0.X.Y` → MVP / Pre-release
- `v1.X.Y` → Primera versión de producción
- Sufijos: `-alpha`, `-beta`, `-mvp`, `-demo`

### 2. Crear Documento Post-Mortem
Ubicación: `docs/postmortems/YYYY-MM-DD-descripcion.md`

**Contenido obligatorio:**
- Resumen ejecutivo (qué se hizo, cuánto tardó)
- Lo que funcionó bien
- Problemas encontrados (con tiempo perdido)
- Lecciones aprendidas
- Recomendaciones para ir más rápido
- Archivos modificados

### 3. Actualizar Credenciales/Accesos
Si durante la sesión se obtuvieron nuevos tokens o accesos:
```
proyecto/.credentials/CONEXIONES.md
```

### 4. Subir Todo al Repositorio
```bash
git add -A
git commit -m "docs: post-mortem sesión YYYY-MM-DD"
git push
```

---

## 🔍 Análisis Post-Mortem

### Preguntas Clave

1. **¿Cuánto tiempo se planificó vs cuánto tomó realmente?**
   - Factor > 2x → Hay un problema sistémico

2. **¿Qué porcentaje fue desarrollo vs infraestructura/bloqueos?**
   - Si infraestructura > 30% → Faltan automatizaciones

3. **¿Cuántas veces se preguntó algo al director que se podía haber buscado?**
   - Cada pregunta evitable = oportunidad de documentar

4. **¿Se revisó el código existente antes de escribir nuevo?**
   - NO revisar = bugs de inconsistencia garantizados

### Métricas a Registrar

| Métrica | Qué mide |
|---------|----------|
| Tiempo planificado | Estimación inicial |
| Tiempo real | Cuánto tardó realmente |
| Factor de desvío | Real / Planificado |
| % en bloqueos | Tiempo perdido en problemas no-código |
| Commits | Cantidad de commits de la sesión |
| Archivos tocados | Scope real del cambio |

---

## 🚀 Cómo Ir 10x Más Rápido

### Automatizaciones Obligatorias

1. **Deploy con un comando**
   ```bash
   vercel deploy --prod --yes --token=$VERCEL_TOKEN
   ```

2. **Base de datos con acceso directo**
   ```bash
   curl -X POST "$SUPABASE_API/database/query" \
     -H "Authorization: Bearer $SUPABASE_TOKEN" \
     -d '{"query": "SQL_AQUI"}'
   ```

3. **Verificación post-deploy**
   ```bash
   curl -s "$URL_PRODUCCION" | grep -o 'entry-[a-f0-9]*\.js'
   ```

### Checklist Pre-Desarrollo

Antes de escribir UNA línea de código:

- [ ] ¿Hay código existente que hace algo similar?
- [ ] ¿Qué constantes/mock data debo reutilizar?
- [ ] ¿El sistema de demo existente cubre mi caso?
- [ ] ¿Tengo las credenciales para desplegar?
- [ ] ¿Cómo verificaré que funciona en producción?

### Anti-Patrones a Evitar

| ❌ Anti-Patrón | ✅ Mejor Práctica |
|---------------|-------------------|
| Escribir mock data nuevo | Buscar si ya existe |
| Asumir que deploy funciona | Verificar hash del bundle |
| Pedir credenciales cuando se necesitan | Tenerlas guardadas desde día 1 |
| Debuggear en producción | Probar local primero |
| Preguntar lo que está documentado | Buscar en docs primero |

---

## 👥 Onboarding de Nuevo Agente

Cuando un nuevo agente (IA o humano) se une al proyecto:

### Paso 1: Leer Documentación Base
```
docs/protocolo-equipos-virtuales/README.md   # Cómo trabajamos
docs/expertos/EQUIPO-VIRTUAL.md              # Quiénes somos
.credentials/CONEXIONES.md                    # Accesos (si tiene permisos)
```

### Paso 2: Entender el Proyecto
```
README.md                    # Qué es el proyecto
docs/plan-mvp/              # Hacia dónde vamos
docs/postmortems/           # Qué problemas hubo
```

### Paso 3: Conocer al Equipo Virtual
Cada experto virtual tiene:
```
docs/expertos/[area]/
├── 01-referente1.md        # Análisis del referente
├── 02-referente2.md
├── ...
├── 10-referente10.md
└── RESUMEN-[AREA].md       # Síntesis del conocimiento
```

### Paso 4: Revisar Última Sesión
```bash
# Ver último post-mortem
ls -t docs/postmortems/ | head -1

# Ver últimos commits
git log --oneline -10
```

### Paso 5: Verificar Accesos
```bash
# Test Vercel
vercel whoami --token=$VERCEL_TOKEN

# Test Supabase
curl -X POST "$SUPABASE_API/database/query" \
  -H "Authorization: Bearer $SUPABASE_TOKEN" \
  -d '{"query": "SELECT 1"}'
```

### Lo que NO debe hacer un nuevo agente:
- ❌ Preguntar "¿cómo funciona X?" sin buscar primero
- ❌ Modificar código sin entender el contexto
- ❌ Crear estructuras nuevas sin revisar las existentes
- ❌ Depender del director para información documentada

---

## 📁 Estructura de Carpeta de Experto

Cuando se crea un nuevo experto virtual:

```
docs/expertos/[nombre-area]/
├── 00-perfil.md                    # Perfil del superexperto fusionado
├── 01-[nombre-referente-1].md      # Análisis referente 1
├── 02-[nombre-referente-2].md      # Análisis referente 2
├── ...
├── 10-[nombre-referente-10].md     # Análisis referente 10
├── RESUMEN-[AREA].md               # Síntesis de conocimiento
└── fuentes/
    └── catalogo-fuentes.md         # Fuentes consultadas
```

**Contenido de cada referente:**
- Quién es (bio, logros)
- Filosofía/enfoque
- Técnicas específicas
- Cómo aplica a nuestro proyecto
- Citas relevantes

---

## 🔄 Ciclo de Mejora Continua

```
┌─────────────────────────────────────────────────┐
│                                                 │
│   1. SESIÓN DE TRABAJO                         │
│      └─► Desarrollo, fixes, features           │
│                                                 │
│   2. POST-MORTEM                               │
│      └─► Analizar qué funcionó/falló           │
│                                                 │
│   3. ACTUALIZAR PROTOCOLOS                     │
│      └─► Documentar lecciones aprendidas       │
│                                                 │
│   4. MARCAR VERSIÓN                            │
│      └─► Tag + push                            │
│                                                 │
│   5. SIGUIENTE SESIÓN                          │
│      └─► Empezar con protocolos mejorados      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 📊 Template de Post-Mortem

```markdown
# Post-Mortem: Sesión YYYY-MM-DD - [Descripción]

## Resumen Ejecutivo
**Duración:** X horas  
**Objetivo:** [Qué se quería lograr]  
**Resultado:** ✅/❌ [Qué se logró]

## Lo Que Funcionó Bien
- [Punto 1]
- [Punto 2]

## Problemas Encontrados
### [Problema 1] (SEVERIDAD)
**Síntoma:**  
**Causa:**  
**Tiempo perdido:**  
**Lección:**

## Métricas
| Tarea | Estimado | Real | Factor |
|-------|----------|------|--------|
| X | Y min | Z min | N.Nx |

## Recomendaciones
1. [Recomendación 1]
2. [Recomendación 2]

## Archivos Modificados
- `path/file1.ts` - [descripción]
- `path/file2.ts` - [descripción]

---
*Documento generado: YYYY-MM-DD HH:MM*
```

---

*Fase añadida: 2026-02-04 por Tanke*
*Basada en lecciones de la sesión de deploy Vercel*
