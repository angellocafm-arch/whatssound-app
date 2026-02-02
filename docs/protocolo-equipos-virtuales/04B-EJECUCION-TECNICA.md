# 04B-EJECUCION-TECNICA.md — Protocolo de Ejecución Técnica

## 🎯 ¿Qué es esto?

Este documento complementa la **Fase 4 (Desarrollo)** con el protocolo técnico exacto que se sigue cuando ya tenemos:
- ✅ Equipo virtual creado (Fase 2)
- ✅ Reuniones y roadmap hechos (Fase 3)
- ✅ Design system definido (colores, tipografía, spacing)
- ✅ Pantallas diseñadas y guardadas como imágenes de referencia
- ✅ Infraestructura desplegada (repo GitHub + hosting)

Es el ciclo de **"picar código → desplegar → verificar → siguiente"** que ejecuta el desarrollador (humano o IA) de forma repetitiva y eficiente.

---

## 📋 PREREQUISITOS

Antes de empezar la ejecución técnica, verificar que existe:

### En el repositorio
```
proyecto/
├── docs/
│   ├── desarrollo-final/
│   │   ├── pantallas/
│   │   │   ├── indice-pantallas.md          ← Lista numerada de TODAS las pantallas
│   │   │   ├── principales/                  ← Imágenes PNG de cada pantalla
│   │   │   │   ├── 01-splash.png
│   │   │   │   ├── 02-login.png
│   │   │   │   └── ...
│   │   │   └── submenus/                     ← Imágenes de pantallas secundarias
│   │   ├── design-system/
│   │   │   ├── colores.md
│   │   │   ├── tipografia.md
│   │   │   └── espaciado.md
│   │   ├── referencias-visuales/             ← Imágenes organizadas por categoría
│   │   ├── FLUJO-DE-TRABAJO.md
│   │   └── equipo/                           ← Superexpertos y sus recomendaciones
│   └── protocolo-equipos-virtuales/          ← Este protocolo
├── src/theme/                                ← Design system implementado en código
│   ├── colors.ts
│   ├── typography.ts
│   └── spacing.ts
└── app/                                      ← Código de las pantallas
```

### En la infraestructura
- **Repositorio GitHub** configurado (push → rama main)
- **Hosting** configurado (Vercel, Netlify, etc.) con deploy automático o manual
- **Variables de entorno** configuradas en el hosting
- **URL de producción** activa y accesible

---

## 🔄 CICLO DE EJECUCIÓN POR PANTALLA

### Paso 1 — Seleccionar pantalla
1. Abrir `indice-pantallas.md`
2. Identificar la siguiente pantalla pendiente (⬜)
3. Anotar su número y categoría

### Paso 2 — Cargar referencia visual
1. Abrir la imagen de la pantalla desde `pantallas/principales/XX-nombre.png`
2. Analizar la imagen:
   - ¿Qué elementos tiene? (headers, listas, botones, cards, modales)
   - ¿Qué layout? (scroll, fixed, tabs, grid)
   - ¿Qué colores del design system usa?
   - ¿Qué interacciones? (tap, toggle, input, scroll)
   - ¿Es modal, bottom sheet, fullscreen, o dentro de tabs?

### Paso 3 — Picar el código
1. Crear/editar el archivo `.tsx` correspondiente
2. Seguir el design system EXACTO (colores, typography, spacing del `src/theme/`)
3. Usar datos mock realistas (nombres reales, números creíbles, textos en el idioma de la app)
4. Importar iconos del sistema de iconos del proyecto (Ionicons, MaterialIcons, etc.)
5. **NO usar imágenes externas** que puedan no cargar (CDN bloqueados, CORS)
6. Si la pantalla tiene interacción (tabs, filtros, toggles), implementar el estado con `useState`

### Paso 4 — Commit y Push
```bash
git add -A
git commit -m "feat: [nombre descriptivo de la pantalla]"
git push origin main
```
- Mensaje del commit: descriptivo, en inglés, prefijo `feat:`, `fix:`, o `docs:`
- Agrupar pantallas relacionadas en un solo commit si se hacen seguidas

### Paso 5 — Desplegar a producción
```bash
vercel deploy --prod --yes    # o el comando equivalente del hosting
```
- Esperar a que el build termine (~1 min típico)
- Verificar que no hay errores de build en el log

### Paso 6 — Verificar en producción
1. Abrir la URL de producción en el navegador
2. Navegar hasta la pantalla nueva
3. **Comparar visualmente** con la imagen de referencia:
   - ¿Los colores coinciden?
   - ¿El layout es correcto?
   - ¿Los textos están bien?
   - ¿Los iconos son los correctos?
4. **Probar interacciones**:
   - Pulsar todos los botones
   - Probar filtros y tabs
   - Rellenar inputs
   - Verificar scroll
   - Probar en diferentes anchos de pantalla
5. Si hay diferencias → volver al Paso 3 y corregir
6. Si es correcto → captura de pantalla (opcional, según indicaciones del director)

### Paso 7 — Marcar como completada
1. Actualizar `indice-pantallas.md`: cambiar ⬜ por ✅
2. Si el director pidió reporte → enviar al canal de comunicación con captura

