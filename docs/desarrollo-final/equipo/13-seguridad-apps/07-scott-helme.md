# Scott Helme - Security Headers

## Quién es
Scott Helme es consultor de seguridad web, creador de **securityheaders.com** y **report-uri.com**. Especialista en headers HTTP de seguridad.

## Security Headers Esenciales

### 1. Strict-Transport-Security (HSTS)
**Fuerza HTTPS en el navegador**

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

- `max-age`: Segundos que el navegador recordará usar HTTPS (2 años = 63072000)
- `includeSubDomains`: Aplica a todos los subdominios
- `preload`: Permite inclusión en lista preload de navegadores

### 2. Content-Security-Policy (CSP)
**Controla qué recursos pueden cargarse**

```http
Content-Security-Policy: default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deezer.com https://api.stripe.com;
  frame-ancestors 'none';
  form-action 'self';
```

### 3. X-Content-Type-Options
**Previene MIME type sniffing**

```http
X-Content-Type-Options: nosniff
```

### 4. X-Frame-Options
**Previene clickjacking**

```http
X-Frame-Options: DENY
```
O mejor usar CSP `frame-ancestors 'none'`

### 5. Referrer-Policy
**Controla qué información se envía en Referer**

```http
Referrer-Policy: strict-origin-when-cross-origin
```

### 6. Permissions-Policy (antes Feature-Policy)
**Controla qué APIs del navegador puede usar la página**

```http
Permissions-Policy: geolocation=(), microphone=(self), camera=()
```

### 7. X-DNS-Prefetch-Control
**Controla DNS prefetching**

```http
X-DNS-Prefetch-Control: on
```

## Checklist Security Headers para WhatsSound

### Headers Críticos
- [ ] **Strict-Transport-Security** - 2 años + includeSubDomains + preload
- [ ] **Content-Security-Policy** - Restrictivo
- [ ] **X-Content-Type-Options** - nosniff
- [ ] **X-Frame-Options** - DENY
- [ ] **Referrer-Policy** - strict-origin-when-cross-origin

### Headers Recomendados
- [ ] Permissions-Policy configurado
- [ ] X-DNS-Prefetch-Control on
- [ ] Cache-Control para assets sensibles

### CSP Específico para WhatsSound
```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  media-src 'self' https://cdns-preview-*.dzcdn.net blob:;
  connect-src 'self' 
    https://*.supabase.co 
    wss://*.supabase.co 
    https://api.deezer.com 
    https://api.stripe.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
  upgrade-insecure-requests;
```

### Verificar Headers
Usar https://securityheaders.com para verificar configuración

## Implementación en Next.js

```javascript
// next.config.js
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  media-src 'self' https://cdns-preview-*.dzcdn.net https://*.scdn.co blob:;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.deezer.com https://api.stripe.com;
  frame-src https://js.stripe.com https://hooks.stripe.com;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`;

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(self), geolocation=()'
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

## CSP Report-Only (Testing)

```javascript
// Para probar sin romper nada
{
  key: 'Content-Security-Policy-Report-Only',
  value: `${CSP}; report-uri /api/csp-report`
}
```

```typescript
// pages/api/csp-report.ts
export default function handler(req, res) {
  if (req.method === 'POST') {
    console.log('CSP Violation:', JSON.stringify(req.body));
  }
  res.status(204).end();
}
```

## Scoring en SecurityHeaders.com

| Grade | Headers |
|-------|---------|
| A+ | Todos los headers + CSP estricto |
| A | Todos los headers básicos |
| B | Faltan algunos headers |
| C-F | Configuración insegura |

**Objetivo para WhatsSound: A+**

## Recursos
- https://securityheaders.com
- https://report-uri.com
- https://scotthelme.co.uk
- CSP Evaluator: https://csp-evaluator.withgoogle.com
