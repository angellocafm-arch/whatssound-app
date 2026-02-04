/**
 * WhatsSound — Script de carga de datos para demo inversores
 * 
 * Ejecutar: npx ts-node scripts/seed-demo-data.ts
 * 
 * Crea datos realistas para la demo de 5 minutos:
 * - Sesión "Viernes Latino" con 47 oyentes simulados
 * - Cola de 8 canciones
 * - 15 mensajes de chat
 * - DJ con stats (€234 propinas)
 */

import { createClient } from '@supabase/supabase-js';

// Configuración
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ═══════════════════════════════════════════════════════════
// DATOS DE DEMO
// ═══════════════════════════════════════════════════════════

const DEMO_DJ = {
  id: 'dj-carlos-demo',
  display_name: 'Carlos Madrid',
  dj_name: 'DJ Carlos Madrid',
  username: 'carlosmadrid',
  bio: 'Reggaetón y Latin vibes 🔥 Viernes en Sala Sol',
  is_dj: true,
  dj_verified: true,
  genres: ['reggaeton', 'latin', 'dembow'],
  is_seed: true,
};

const DEMO_SESSION = {
  id: 'session-viernes-latino',
  name: 'Viernes Latino 🔥',
  genres: ['reggaeton', 'latin'],
  is_active: true,
  status: 'live',
  is_seed: true,
};

const DEMO_SONGS = [
  { title: 'Gasolina', artist: 'Daddy Yankee', status: 'playing', votes: 0 },
  { title: 'La Bicicleta', artist: 'Carlos Vives, Shakira', status: 'queued', votes: 12 },
  { title: 'Despacito', artist: 'Luis Fonsi, Daddy Yankee', status: 'queued', votes: 9 },
  { title: 'Dakiti', artist: 'Bad Bunny, Jhay Cortez', status: 'queued', votes: 7 },
  { title: 'Hawái', artist: 'Maluma', status: 'queued', votes: 5 },
  { title: 'Tusa', artist: 'Karol G, Nicki Minaj', status: 'queued', votes: 4 },
  { title: 'Baila Baila Baila', artist: 'Ozuna', status: 'queued', votes: 3 },
  { title: 'Me Porto Bonito', artist: 'Bad Bunny, Chencho Corleone', status: 'queued', votes: 2 },
];

const DEMO_LISTENERS = [
  { display_name: 'María García', avatar: '👩' },
  { display_name: 'Pedro López', avatar: '🧑' },
  { display_name: 'Ana Martín', avatar: '👩‍🦰' },
  { display_name: 'Luis Fernández', avatar: '👨' },
  { display_name: 'Carmen Ruiz', avatar: '👩‍🦱' },
  { display_name: 'Diego Torres', avatar: '🧔' },
  { display_name: 'Laura Sánchez', avatar: '👱‍♀️' },
  { display_name: 'Javier Moreno', avatar: '👨‍🦲' },
  // + 39 más simulados
];

const DEMO_MESSAGES = [
  { user: 'María García', text: '¡Qué tema! 🔥🔥🔥', time: -300 },
  { user: 'Pedro López', text: 'Carlos siempre la rompe', time: -280 },
  { user: 'Ana Martín', text: '¿Alguien sabe si va a poner Hawái?', time: -240 },
  { user: 'Luis Fernández', text: 'Yo la pedí! Votad 🙏', time: -220 },
  { user: 'Carmen Ruiz', text: 'Votado! 👏', time: -200 },
  { user: 'Diego Torres', text: 'Este remix está brutal', time: -150 },
  { user: 'Laura Sánchez', text: 'Quiero Bad Bunny!!', time: -120 },
  { user: 'María García', text: 'Ya está Dakiti en cola', time: -100 },
  { user: 'Javier Moreno', text: '¿Cuánta gente hay? Esto está lleno', time: -80 },
  { user: 'Pedro López', text: '47 dice arriba', time: -60 },
  { user: 'Ana Martín', text: 'Increíble 😍', time: -45 },
  { user: 'Luis Fernández', text: 'Alguien más desde Madrid?', time: -30 },
  { user: 'Carmen Ruiz', text: 'Yo! Malasaña 🖐️', time: -20 },
  { user: 'Diego Torres', text: 'Lavapiés presente', time: -10 },
  { user: 'María García', text: 'ESTO ES WHATSOUND 🎵🎉', time: -5 },
];

const DEMO_TIPS = [
  { amount: 50, from: 'María García' },
  { amount: 20, from: 'Pedro López' },
  { amount: 10, from: 'Ana Martín' },
  { amount: 100, from: 'VIP_User' },
  { amount: 5, from: 'Luis Fernández' },
  { amount: 15, from: 'Carmen Ruiz' },
  { amount: 10, from: 'Diego Torres' },
  { amount: 5, from: 'Laura Sánchez' },
  { amount: 19, from: 'Javier Moreno' },
  // Total: €234
];

// ═══════════════════════════════════════════════════════════
// FUNCIONES DE SEED
// ═══════════════════════════════════════════════════════════

