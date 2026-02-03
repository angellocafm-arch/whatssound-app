/**
 * WhatsSound — AI Provider (Pluggable)
 * 
 * Abstraction layer for the dashboard AI assistant.
 * Swap between providers by changing the config.
 * 
 * Supported providers:
 * - 'mock'     → Hardcoded responses (default, no API key needed)
 * - 'anthropic' → Claude API (Anthropic)
 * - 'openai'   → GPT-4 / GPT-4o (OpenAI)
 * - 'custom'   → Any OpenAI-compatible endpoint (Ollama, Together, Groq, etc.)
 * 
 * Config is stored in localStorage for easy switching from dashboard.
 */

export interface AIConfig {
  provider: 'mock' | 'anthropic' | 'openai' | 'custom';
  apiKey?: string;
  model?: string;
  baseUrl?: string;       // For custom endpoints
  systemPrompt?: string;  // Override system prompt
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const DEFAULT_SYSTEM_PROMPT = `Eres Leo, el asistente IA del dashboard de WhatsSound. 
Tu rol es analizar datos de la plataforma y ayudar a los administradores (Kike y Ángel).

Contexto de la plataforma:
- WhatsSound es "el WhatsApp de la música" — DJs crean sesiones, usuarios escuchan, votan canciones, chatean y envían propinas
- Base de datos PostgreSQL en Supabase con: perfiles, sesiones, canciones, votos, mensajes, propinas, follows
- La app está en fase de desarrollo/demo para inversores

Instrucciones:
- Responde en español, conciso pero completo
- Usa emojis para hacer las respuestas visuales
- Si te dan datos de la DB, analízalos e identifica tendencias
- Puedes sugerir acciones pero nunca modificas datos
- Si no tienes datos suficientes, dilo honestamente`;

// ─── Config management ──────────────────────────────────

const CONFIG_KEY = 'ws_ai_config';

export function getAIConfig(): AIConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { provider: 'mock' };
}

export function setAIConfig(config: AIConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

// ─── Provider implementations ───────────────────────────

async function callAnthropic(messages: AIMessage[], config: AIConfig): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
      messages: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'Sin respuesta';
}

async function callOpenAI(messages: AIMessage[], config: AIConfig): Promise<string> {
  const baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o',
      messages: [
        { role: 'system', content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT },
        ...messages.filter(m => m.role !== 'system'),
      ],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sin respuesta';
}

// ─── Mock responses ─────────────────────────────────────

function getMockResponse(q: string): string {
  const ql = q.toLowerCase();
  if (ql.includes('usuario') || ql.includes('activo'))
    return '📊 **Usuarios:**\n• Total registrados: 16\n• Activos en sesiones: 16\n• DJs registrados: 5\n• Oyentes: 11\n\nLa plataforma está en fase de testing. Los datos mostrados son reales de Supabase.';
  if (ql.includes('sesión') || ql.includes('sesion') || ql.includes('popular'))
    return '🎵 **Sesiones activas: 4**\n\n1. Viernes Latino 🔥 — DJ Carlos Madrid (6 miembros)\n2. Chill & Study Beats — Luna DJ (4 miembros)\n3. Deep House Sunset — Sarah B (3 miembros)\n4. Techno Underground — Paco Techno (3 miembros)\n\nTodas las sesiones tiran de datos reales de Supabase.';
  if (ql.includes('revenue') || ql.includes('propina') || ql.includes('dinero'))
    return '💰 **Propinas (seed data):**\n• 6 propinas registradas\n• Total: €26.00\n• Media: €4.33\n• Top tipper: Carlos Ruiz (€10)\n\n⚠️ Stripe no conectado aún — las propinas son datos de prueba.';
  if (ql.includes('género') || ql.includes('genero'))
    return '🎶 **Géneros en sesiones activas:**\n• Reggaetón / Latin — 1 sesión\n• Lo-fi / Chill — 1 sesión\n• Deep House / Tropical — 1 sesión\n• Techno / Industrial — 1 sesión\n\nMix variado en las 4 sesiones activas.';
  if (ql.includes('resumen') || ql.includes('día') || ql.includes('hoy'))
    return '📋 **Resumen:**\n\n👥 16 usuarios en la plataforma\n📡 4 sesiones activas, 1 finalizada\n🎵 10 canciones en cola\n💬 12 mensajes de chat\n💰 6 propinas (€26 total)\n👥 16 miembros en sesiones\n\n✅ Plataforma en testing. Datos reales de Supabase. Realtime activado en 5 tablas.';
  if (ql.includes('config') || ql.includes('modelo') || ql.includes('api') || ql.includes('cambiar'))
    return '⚙️ **Configuración IA:**\n\nProvider actual: **Mock** (respuestas locales)\n\nProviders disponibles:\n• `anthropic` — Claude (Sonnet/Opus)\n• `openai` — GPT-4o / GPT-4\n• `custom` — Cualquier API OpenAI-compatible (Ollama, Groq, Together, etc.)\n\nPara cambiar: ve a Config en el sidebar del dashboard, sección "Asistente IA". Solo necesitas API key + modelo.';
  return '🤔 Puedo ayudarte con:\n• Usuarios y actividad\n• Sesiones en vivo\n• Revenue y propinas\n• Géneros\n• Resumen del día\n• Config del asistente IA\n\n¿Qué necesitas?';
}

// ─── Main chat function ─────────────────────────────────

export async function chat(messages: AIMessage[], dbContext?: string): Promise<string> {
  const config = getAIConfig();

  // Inject DB context into the last user message if available
  const enrichedMessages = [...messages];
  if (dbContext && enrichedMessages.length > 0) {
    const last = enrichedMessages[enrichedMessages.length - 1];
    if (last.role === 'user') {
      enrichedMessages[enrichedMessages.length - 1] = {
        ...last,
        content: `${last.content}\n\n[Datos actuales de la DB]\n${dbContext}`,
      };
    }
  }

  switch (config.provider) {
    case 'anthropic':
      if (!config.apiKey) return '⚠️ API key de Anthropic no configurada. Ve a Config → Asistente IA.';
      return callAnthropic(enrichedMessages, config);

    case 'openai':
    case 'custom':
      if (!config.apiKey) return '⚠️ API key no configurada. Ve a Config → Asistente IA.';
      return callOpenAI(enrichedMessages, config);

    case 'mock':
    default:
      const lastMsg = messages[messages.length - 1]?.content || '';
      return getMockResponse(lastMsg);
  }
}

// ─── Available models per provider ──────────────────────

export const PROVIDER_MODELS: Record<string, { label: string; models: { id: string; name: string }[] }> = {
  mock: { label: 'Mock (Sin API)', models: [{ id: 'mock', name: 'Respuestas locales' }] },
  anthropic: {
    label: 'Anthropic (Claude)',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (rápido)' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (rápido)' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    ],
  },
  custom: {
    label: 'Custom (OpenAI-compatible)',
    models: [
      { id: 'custom', name: 'Modelo personalizado' },
    ],
  },
};
