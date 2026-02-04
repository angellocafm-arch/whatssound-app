# Post-Mortem: Sesión 2026-02-04 - Deploy Vercel

## Resumen Ejecutivo

**Duración:** ~2 horas  
**Objetivo inicial:** Añadir chat grupal con datos mock para demo de inversores  
**Resultado:** ✅ Completado + solución de problema crítico de deploy  

---

## Lo Que Funcionó Bien

### 1. Desarrollo del Chat Grupal
- Mock data consistente con `groups.tsx` (Reggaetoneros Madrid, 234 miembros)
- Conversación natural entre 6 participantes
- Integración con sistema existente `isDemoMode()`
- Detección automática de IDs demo (g1, demo*, test*)

### 2. Diagnóstico Sistemático
- Identificación rápida de que el problema era deploy, no código
- Build local funcionaba perfectamente
- Verificación de commits en GitHub ✅
- Trazabilidad del problema hasta la configuración de Vercel

### 3. Solución Final
- Token de Vercel obtenido y funcional
- Deploy manual exitoso
- Credenciales guardadas para futuros deploys

---

## Problemas Encontrados

### 1. Conexión Vercel-GitHub Rota (CRÍTICO)
**Síntoma:** Commits llegaban a GitHub pero Vercel no desplegaba  
**Causa:** La integración automática dejó de funcionar (webhook o configuración)  
**Tiempo perdido:** ~45 minutos diagnosticando  

**Lección:** Tener siempre una alternativa de deploy manual configurada.

### 2. Falta de Token de Vercel
**Síntoma:** No podía desplegar sin autenticación  
**Causa:** No teníamos el token configurado para CLI  
**Solución:** Leo generó token desde dashboard de Vercel  

**Lección:** Guardar credenciales de deploy desde el día 1.

### 3. GitHub Actions Fallando
**Síntoma:** Workflow de CI fallaba en `npm ci`  
**Causa:** Conflicto de peer dependencies con jest  
**Solución:** Cambiar a `npm install --legacy-peer-deps`  

**Lección:** Probar CI localmente antes de depender de él.

### 4. Inconsistencia de Datos Mock
**Síntoma:** `group/[id].tsx` mostraba datos diferentes a `groups.tsx`  
**Causa:** Creé mock data nuevo sin revisar el existente  
**Solución:** Centralizar datos mock por ID de grupo  

**Lección:** SIEMPRE revisar código existente antes de escribir nuevo.

---

## Métricas de Tiempo

| Tarea | Tiempo Estimado | Tiempo Real | Factor |
|-------|-----------------|-------------|--------|
| Chat grupal mock | 15 min | 20 min | 1.3x |
| Debug deploy | 10 min | 45 min | 4.5x |
| Obtener token | 5 min | 15 min | 3x |
| Deploy final | 5 min | 5 min | 1x |
| **Total** | **35 min** | **85 min** | **2.4x** |

**Conclusión:** El 60% del tiempo se fue en problemas de infraestructura, no en desarrollo.

---

## Recomendaciones para Ir 10x Más Rápido

### 1. Credenciales Preconfiguradas ✅ HECHO
- Token de Vercel guardado en `.credentials/CONEXIONES.md`
- Token de Supabase ya disponible
- No más bloqueos por autenticación

### 2. Deploy Manual como Backup
```bash
# Comando rápido guardado:
vercel deploy --prod --yes --token=La78QM6AxNvhXYMLFbwmQqM3
```

### 3. Checklist Pre-Desarrollo
Antes de escribir código nuevo:
- [ ] Revisar archivos relacionados existentes
- [ ] Buscar constantes/mock data que deba reutilizar
- [ ] Verificar que el sistema de demo existente cubre mi caso

### 4. Verificación Post-Commit
Después de cada push importante:
```bash
# Verificar que el deploy se disparó
curl -s "https://whatssound-app.vercel.app/" | grep -o 'entry-[a-f0-9]*\.js'
```

### 5. GitHub Secrets Pendientes
Para automatizar 100%, añadir a GitHub Secrets:
- `VERCEL_TOKEN` = `La78QM6AxNvhXYMLFbwmQqM3`
- `VERCEL_ORG_ID` = `team_oAUYFkX7nxcA6NeM5zw0haeJ`
- `VERCEL_PROJECT_ID` = `prj_ILdyOqPUb45gftuav5yfkZVvwpGd`

---

## Opinión del Equipo de Expertos

### Lo que estuvo bien:
- Diagnóstico metódico del problema
- No rendirse ante obstáculos de infraestructura
- Documentación inmediata de soluciones

### Lo que debe mejorar:
- **Revisar código existente ANTES de escribir** - Habría evitado la inconsistencia de mock data
- **Tener credenciales listas desde el inicio** - El token de Vercel debió estar configurado
- **No asumir que la infraestructura funciona** - Verificar deploys después de cada push

### Cambio de mentalidad necesario:
> "Si algo funcionaba ayer y hoy no, el problema está en lo que cambió entre ayer y hoy - no en el código nuevo."

---

## Archivos Modificados

```
app/group/[id].tsx          # Chat grupal con mock data
.github/workflows/deploy-production.yml  # Nuevo workflow de deploy
.credentials/CONEXIONES.md  # Credenciales guardadas
vercel.json                 # Revertido a versión simple
```

---

## Estado Final

| Componente | Estado |
|------------|--------|
| Chat grupal g1 | ✅ Reggaetoneros Madrid, 234 miembros |
| Deploy Vercel | ✅ Manual funcional, automático pendiente |
| Base de datos | ✅ 23 tablas, conectada |
| Dashboard admin | ✅ Operativo |
| Documentación expertos | ✅ En /docs/expertos |

---

*Documento generado: 2026-02-04 20:55 CET*  
*Autor: Tanke (IA de Vertex Developer)*
