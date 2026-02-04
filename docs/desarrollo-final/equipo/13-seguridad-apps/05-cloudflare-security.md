# Cloudflare Security - Edge Security

## Qué es Cloudflare
Cloudflare proporciona servicios de seguridad y rendimiento a nivel de edge/CDN, incluyendo protección DDoS, WAF, y optimización.

## Servicios de Seguridad

### 1. Web Application Firewall (WAF)
- Protección contra OWASP Top 10
- Reglas personalizables
- Machine learning para detección
- Zero-day protection

### 2. DDoS Protection
- Mitigación automática
- Always-on protection
- Rate limiting inteligente
- Challenge pages

### 3. Bot Management
- Detectar y bloquear bots maliciosos
- Permitir bots buenos (Google, etc.)
- CAPTCHA inteligente
- JavaScript challenges

### 4. SSL/TLS
- Certificados gratuitos
- TLS 1.3 por defecto
- HSTS automático
- Certificate pinning

## Mejores Prácticas Edge Security

### Rate Limiting
```yaml
# Ejemplo de reglas
- path: /api/auth/*
  requests: 10
  period: 60s
  action: challenge

- path: /api/*
  requests: 100
  period: 60s
  action: block
```

### Security Headers
- Strict-Transport-Security
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy
- Referrer-Policy

### Access Control
- IP allowlists/blocklists
- Country blocking
- ASN blocking
- User-agent filtering

## Checklist Cloudflare/Edge para WhatsSound

### CDN y Performance
- [ ] Assets estáticos en CDN
- [ ] Caché configurado correctamente
- [ ] Compresión habilitada
- [ ] HTTP/3 habilitado

### DDoS Protection
- [ ] Protección DDoS activa (Vercel/Cloudflare)
- [ ] Rate limiting en APIs
- [ ] Challenge para requests sospechosos
- [ ] Alertas configuradas

### WAF Rules
- [ ] OWASP ruleset activado
- [ ] SQL injection protection
- [ ] XSS protection
- [ ] Path traversal protection

### SSL/TLS
- [x] HTTPS obligatorio (Vercel)
- [ ] TLS 1.2+ únicamente
- [ ] HSTS configurado
- [ ] Certificate transparency

### Bot Protection
- [ ] Bot detection en formularios
- [ ] CAPTCHA en acciones sensibles
- [ ] Fingerprinting de dispositivos
- [ ] Honeypots

## Aplicación a WhatsSound

### Stack Actual
WhatsSound usa **Vercel** que incluye:
- ✅ SSL/TLS automático
- ✅ DDoS protection básica
- ✅ Edge functions
- ✅ CDN global

### Mejoras con Cloudflare (Opcional)

#### 1. Añadir Cloudflare como proxy
```
DNS: whatssound.app → Cloudflare → Vercel
```

#### 2. Configurar WAF Rules
```javascript
// Proteger endpoints sensibles
// /api/tips/* - Rate limit estricto
// /api/auth/* - Rate limit + challenge
// /api/stripe/* - Solo Stripe IPs
```

### Rate Limiting en Vercel Edge

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### Security Headers en Next.js

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
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

## Recursos
- https://developers.cloudflare.com/
- https://www.cloudflare.com/learning/security/
- https://vercel.com/docs/security
