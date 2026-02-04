# Bruce Schneier - Criptografía y Seguridad

## Quién es
Bruce Schneier es criptógrafo, experto en seguridad informática, autor de "Applied Cryptography" y "Secrets and Lies". Fellow en Harvard Kennedy School y referente mundial en seguridad.

## Principios Fundamentales

### 1. "Security is a Process, Not a Product"
La seguridad no es algo que se compra o instala, es un proceso continuo de evaluación, mejora y adaptación.

### 2. "Complexity is the Enemy of Security"
Sistemas más simples son más fáciles de asegurar y auditar. Cada componente adicional es una superficie de ataque potencial.

### 3. "Attack Surface Reduction"
Minimizar los puntos de entrada posibles para atacantes:
- Menos código = menos bugs
- Menos features = menos vulnerabilidades
- Menos dependencias = menos supply chain risk

### 4. "Defense in Depth"
Múltiples capas de seguridad, donde cada capa asume que las anteriores pueden fallar:
1. Red (firewalls, WAF)
2. Aplicación (input validation, auth)
3. Base de datos (RLS, encryption)
4. Monitoreo (logging, alertas)

### 5. "Schneier's Law"
"Anyone can invent a security system that he himself cannot break. This doesn't mean it's secure."
→ Usar criptografía probada y auditada, nunca inventar la propia.

## Mejores Prácticas Criptográficas

### Algoritmos Recomendados (2025)
| Uso | Algoritmo |
|-----|-----------|
| Hasheo passwords | Argon2id, bcrypt |
| Hasheo general | SHA-256, SHA-3 |
| Cifrado simétrico | AES-256-GCM |
| Cifrado asimétrico | RSA-4096, Ed25519 |
| Key derivation | HKDF, PBKDF2 |
| TLS | TLS 1.3 |

### Algoritmos a EVITAR
- MD5 (roto)
- SHA1 (debilitado)
- DES/3DES (obsoletos)
- RC4 (roto)
- TLS 1.0/1.1 (deprecated)

### Principios Criptográficos
1. **Nunca implementar cripto propia**
2. **Usar librerías auditadas** (OpenSSL, libsodium, WebCrypto)
3. **Rotar claves periódicamente**
4. **Separar claves por propósito**
5. **Almacenar claves en HSM/KMS cuando sea posible**

## Checklist Criptografía para WhatsSound

### Passwords
- [x] Hasheo con bcrypt (Supabase Auth)
- [ ] Considerar migrar a Argon2id
- [ ] Salt único por password (Supabase lo hace)
- [ ] Work factor apropiado (cost >= 10)

### Datos en Tránsito
- [x] HTTPS obligatorio
- [ ] TLS 1.3 preferido
- [ ] HSTS configurado
- [ ] Certificate pinning en app móvil (futuro)

### Datos en Reposo
- [ ] Campos sensibles cifrados (stripe tokens)
- [ ] Backup cifrado
- [ ] Logs sin datos sensibles

### Claves y Secretos
- [ ] Secrets en variables de entorno
- [ ] No secrets en código/repo
- [ ] Rotación de API keys planificada
- [ ] Diferentes keys por ambiente

### Tokens
- [x] JWT firmados (RS256 en Supabase)
- [ ] Tokens de corta duración
- [ ] Refresh token rotation

## Aplicación a WhatsSound

### Análisis de Superficie de Ataque

```
┌─────────────────────────────────────────────────┐
│                  CLIENTE                         │
│  (Next.js PWA)                                  │
│  - Input validation                             │
│  - XSS prevention                               │
│  - Secure storage (tokens)                      │
└────────────────────┬────────────────────────────┘
                     │ HTTPS/TLS 1.3
┌────────────────────▼────────────────────────────┐
│                  VERCEL                          │
│  - Rate limiting                                │
│  - DDoS protection                              │
│  - Edge functions                               │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                 SUPABASE                         │
│  - Auth (bcrypt, JWT)                           │
│  - RLS (61 policies)                            │
│  - Encryption at rest                           │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                  STRIPE                          │
│  - PCI compliance                               │
│  - Tokenization                                 │
│  - Webhooks signed                              │
└─────────────────────────────────────────────────┘
```

### Defense in Depth en WhatsSound

| Capa | Implementación |
|------|----------------|
| **Perímetro** | Vercel edge, rate limiting |
| **Transporte** | TLS obligatorio, HSTS |
| **Autenticación** | Supabase Auth, JWT |
| **Autorización** | 61 RLS policies |
| **Datos** | Cifrado at-rest (Supabase) |
| **Monitoreo** | Logs, alertas (pendiente) |

### Simplificación Recomendada
1. **Eliminar código muerto** - Auditar y limpiar
2. **Reducir dependencias** - npm audit, eliminar no usadas
3. **Consolidar funcionalidades** - Evitar duplicación
4. **Documentar arquitectura** - Facilita auditorías

## Recursos
- https://www.schneier.com/
- "Applied Cryptography" (libro)
- "Secrets and Lies" (libro)
- Blog: https://www.schneier.com/blog/
