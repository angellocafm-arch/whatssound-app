# Troy Hunt - Experto en Seguridad Web

## Quién es
Troy Hunt es un experto australiano en seguridad web, creador de **Have I Been Pwned (HIBP)**, el servicio de referencia mundial para verificar si credenciales han sido comprometidas en data breaches. Microsoft MVP y Pluralsight author.

## Especialidad
- Data breaches y exposición de credenciales
- Verificación de contraseñas comprometidas
- Divulgación responsable de vulnerabilidades
- Concienciación sobre seguridad

## Mejores Prácticas

### 1. Gestión de Contraseñas
- **Nunca reutilizar contraseñas** entre servicios
- Usar contraseñas largas (passphrases) en lugar de complejas
- Implementar gestores de contraseñas
- Verificar credenciales contra bases de datos de breaches

### 2. Verificación de Breaches
- Integrar API de HIBP para validar contraseñas en registro
- Notificar usuarios si sus credenciales aparecen en nuevos breaches
- Monitorear dominios corporativos para exposiciones

### 3. Divulgación de Brechas
- Disclosure transparente y oportuno
- Notificar a usuarios afectados inmediatamente
- No minimizar ni ocultar brechas
- Documentar qué datos fueron expuestos

### 4. Autenticación Moderna
- **Passkeys > MFA > Contraseñas**
- Implementar WebAuthn/FIDO2
- Eliminar autenticación basada solo en contraseñas
- MFA resistente a phishing (no SMS)

## Checklist para WhatsSound

### Contraseñas
- [ ] Integrar API Pwned Passwords en registro
- [ ] No forzar rotación de contraseñas (obsoleto)
- [ ] Mínimo 8 caracteres, sin límite superior
- [ ] No requisitos de caracteres especiales forzados
- [ ] Hashear con bcrypt/Argon2 (Supabase ya lo hace)

### Breach Response
- [ ] Plan documentado de respuesta a incidentes
- [ ] Plantillas de notificación a usuarios
- [ ] Logging de accesos para auditoría
- [ ] Proceso de invalidación masiva de sesiones

### Autenticación
- [ ] Considerar passkeys para futuro
- [ ] OTP por app autenticadora (no SMS)
- [ ] Rate limiting en endpoints de auth
- [ ] Bloqueo temporal tras intentos fallidos

## Recursos
- https://haveibeenpwned.com
- https://troyhunt.com
- API: https://haveibeenpwned.com/API/v3

## Aplicación a WhatsSound

### Actual
WhatsSound usa Supabase Auth que ya implementa:
- ✅ Hasheo seguro de contraseñas (bcrypt)
- ✅ Rate limiting en auth
- ✅ Tokens JWT seguros

### Recomendaciones
1. **Integrar validación HIBP** en registro para advertir sobre contraseñas comprometidas
2. **Monitorear emails** de usuarios en breaches futuros
3. **Documentar proceso** de respuesta ante breach
4. **Considerar passkeys** como opción premium para DJs verificados
