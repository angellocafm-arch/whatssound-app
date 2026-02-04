# Mozilla Security Team - Web Security Guidelines

## Qué es
El equipo de seguridad de Mozilla mantiene las **Mozilla Web Security Guidelines**, un documento de referencia para operaciones de sitios web seguros.

## Guías de Seguridad Web Mozilla

### 1. Transport Layer Security (TLS)

#### Configuraciones Recomendadas

| Config | Para quién | Browsers |
|--------|-----------|----------|
| **Modern** | Solo browsers modernos | Firefox 63+, Chrome 70+ |
| **Intermediate** | Público general | Firefox 27+, IE 11 |
| **Old** | Máxima compatibilidad | IE 8, Android 2.3 |

**Recomendación WhatsSound:** Intermediate (balance seguridad/compatibilidad)

### 2. HTTPS Obligatorio

```nginx
# Nginx: Redirect HTTP → HTTPS
server {
  listen 80;
  return 301 https://$host$request_uri;
}
```

- Todo el tráfico debe ser HTTPS
- APIs deben deshabilitar HTTP completamente
- HSTS mínimo 6 meses (2 años recomendado)

### 3. Resource Loading

```html
<!-- ✅ Correcto: HTTPS -->
<script src="https://code.jquery.com/jquery.min.js"></script>

<!-- ❌ Incorrecto: HTTP -->
<script src="http://code.jquery.com/jquery.min.js"></script>

<!-- ❌ Incorrecto: Protocol-relative (evitar) -->
<script src="//code.jquery.com/jquery.min.js"></script>
```

### 4. Content Security Policy (CSP)

**Política recomendada inicial:**
```http
Content-Security-Policy: default-src https:
```

**Política más segura:**
```http
Content-Security-Policy: 
  default-src 'none'; 
  script-src 'self'; 
  style-src 'self';
  img-src 'self' https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
```

### 5. Cookies

#### Directivas Obligatorias
- `Secure` - Solo enviar sobre HTTPS
- `HttpOnly` - No accesible desde JavaScript
- `SameSite=Strict` o `Lax` - Previene CSRF

#### Nombres Especiales
- `__Secure-` prefix: Cookie debe ser Secure
- `__Host-` prefix: Secure + no Domain + Path=/

```http
Set-Cookie: __Host-SessionId=abc123; Path=/; Secure; HttpOnly; SameSite=Strict
```

### 6. CORS (Cross-Origin Resource Sharing)

**Por defecto:** No permitir cross-origin requests

```http
# Solo si es necesario
Access-Control-Allow-Origin: https://trusted-domain.com
Access-Control-Allow-Methods: GET, POST
Access-Control-Allow-Headers: Content-Type
Access-Control-Max-Age: 86400
```

**NUNCA usar:**
```http
Access-Control-Allow-Origin: *  # Con credentials
```

### 7. CSRF Prevention

- Tokens CSRF en formularios
- SameSite cookies
- Verificar Origin/Referer headers
- Re-autenticación para acciones críticas

### 8. Subresource Integrity (SRI)

```html
<script 
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxxx"
  crossorigin="anonymous">
</script>
```

## Checklist Mozilla para WhatsSound

### TLS/HTTPS
- [x] HTTPS obligatorio (Vercel)
- [ ] TLS 1.2+ únicamente
- [ ] HSTS 2 años + includeSubDomains + preload
- [ ] Redirect HTTP → HTTPS en todas las rutas

### Headers de Seguridad
- [ ] Strict-Transport-Security
- [ ] Content-Security-Policy
- [ ] X-Content-Type-Options: nosniff
- [ ] X-Frame-Options: DENY
- [ ] Referrer-Policy

### Cookies
- [ ] Secure flag en todas las cookies
- [ ] HttpOnly donde aplique
- [ ] SameSite=Strict o Lax
- [ ] Prefijos __Host- o __Secure-

### CORS
- [ ] No permitir orígenes wildcard con credentials
- [ ] Whitelist de orígenes permitidos
- [ ] Métodos restringidos

### CSRF
- [x] SameSite cookies (Supabase)
- [ ] Tokens CSRF en formularios custom
- [ ] Verificar Origin header

### Resources
- [ ] Todo cargado sobre HTTPS
- [ ] SRI en scripts de CDN externos
- [ ] No mixed content

## Implementación para WhatsSound

### Headers Completos (next.config.js)

```javascript
const securityHeaders = [
  // HSTS
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  // CSP
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https://cdns-preview-*.dzcdn.net blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deezer.com https://api.stripe.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  },
  // Prevent MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  // Referrer
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  // Permissions
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=(), payment=(self)'
  },
  // DNS prefetch
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### Verificación

1. **SecurityHeaders.com:** https://securityheaders.com/?q=whatssound.app
2. **Mozilla Observatory:** https://observatory.mozilla.org/
3. **SSL Labs:** https://www.ssllabs.com/ssltest/

## Recursos
- https://infosec.mozilla.org/guidelines/web_security
- https://observatory.mozilla.org/
- https://wiki.mozilla.org/Security/Server_Side_TLS
- https://developer.mozilla.org/en-US/docs/Web/Security
