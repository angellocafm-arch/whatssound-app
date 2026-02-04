# 🎵 WhatsSound

**"El WhatsApp de la música"** — DJs crean sesiones, usuarios escuchan, votan, chatean y comparten música en tiempo real.

**URL:** https://whatssound-app.vercel.app

---

## Quick Start

```bash
# Instalar dependencias
npm install

# Desarrollo local
npx expo start --web

# Build web
npx expo export --platform web

# Tests
npm test

# Deploy producción
vercel deploy --prod --yes
```

## Modos de acceso

| Modo | URL | Descripción |
|------|-----|-------------|
| Demo (inversores) | `/?demo=true` | Read-only, datos mock |
| Test (desarrollo) | `/?test=angel` | Supabase real, auto-crea usuario |
| Admin | `/?admin=kike` | Dashboard completo |
| Producción | `/` | Auth real (futuro) |

## Stack

React Native + Expo 54 · Expo Router · Supabase · Zustand · TanStack Query · Deezer API · Vercel

## 🏆 Golden Boost (V4)

Sistema de reconocimiento entre oyentes y DJs:

- **1 Golden Boost por semana** — Regenera viernes 12:00
- **Acelerador** — +1 extra al escuchar 5 sesiones diferentes
- **Compra opcional** — €4.99 por unidad extra
- **Badges** — Rising Star → Fan Favorite → Verificado → Hall of Fame
- **Hall of Fame** — Ranking semanal de DJs

Ver: [CHANGELOG-V4-GOLDEN-BOOST.md](./docs/CHANGELOG-V4-GOLDEN-BOOST.md)

## Documentación

- [STATUS.md](./STATUS.md) — Estado actual del proyecto (v2)
- [CHANGELOG.md](./CHANGELOG.md) — Historial de cambios
- [docs/desarrollo-final/](./docs/desarrollo-final/) — Design system, pantallas, arquitectura
- [docs/v2-desarrollo/](./docs/v2-desarrollo/) — Roadmap V2, estudios, reuniones

## Tests

51 tests en 5 suites: Supabase (20), Modos (13), Admin (6), Deezer (6), Demo (6)

```bash
npm test
```

## Estructura

```
app/           # Pantallas (Expo Router)
├── (tabs)/    # 5 tabs: Chats, En Vivo, Grupos, Descubrir, Perfil
├── session/   # Sesión musical (reproductor, chat, cola, gente, DJ)
├── admin/     # Dashboard admin (8 pestañas)
└── api/       # Serverless functions (Deezer proxy)
src/           # Lógica compartida (lib, stores, theme, components)
__tests__/     # Tests Jest
supabase/      # Migraciones SQL
docs/          # Documentación completa
capturas/      # Screenshots (solo local, en .gitignore)
```

