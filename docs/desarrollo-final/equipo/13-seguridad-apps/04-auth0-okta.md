# Auth0/Okta - Identity Management Security

## Qué son
- **Auth0**: Plataforma de autenticación como servicio (ahora parte de Okta)
- **Okta**: Líder en gestión de identidades empresariales
- Ambos definen estándares de la industria para identity management

## Mejores Prácticas de Autenticación

### 1. Seguridad General
- Verificar emails cuidadosamente (phishing)
- Resetear contraseñas directamente en el sitio, no via email links
- Nunca ingresar información personal/financiera en emails
- No descargar archivos de fuentes no confiables
- No reutilizar contraseñas
- Usar contraseñas fuertes y largas
- Mantener software actualizado
- Verificar seguridad del inbox

### 2. Protección de Sesiones
- Session timeouts apropiados
- Invalidar sesiones en logout
- Tokens de corta duración
- Refresh tokens seguros

### 3. Multi-Factor Authentication (MFA)
- Obligatorio para operaciones sensibles
- Preferir TOTP sobre SMS
- Considerar passkeys/WebAuthn
- Backup codes seguros

### 4. OAuth 2.0 / OpenID Connect
- Validar tokens correctamente
- Verificar claims (aud, iss, exp)
- Usar PKCE para apps móviles/SPA
- State parameter para prevenir CSRF

## Checklist Identity Management

### Autenticación
- [x] OAuth providers configurados (Supabase)
- [ ] Session timeout configurado
- [ ] Refresh token rotation habilitado
- [ ] MFA disponible para usuarios sensibles

### Protección de Cuenta
- [ ] Email verification obligatorio
- [ ] Rate limiting en login/signup
- [ ] Account lockout tras intentos fallidos
- [ ] Notificación de login desde nuevo dispositivo

### Tokens y Sesiones
- [ ] JWT expiration corta (1h o menos)
- [ ] Refresh tokens con rotación
- [ ] Invalidar tokens en logout
- [ ] Validar aud/iss claims

### Password Security
- [x] Hasheo seguro (Supabase/bcrypt)
- [ ] Password strength indicator
- [ ] Validar contra breaches (HIBP)
- [ ] No password hints

### Recovery
- [ ] Secure password reset flow
- [ ] Time-limited reset tokens
- [ ] Account recovery sin security questions
- [ ] Notificar cambios de password/email

## Aplicación a WhatsSound

### Configuración Actual
WhatsSound usa **Supabase Auth** que implementa:
- ✅ OAuth 2.0 / OpenID Connect
- ✅ JWT tokens seguros
- ✅ Email magic links
- ✅ Phone auth (opcional)
- ✅ Hasheo bcrypt

### Configuraciones Recomendadas

#### 1. JWT Expiration
```javascript
// supabase/config.toml o Dashboard
[auth]
jwt_expiry = 3600  // 1 hora (default es 3600)
```

#### 2. Email Confirmación
```javascript
// Requerir confirmación de email
[auth]
enable_confirmations = true
```

#### 3. Rate Limiting
```javascript
// Ya incluido por defecto en Supabase
// Personalizable en Dashboard > Auth > Rate Limits
```

### Flujos de Auth para WhatsSound

#### Login Normal
1. Usuario ingresa email/password
2. Supabase valida y genera JWT + refresh token
3. Frontend almacena en secure storage
4. Refresh automático antes de expiración

#### OAuth (Spotify/Google)
1. Usuario elige provider
2. Redirect a OAuth provider
3. Callback con code
4. Exchange por tokens
5. Crear/vincular usuario en Supabase

#### Phone Auth (para mayores)
1. Usuario ingresa teléfono
2. Supabase envía OTP
3. Usuario verifica código
4. Sesión creada

### Protección Adicional Recomendada

```typescript
// Middleware de validación de sesión
export async function validateSession(req: Request) {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new AuthError('Session inválida');
  }
  
  // Verificar que el token no esté en blacklist (logout)
  // Verificar claims adicionales si es necesario
  
  return session;
}

// Logout seguro
export async function secureLogout() {
  await supabase.auth.signOut({ scope: 'global' }); // Invalida todas las sesiones
}
```

## Recursos
- https://auth0.com/docs/secure/security-guidance
- https://oauth.net/2/
- https://supabase.com/docs/guides/auth
