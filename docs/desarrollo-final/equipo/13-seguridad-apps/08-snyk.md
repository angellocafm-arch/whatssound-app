# Snyk - Dependency Security

## Qué es Snyk
Plataforma de seguridad para desarrolladores que encuentra y corrige vulnerabilidades en:
- Dependencias open source
- Código propio (SAST)
- Contenedores
- Infraestructura como código

## Tipos de Análisis

### 1. Software Composition Analysis (SCA)
Analiza dependencias de terceros:
- npm packages
- Transitive dependencies
- Known vulnerabilities (CVEs)
- License compliance

### 2. Static Application Security Testing (SAST)
Analiza código fuente:
- SQL injection patterns
- XSS vulnerabilities
- Hardcoded secrets
- Insecure patterns

### 3. Dynamic Application Security Testing (DAST)
Pruebas en runtime:
- Fuzzing
- Penetration testing automatizado
- API security testing

## Vulnerabilidades Comunes en npm

### 1. Prototype Pollution
```javascript
// Vulnerable
const merge = require('lodash.merge');
merge({}, JSON.parse('{"__proto__": {"isAdmin": true}}'));
```

### 2. ReDoS (Regular Expression DoS)
```javascript
// Vulnerable regex
const regex = /^([a-z]+)+$/;
regex.test('aaaaaaaaaaaaaaaaaaaaaaaaaaaa!'); // Hang
```

### 3. Command Injection
```javascript
// Vulnerable
exec(`echo ${userInput}`);
// Seguro
execFile('echo', [userInput]);
```

### 4. Path Traversal
```javascript
// Vulnerable
const file = path.join('/uploads', userInput);
// Seguro
const file = path.join('/uploads', path.basename(userInput));
```

## Checklist Dependency Security

### Auditoría Regular
- [ ] `npm audit` en cada build
- [ ] Dependabot/Snyk alerts activados
- [ ] Review semanal de vulnerabilidades
- [ ] Actualizar dependencias críticas < 24h

### Package.json Hardening
- [ ] `package-lock.json` committeado
- [ ] Versiones exactas para deps críticas
- [ ] Eliminar deps no utilizadas
- [ ] Limitar scripts postinstall

### CI/CD Integration
- [ ] npm audit en pipeline
- [ ] Fallar build si hay críticas
- [ ] Snyk/Dependabot en PRs
- [ ] License check automático

### Runtime Protection
- [ ] Sandboxing de deps peligrosas
- [ ] Monitoreo de comportamiento anómalo
- [ ] Feature flags para rollback rápido

## Implementación para WhatsSound

### 1. GitHub Actions con npm audit

```yaml
# .github/workflows/security.yml
name: Security Audit

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run npm audit
        run: npm audit --audit-level=high
        
      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### 2. Snyk CLI Local

```bash
# Instalar
npm install -g snyk

# Autenticar
snyk auth

# Escanear proyecto
snyk test

# Escanear código
snyk code test

# Monitorear (reportes continuos)
snyk monitor

# Fix automático
snyk fix
```

### 3. Dependabot (GitHub)

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "security"
    commit-message:
      prefix: "chore(deps)"
    ignore:
      - dependency-name: "*"
        update-types: ["version-update:semver-major"]
```

### 4. Pre-commit Hook

```json
// package.json
{
  "scripts": {
    "precommit": "npm audit --audit-level=high"
  },
  "husky": {
    "hooks": {
      "pre-commit": "npm run precommit"
    }
  }
}
```

## Dependencias de Alto Riesgo a Monitorear

| Categoría | Ejemplos | Riesgo |
|-----------|----------|--------|
| Auth | jsonwebtoken, bcrypt | Crítico |
| HTTP | axios, node-fetch | Alto |
| Parsing | xml2js, yaml | Alto |
| Templates | handlebars, ejs | Alto |
| Crypto | crypto-js | Crítico |
| DB | pg, mysql2 | Alto |

## Estrategia de Actualización

### Críticas (CVSS >= 9.0)
- Actualizar en < 24 horas
- Hotfix si es necesario

### Altas (CVSS 7.0-8.9)
- Actualizar en < 1 semana
- Incluir en próximo release

### Medias (CVSS 4.0-6.9)
- Actualizar en < 1 mes
- Sprint regular

### Bajas (CVSS < 4.0)
- Actualizar en próximo ciclo
- Evaluar si es explotable

## Recursos
- https://snyk.io
- https://snyk.io/vuln/ (base de datos de vulnerabilidades)
- https://docs.github.com/en/code-security/dependabot
- https://nvd.nist.gov/ (National Vulnerability Database)