### Paso 8 — Siguiente pantalla
- Volver al Paso 1
- Priorizar por categoría:
  1. Pantallas core del producto (lo que ve el usuario principal)
  2. Pantallas de monetización (propinas, pagos)
  3. Pantallas de administración (dashboard)
  4. Pantallas secundarias (ajustes, extras)
  5. Pantallas de edge case (error, offline, update)

---

## 📦 AGRUPACIÓN DE DEPLOYS

Para eficiencia, agrupar varias pantallas en un solo deploy:

```
Picar pantalla A → commit
Picar pantalla B → commit
Picar pantalla C → commit
Push + Deploy una vez
Verificar las 3 pantallas
```

Esto reduce tiempo de build y espera. Un deploy cada 3-6 pantallas es óptimo.

---

## 🖥️ PANTALLAS ESPECIALES

### Dashboard Admin (web-only)
- Layout diferente al de la app móvil (fullscreen, sidebar, no shell 420px)
- Usar `position: fixed` o layout propio para romper el contenedor móvil
- Sidebar navegable con `useRouter` + `usePathname`
- Grid CSS para stats (hack: `display: 'grid' as any` en React Native Web)

### Modales y Bottom Sheets
- Overlay oscuro con `rgba(0,0,0,0.6)`
- TouchableOpacity en overlay para cerrar al tocar fuera
- Contenido en card con `borderTopLeftRadius` / `borderTopRightRadius`
- Handle bar visual (rectángulo gris centrado arriba)

### Multi-usuario (demo)
- Query params `?user=maria`, `?user=pablo` para personalizar vista
- Leer con `useLocalSearchParams` de Expo Router
- Datos mock diferentes según el usuario

---

## 📊 DATOS MOCK

### Principios
- **Realistas**: nombres reales del idioma target, números creíbles
- **Consistentes**: los mismos DJs, usuarios y sesiones en todas las pantallas
- **Suficientes**: mínimo 5-7 items en listas para que se vea bien
- **Con personalidad**: emojis en nombres de sesiones, badges de rol, estados variados

### Catálogo de datos mock (mantener consistencia)
Documentar en un archivo o en la cabecera de cada pantalla:
- DJs: nombres, géneros, stats
- Usuarios: nombres, roles (DJ/VIP/MOD/User), estados
- Sesiones: nombres, géneros, listeners, canciones
- Canciones: títulos, artistas, duración, votos

---

## 📱 VERIFICACIÓN VISUAL

### Checklist por pantalla
- [ ] Fondo correcto (background del design system)
- [ ] Colores de texto correctos (primary, secondary, muted)
- [ ] Botón principal verde (#25D366 o equivalente)
- [ ] Spacing consistente (no apretado ni demasiado suelto)
- [ ] Iconos correctos y del tamaño adecuado
- [ ] Bordes redondeados según design system
- [ ] Scroll funciona si hay contenido largo
- [ ] No hay texto cortado ni desbordado

### Dispositivos de prueba
- Navegador web (ancho móvil ~420px)
- Navegador web (ancho desktop, para dashboard admin)
- Si disponible: dispositivo móvil real

---

## 🔔 REPORTES AL DIRECTOR

### Cuándo reportar
- **Solo cuando el director lo pida** (regla de Ángel: "no reportes hasta que yo te lo diga")
- Cuando diga "check" → enviar resumen de lo hecho
- Cuando pida captura → enviar screenshot de producción

### Formato del reporte
```
[Emoji categoría] Nombre de pantalla (cantidad)
- Listado de pantallas creadas
- URL de producción
- Captura de pantalla (si se pide)
```

### Canal de reporte
- Grupo de comunicación designado (Telegram, Discord, Slack, etc.)
- Audios para resúmenes largos
- Capturas para verificación visual

---

## 🧠 GESTIÓN DE MEMORIA (para IA)

### Antes de compactación
1. Guardar resumen exhaustivo en archivo de memoria (`memory/YYYY-MM-DD.md`)
2. Incluir: URLs, estado pantallas, decisiones, errores, pendientes
3. Incluir: rutas de documentación importantes
4. Crear documento de progreso en el repo (`docs/diario-desarrollo/`)

### Después de compactación
1. Leer archivo de memoria al inicio de sesión
2. Leer documento de progreso del repo
3. Continuar exactamente donde se dejó

### Qué guardar siempre
- Reglas del director (lo que pide y cómo lo pide)
- URLs de producción activas
- Estado actual del índice de pantallas
- Errores encontrados y cómo se resolvieron
- Design system (colores hex, spacing, typography)
- Comandos de deploy exactos

---

## ⚡ OPTIMIZACIONES

### Velocidad
- No probar en local si el build de producción es rápido (<2 min)
- Agrupar commits y hacer un solo deploy
- Reutilizar código entre pantallas similares (copiar estructura, cambiar datos)

### Calidad
- Si una imagen no carga (CDN bloqueado), reemplazar con icono + color
- Si un componente no existe en RN Web, usar hack o alternativa
- Mantener el design system SIEMPRE — nunca inventar colores o tamaños

### Comunicación
- Silencio por defecto — solo hablar cuando se pide
- Capturas solo en local (no en el repo, pesan mucho)
- Audios para explicaciones largas

---

*Documento creado el 3 de febrero de 2026 como complemento a la Fase 4 del Protocolo de Equipos Virtuales.*
*Basado en la experiencia real del desarrollo de WhatsSound (29 ene - 3 feb 2026).*