async function clearDemoData() {
  console.log('🧹 Limpiando datos de demo anteriores...');
  
  // Limpiar en orden inverso de dependencias
  await supabase.from('ws_tips').delete().eq('session_id', DEMO_SESSION.id);
  await supabase.from('ws_messages').delete().eq('session_id', DEMO_SESSION.id);
  await supabase.from('ws_votes').delete().eq('session_id', DEMO_SESSION.id);
  await supabase.from('ws_songs').delete().eq('session_id', DEMO_SESSION.id);
  await supabase.from('ws_session_members').delete().eq('session_id', DEMO_SESSION.id);
  await supabase.from('ws_sessions').delete().eq('id', DEMO_SESSION.id);
  await supabase.from('ws_profiles').delete().eq('is_seed', true);
  
  console.log('✅ Datos anteriores limpiados');
}

async function seedDJ() {
  console.log('🎧 Creando DJ...');
  
  const { error } = await supabase.from('ws_profiles').upsert(DEMO_DJ);
  if (error) throw error;
  
  console.log('✅ DJ Carlos Madrid creado');
}

async function seedListeners() {
  console.log('👥 Creando oyentes simulados...');
  
  const listeners = [];
  
  // Oyentes con nombre
  for (let i = 0; i < DEMO_LISTENERS.length; i++) {
    listeners.push({
      id: `listener-${i}`,
      display_name: DEMO_LISTENERS[i].display_name,
      username: DEMO_LISTENERS[i].display_name.toLowerCase().replace(' ', ''),
      avatar_url: DEMO_LISTENERS[i].avatar,
      is_seed: true,
    });
  }
  
  // Oyentes anónimos (para llegar a 47)
  for (let i = DEMO_LISTENERS.length; i < 47; i++) {
    listeners.push({
      id: `listener-${i}`,
      display_name: `Usuario${i}`,
      username: `user${i}`,
      is_seed: true,
    });
  }
  
  const { error } = await supabase.from('ws_profiles').upsert(listeners);
  if (error) throw error;
  
  console.log(`✅ ${listeners.length} oyentes creados`);
}

async function seedSession() {
  console.log('🎵 Creando sesión...');
  
  const { error } = await supabase.from('ws_sessions').upsert({
    ...DEMO_SESSION,
    dj_id: DEMO_DJ.id,
    started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // Empezó hace 45 min
  });
  if (error) throw error;
  
  console.log('✅ Sesión Viernes Latino creada');
}

async function seedMembers() {
  console.log('👥 Añadiendo miembros a la sesión...');
  
  const members = [];
  for (let i = 0; i < 47; i++) {
    members.push({
      session_id: DEMO_SESSION.id,
      user_id: `listener-${i}`,
      joined_at: new Date(Date.now() - Math.random() * 45 * 60 * 1000).toISOString(),
    });
  }
  
  const { error } = await supabase.from('ws_session_members').upsert(members);
  if (error) throw error;
  
  console.log('✅ 47 miembros añadidos');
}

async function seedSongs() {
  console.log('🎶 Añadiendo canciones a la cola...');
  
  const songs = DEMO_SONGS.map((song, i) => ({
    id: `song-${i}`,
    session_id: DEMO_SESSION.id,
    title: song.title,
    artist: song.artist,
    status: song.status,
    votes_count: song.votes,
    requested_by: `listener-${i % 8}`,
    added_at: new Date(Date.now() - (DEMO_SONGS.length - i) * 5 * 60 * 1000).toISOString(),
  }));
  
  const { error } = await supabase.from('ws_songs').upsert(songs);
  if (error) throw error;
  
  console.log(`✅ ${songs.length} canciones añadidas`);
}

async function seedMessages() {
  console.log('💬 Añadiendo mensajes de chat...');
  
  const messages = DEMO_MESSAGES.map((msg, i) => ({
    id: `msg-${i}`,
    session_id: DEMO_SESSION.id,
    user_id: `listener-${i % 8}`,
    content: msg.text,
    created_at: new Date(Date.now() + msg.time * 1000).toISOString(),
  }));
  
  const { error } = await supabase.from('ws_messages').upsert(messages);
  if (error) throw error;
  
  console.log(`✅ ${messages.length} mensajes añadidos`);
}

async function seedTips() {
  console.log('💰 Añadiendo propinas...');
  
  const tips = DEMO_TIPS.map((tip, i) => ({
    id: `tip-${i}`,
    session_id: DEMO_SESSION.id,
    dj_id: DEMO_DJ.id,
    tipper_id: `listener-${i}`,
    amount: tip.amount / 100, // Convertir centavos a euros
    currency: 'EUR',
    payment_status: 'succeeded',
    created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Última semana
  }));
  
  const { error } = await supabase.from('ws_tips').upsert(tips);
  if (error) throw error;
  
  const total = DEMO_TIPS.reduce((sum, t) => sum + t.amount, 0) / 100;
  console.log(`✅ €${total} en propinas añadidas`);
}

// ═══════════════════════════════════════════════════════════
// EJECUCIÓN
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('🚀 WhatsSound — Seed Demo Data\n');
  
  try {
    await clearDemoData();
    await seedDJ();
    await seedListeners();
    await seedSession();
    await seedMembers();
    await seedSongs();
    await seedMessages();
    await seedTips();
    
    console.log('\n✅ ¡Datos de demo cargados correctamente!');
    console.log('\n📱 Abre la app y ve a "Viernes Latino 🔥"');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
